import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini AI client initialization helper
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('La clave GEMINI_API_KEY no está configurada en las variables de entorno.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to clean JSON string from model response
function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }
  return cleaned.trim();
}

// Resilient execution with retries and fallback models for 503/429 spikes
async function generateContentWithRetryAndFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    systemInstruction: string;
    responseSchema: any;
  }
): Promise<{ text: string; modelUsed: string }> {
  // Chain of supported models from SKILL.md
  const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini AI] Procesando con modelo: ${model} (intento ${attempt}/2)...`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: params.responseSchema,
          },
        });

        if (response && response.text) {
          console.log(`[Gemini AI] Éxito con modelo: ${model}`);
          return { text: response.text, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient =
          err?.status === 503 ||
          err?.code === 503 ||
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED');

        console.warn(`[Gemini AI] Advertencia con modelo ${model} (intento ${attempt}):`, errMsg);

        if (isTransient) {
          // Wait briefly with backoff before next attempt
          const waitTime = attempt * 1200;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          // Move to next candidate model immediately if error is not transient
          break;
        }
      }
    }
  }

  throw lastError || new Error('No se pudo procesar la solicitud tras intentar con varios modelos.');
}

// Endpoint to analyze PDF Synthesis of Press / News notes for RTP
app.post('/api/analyze-pdf', async (req, res) => {
  try {
    const { pdfBase64, textContent, filename, documentDate } = req.body;

    if (!pdfBase64 && !textContent) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar un archivo PDF en formato base64 o texto del documento.',
      });
    }

    const ai = getGeminiClient();

    const systemInstruction = `
Eres un especialista experto en monitoreo de medios, análisis de prensa y síntesis informativa para la Red de Transporte de Pasajeros de la Ciudad de México (RTP).
Tu misión es procesar el documento de Síntesis Informativa y capturar exhaustivamente cada una de las notas periodísticas, boletines o menciones en las 18 columnas exactas solicitadas.

Reglas estrictas de extracción:
1. "ano": Número entero (ej. 2026). Si no se especifica en la nota, toma el año del encabezado o fecha general de la síntesis informativa.
2. "numMes": Número del mes de 1 a 12 (ej. 9 para septiembre).
3. "mes": Nombre del mes con mayúscula inicial (ej. "Septiembre").
4. "fecha": Formato YYYY-MM-DD (ej. "2026-09-08" o "2026-09-07").
5. "tituloNota": Título completo, claro y descriptivo de la nota.
6. "esRelevanteRTP": 'Sí' o 'No'. Debe ser 'Sí' si menciona explícitamente a RTP, autobuses de RTP, servicio de apoyo de RTP, rutas escolares 'Sendero Seguro / Jóvenes Seguros', electromovilidad con unidades RTP (como Heroínas Indígenas), o directivos/operación de RTP. Es 'No' si trata únicamente de otros transportes (Metro, Metrobús sin RTP, Trolebús sin mención a RTP, corralones generales, etc.).
7. "temaNota": Tema temático concreto (ej. "Sendero Seguro", "Electromovilidad y Obras", "Averías STC Metro", "Reglamento de Tránsito", "Aniversario Metro", etc.).
8. "campana": Nombre de la campaña o estrategia identificada (ej. "Camino Seguro: Jóvenes Seguros", "Segundo Informe de Gobierno", "57 Aniversario Metro", o "N/A" si no aplica).
9. "radio": MEDIOS ELECTRÓNICOS TRADICIONALES: RADIO * -> Nombre de la estación/programa si se menciona radio (ej. "Radio Red 88.1", "Radio Fórmula"), o "No".
10. "television": MEDIOS ELECTRÓNICOS TRADICIONALES: TELEVISIÓN * -> Nombre del canal o noticiero de TV si se menciona (ej. "Canal 6 Telediario", "ADN 40"), o "No".
11. "digitales": MEDIOS DE COMUNICACIÓN DIGITALES (Internet: portales de noticias, canales digitales) * -> Nombre de portales web (ej. "Regeneración CDMX", "Publimetro Digital", "El Universal Online", "Reforma.com"), o "No".
12. "impresos": MEDIOS IMPRESOS (Periódicos y revistas) * -> Diarios impresos listados (ej. "El Universal, El Gráfico", "La Jornada, Reforma, Metro", "24 Horas", "Publimetro", "La Prensa, El Sol de México"), o "No".
13. "otros": OTROS (Twitter, Facebook, YouTube, TikTok, etc.) -> Enlaces o menciones de redes (ej. "Twitter/X @regeneracioncdm", "Facebook"), o "No".
14. "sentimiento": Clasificación: "Positivo", "Negativo" o "Informativo". Si el PDF tiene viñetas de colores:
    - 🔴 Círculo rojo = "Negativo"
    - 🟢 Círculo verde = "Positivo"
    - 🟡 Círculo amarillo = "Informativo"
15. "link": URL web completa encontrada en la nota (enlace de Drive, enlace de Twitter/X, portal).
16. "autor": Nombre del reportero, columnista o "Redacción" / "Sin autor".
17. "publicacionBoletin": 'Sí' si se identifica como boletín o comunicado oficial institucional; de lo contrario 'No'.
18. "resumenNota": Resumen objetivo y sustancioso (2-4 renglones) que sintetice los hechos clave y cualquier impacto o relación con RTP y la movilidad.

Asegúrate de NO omitir ninguna nota del documento.
`;

    const contentsParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (pdfBase64) {
      // Remove any data URL prefix if present
      const cleanBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, '');
      contentsParts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanBase64,
        },
      });
    }

    let promptText = `Por favor analiza este documento de Síntesis Informativa ${filename ? `(${filename})` : ''} ${
      documentDate ? `con fecha de referencia ${documentDate}` : ''
    }. Extrae todas las notas en el arreglo JSON estructurado.`;

    if (textContent) {
      promptText += `\n\nTexto adicional del documento:\n${textContent}`;
    }

    contentsParts.push({ text: promptText });

    const responseSchema = {
      type: Type.ARRAY,
      description: 'Lista de notas periodísticas capturadas en las columnas correspondientes.',
      items: {
        type: Type.OBJECT,
        properties: {
          ano: { type: Type.INTEGER, description: 'Año numérico (ej. 2026)' },
          numMes: { type: Type.INTEGER, description: 'Número de mes (1 al 12)' },
          mes: { type: Type.STRING, description: 'Nombre del mes (ej. Septiembre)' },
          fecha: { type: Type.STRING, description: 'Fecha YYYY-MM-DD' },
          tituloNota: { type: Type.STRING, description: 'Título de la nota' },
          esRelevanteRTP: { type: Type.STRING, description: 'Sí o No' },
          temaNota: { type: Type.STRING, description: 'Tema de la nota' },
          campana: { type: Type.STRING, description: 'Campaña o N/A' },
          radio: { type: Type.STRING, description: 'Estación de radio o No' },
          television: { type: Type.STRING, description: 'Canal de TV o No' },
          digitales: { type: Type.STRING, description: 'Portales de noticias digitales o No' },
          impresos: { type: Type.STRING, description: 'Diarios impresos o No' },
          otros: { type: Type.STRING, description: 'Twitter, Facebook, YouTube o No' },
          sentimiento: { type: Type.STRING, description: 'Informativo / Positivo / Negativo' },
          link: { type: Type.STRING, description: 'Enlace web o de drive' },
          autor: { type: Type.STRING, description: 'Autor o Redacción' },
          publicacionBoletin: { type: Type.STRING, description: 'Sí o No' },
          resumenNota: { type: Type.STRING, description: 'Resumen conciso de la nota' },
        },
        required: [
          'ano',
          'numMes',
          'mes',
          'fecha',
          'tituloNota',
          'esRelevanteRTP',
          'temaNota',
          'campana',
          'radio',
          'television',
          'digitales',
          'impresos',
          'otros',
          'sentimiento',
          'link',
          'autor',
          'publicacionBoletin',
          'resumenNota',
        ],
      },
    };

    const { text: responseText, modelUsed } = await generateContentWithRetryAndFallback(ai, {
      contents: { parts: contentsParts },
      systemInstruction,
      responseSchema,
    });

    const cleanedText = cleanJsonString(responseText || '[]');
    let extractedNotes = [];
    try {
      extractedNotes = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error('Error parsing Gemini JSON output:', parseErr, responseText);
      return res.status(500).json({
        success: false,
        error: 'Error al interpretar la respuesta estructurada de la inteligencia artificial.',
        raw: responseText,
      });
    }

    // Assign unique IDs to notes
    const now = new Date().toISOString().split('T')[0];
    const formattedNotes = extractedNotes.map((note: any, idx: number) => ({
      ...note,
      id: `captured-${Date.now()}-${idx + 1}`,
      fuentePdf: filename || 'Documento PDF procesado',
      fechaCaptura: now,
    }));

    res.json({
      success: true,
      count: formattedNotes.length,
      notes: formattedNotes,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Error en /api/analyze-pdf:', error);
    const isOverload =
      error?.status === 503 ||
      error?.code === 503 ||
      String(error?.message || '').includes('high demand') ||
      String(error?.message || '').includes('UNAVAILABLE');

    res.status(isOverload ? 503 : 500).json({
      success: false,
      isOverload,
      error: isOverload
        ? 'Los servidores de Gemini experimentaron una saturación temporal de demanda (503). Por favor presiona "Reintentar análisis" para procesar de nuevo.'
        : (error?.message || 'Error interno al procesar el archivo con Gemini AI.'),
    });
  }
});

async function startServer() {
  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor RTP ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
