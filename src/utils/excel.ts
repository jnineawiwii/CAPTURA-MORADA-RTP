import * as XLSX from 'xlsx';
import { NoteRecord, COLUMN_DEFINITIONS } from '../types';

export function exportNotesToExcel(notes: NoteRecord[], filename = 'Monitoreo_Notas_RTP.xlsx') {
  let worksheet: XLSX.WorkSheet;

  if (notes.length === 0) {
    const headers = [
      'Año',
      '# Mes',
      'Mes',
      'Fecha',
      'Título de la nota',
      'RTP, ¿Es relevante en la nota?',
      'Tema de la nota',
      'Campaña',
      'MEDIOS ELECTRÓNICOS TRADICIONALES: RADIO *',
      'MEDIOS ELECTRÓNICOS TRADICIONALES: TELEVISIÓN *',
      'MEDIOS DE COMUNICACIÓN DIGITALES (Internet: portales de noticias, canales de tv y radio digitales) *',
      'MEDIOS IMPRESOS (Publicación de inserciones en revistas y periódicos) *',
      'OTROS (Twitter, Facebook, You Tube, etc.).',
      'Informativo / Positivo/ Negativo',
      'LINK',
      'Autor',
      'PUBLICACIÓN BOLETÍN',
      'RESUMEN  DE LA NOTA (RTP)',
    ];
    worksheet = XLSX.utils.aoa_to_sheet([headers]);
  } else {
    // Map records to exact specified column headers
    const data = notes.map((note) => ({
      'Año': note.ano,
      '# Mes': note.numMes,
      'Mes': note.mes,
      'Fecha': note.fecha,
      'Título de la nota': note.tituloNota,
      'RTP, ¿Es relevante en la nota?': note.esRelevanteRTP,
      'Tema de la nota': note.temaNota,
      'Campaña': note.campana,
      'MEDIOS ELECTRÓNICOS TRADICIONALES: RADIO *': note.radio,
      'MEDIOS ELECTRÓNICOS TRADICIONALES: TELEVISIÓN *': note.television,
      'MEDIOS DE COMUNICACIÓN DIGITALES (Internet: portales de noticias, canales de tv y radio digitales) *': note.digitales,
      'MEDIOS IMPRESOS (Publicación de inserciones en revistas y periódicos) *': note.impresos,
      'OTROS (Twitter, Facebook, You Tube, etc.).': note.otros,
      'Informativo / Positivo/ Negativo': note.sentimiento,
      'LINK': note.link,
      'Autor': note.autor,
      'PUBLICACIÓN BOLETÍN': note.publicacionBoletin,
      'RESUMEN  DE LA NOTA (RTP)': note.resumenNota,
    }));
    worksheet = XLSX.utils.json_to_sheet(data);
  }

  // Set column widths
  worksheet['!cols'] = [
    { wch: 8 },  // Año
    { wch: 8 },  // # Mes
    { wch: 14 }, // Mes
    { wch: 13 }, // Fecha
    { wch: 35 }, // Título
    { wch: 15 }, // Relevante RTP
    { wch: 25 }, // Tema
    { wch: 22 }, // Campaña
    { wch: 25 }, // Radio
    { wch: 25 }, // TV
    { wch: 30 }, // Digitales
    { wch: 30 }, // Impresos
    { wch: 25 }, // Otros
    { wch: 16 }, // Sentimiento
    { wch: 35 }, // Link
    { wch: 20 }, // Autor
    { wch: 14 }, // Boletín
    { wch: 50 }, // Resumen
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Monitoreo Prensa RTP');
  XLSX.writeFile(workbook, filename);
}

export function parseExcelFile(arrayBuffer: ArrayBuffer): { notes: NoteRecord[]; totalRows: number } {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('El archivo Excel no contiene hojas de datos.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    return { notes: [], totalRows: 0 };
  }

  const normalizedNotes: NoteRecord[] = rawRows.map((row, idx) => {
    // Match headers flexibly by lowercasing and trimming
    const getVal = (possibleNames: string[], defaultVal: any = '') => {
      for (const [key, val] of Object.entries(row)) {
        const cleanKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        for (const name of possibleNames) {
          const cleanTarget = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          if (cleanKey.includes(cleanTarget) || cleanKey === cleanTarget) {
            return val !== undefined && val !== null ? String(val).trim() : defaultVal;
          }
        }
      }
      return defaultVal;
    };

    // Calculate or parse year & month
    let fecha = getVal(['fecha'], '');
    // If Excel serial number date
    if (typeof fecha === 'number' || (!isNaN(Number(fecha)) && Number(fecha) > 30000 && Number(fecha) < 70000)) {
      const d = new Date((Number(fecha) - 25569) * 86400 * 1000);
      fecha = d.toISOString().split('T')[0];
    }

    const currentYear = new Date().getFullYear();
    const rawAno = getVal(['ano', 'año', 'anio'], '');
    const ano = Number(rawAno) || (fecha ? new Date(fecha).getFullYear() : currentYear) || currentYear;

    const rawNumMes = getVal(['# mes', 'no mes', 'num mes', 'numero mes', 'mes num'], '');
    let numMes = Number(rawNumMes);
    if (!numMes || isNaN(numMes)) {
      if (fecha) {
        const parsed = new Date(fecha);
        numMes = !isNaN(parsed.getMonth()) ? parsed.getMonth() + 1 : 9;
      } else {
        numMes = 9;
      }
    }

    const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    let mes = getVal(['mes'], '');
    if (!mes || !isNaN(Number(mes))) {
      mes = MONTHS[numMes - 1] || 'Septiembre';
    }

    const tituloNota = getVal(['titulo de la nota', 'titulo', 'nota'], `Nota informativa ${idx + 1}`);

    const rawRelevante = getVal(['es relevante en la nota', 'rtp, ¿es relevante', 'relevante', 'es relevante', 'rtp relevante'], 'No');
    const esRelevanteRTP = rawRelevante.toLowerCase().startsWith('s') ? 'Sí' : 'No';

    const temaNota = getVal(['tema de la nota', 'tema'], 'General');
    const campana = getVal(['campana', 'campaña'], 'N/A');

    const radio = getVal(['medios electronicos tradicionales: radio', 'radio'], 'No');
    const television = getVal(['medios electronicos tradicionales: television', 'television', 'tv'], 'No');
    const digitales = getVal(['medios de comunicacion digitales', 'digitales', 'internet', 'portal'], 'No');
    const impresos = getVal(['medios impresos', 'impresos', 'periodicos'], 'No');
    const otros = getVal(['otros (twitter, facebook', 'otros', 'redes'], 'No');

    const rawSentimiento = getVal(['informativo / positivo/ negativo', 'sentimiento', 'tono'], 'Informativo');
    let sentimiento = 'Informativo';
    const sLower = rawSentimiento.toLowerCase();
    if (sLower.includes('pos')) sentimiento = 'Positivo';
    else if (sLower.includes('neg')) sentimiento = 'Negativo';
    else sentimiento = 'Informativo';

    const link = getVal(['link', 'enlace', 'url'], '');
    const autor = getVal(['autor', 'reportero', 'periodista'], 'Redacción');
    const rawBoletin = getVal(['publicacion boletin', 'publicacion boletín', 'boletin', 'boletín'], 'No');
    const publicacionBoletin = rawBoletin.toLowerCase().startsWith('s') ? 'Sí' : 'No';
    const resumenNota = getVal(['resumen  de la nota (rtp)', 'resumen de la nota', 'resumen', 'sintesis'], tituloNota);

    return {
      id: `excel-import-${Date.now()}-${idx + 1}`,
      ano,
      numMes,
      mes,
      fecha: fecha || `${ano}-${String(numMes).padStart(2, '0')}-01`,
      tituloNota,
      esRelevanteRTP,
      temaNota,
      campana,
      radio,
      television,
      digitales,
      impresos,
      otros,
      sentimiento,
      link,
      autor,
      publicacionBoletin,
      resumenNota,
      fuentePdf: 'Archivo Excel importado',
      fechaCaptura: new Date().toISOString().split('T')[0],
    };
  });

  return { notes: normalizedNotes, totalRows: normalizedNotes.length };
}
