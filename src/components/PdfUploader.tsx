import React, { useState, useRef } from 'react';
import { FileUp, Sparkles, CheckCircle2, AlertCircle, Loader2, X, FileText, ArrowRight } from 'lucide-react';
import { NoteRecord } from '../types';

interface PdfUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onNotesExtracted: (notes: NoteRecord[], sourceFilename: string) => void;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  isOpen,
  onClose,
  onNotesExtracted,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [previewNotes, setPreviewNotes] = useState<NoteRecord[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.type === 'application/pdf' || dropped.name.toLowerCase().endsWith('.pdf')) {
        setFile(dropped);
        setError(null);
      } else {
        setError('Por favor selecciona un archivo en formato PDF.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf')) {
        setFile(selected);
        setError(null);
      } else {
        setError('Por favor selecciona un archivo en formato PDF.');
      }
    }
  };

  const convertFileToBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        resolve(res);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(f);
    });
  };

  const handleAnalyzePdf = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProcessStep('Leyendo archivo PDF...');

    try {
      const base64 = await convertFileToBase64(file);
      setProcessStep('Enviando a Gemini AI para extracción estructurada de las 18 columnas...');

      const response = await fetch('/api/analyze-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64: base64,
          filename: file.name,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Ocurrió un error al procesar el PDF con la inteligencia artificial.');
      }

      setProcessStep('¡Extracción completada con éxito!');
      setPreviewNotes(data.notes || []);
    } catch (err: any) {
      console.error('Error al analizar PDF:', err);
      const msg = err.message || 'No se pudo analizar el PDF. Verifica la conexión o el formato del archivo.';
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAddNotes = () => {
    if (previewNotes && previewNotes.length > 0) {
      onNotesExtracted(previewNotes, file?.name || 'Documento PDF');
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setPreviewNotes(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-purple-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-800 flex items-center justify-center text-purple-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Captura Automática desde PDF con IA</h2>
              <p className="text-xs text-purple-200">
                Analiza síntesis informativas y extrae cada nota en las 18 columnas requeridas
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-purple-300 hover:text-white p-1 rounded-lg hover:bg-purple-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!previewNotes ? (
            <>
              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-purple-600 bg-purple-50/70 scale-[1.01]'
                    : file
                    ? 'border-purple-400 bg-purple-50/30'
                    : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-slate-800">{file.name}</div>
                    <div className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF</div>
                    <span className="text-xs text-purple-700 font-medium mt-1">Haz clic o arrastra para cambiar archivo</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                      <FileUp className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-slate-800">
                      Arrastra tu PDF de Síntesis Informativa aquí
                    </div>
                    <div className="text-xs text-slate-500">
                      O haz clic para explorar en tu equipo (ej. Síntesis Martes 8 de septiembre)
                    </div>
                  </div>
                )}
              </div>

              {/* Status / Loading display */}
              {isProcessing && (
                <div className="bg-slate-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-purple-700 animate-spin shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800">{processStep}</p>
                    <p className="text-slate-500">
                      Gemini está evaluando los 18 campos: Relevancia RTP, Sentimiento (🔴, 🟢, 🟡), Medios Impresos, Digitales, etc.
                    </p>
                  </div>
                </div>
              )}

              {/* Error message with retry action */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col gap-3 text-rose-900 text-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-rose-950">Error al procesar el archivo</span>
                      <p className="text-rose-800 mt-0.5">{error}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-200/60">
                    {file && (
                      <button
                        type="button"
                        onClick={handleAnalyzePdf}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Reintentar análisis ahora</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Results preview before confirming */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Se extrajeron {previewNotes.length} notas periodísticas del documento</span>
                </div>
                <button
                  onClick={() => setPreviewNotes(null)}
                  className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
                >
                  Cambiar archivo
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-200">
                {previewNotes.map((note, index) => (
                  <div key={note.id || index} className="p-3 hover:bg-slate-50 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 line-clamp-1">{note.tituloNota}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            note.esRelevanteRTP === 'Sí'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          RTP Relevante: {note.esRelevanteRTP}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            note.sentimiento === 'Positivo'
                              ? 'bg-emerald-100 text-emerald-800'
                              : note.sentimiento === 'Negativo'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {note.sentimiento}
                        </span>
                      </div>
                    </div>
                    <div className="text-slate-500 text-[11px] flex flex-wrap gap-x-3">
                      <span><strong>Fecha:</strong> {note.fecha}</span>
                      <span><strong>Tema:</strong> {note.temaNota}</span>
                      <span><strong>Autor:</strong> {note.autor}</span>
                    </div>
                    <p className="text-slate-600 line-clamp-2 italic">{note.resumenNota}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {!previewNotes ? (
            <button
              type="button"
              disabled={!file || isProcessing}
              onClick={handleAnalyzePdf}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer ${
                !file || isProcessing
                  ? 'bg-purple-300 text-white cursor-not-allowed'
                  : 'bg-purple-700 hover:bg-purple-800 text-white active:scale-95'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analizando con IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Iniciar Análisis del PDF</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmAddNotes}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-all cursor-pointer"
            >
              <span>Incorporar {previewNotes.length} Notas a la Tabla</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
