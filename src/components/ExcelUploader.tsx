import React, { useState, useRef } from 'react';
import { FileSpreadsheet, Download, CheckCircle2, AlertCircle, X, FileUp, ArrowRight } from 'lucide-react';
import { NoteRecord } from '../types';
import { parseExcelFile, exportNotesToExcel } from '../utils/excel';

interface ExcelUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onNotesImported: (notes: NoteRecord[], mode: 'append' | 'replace') => void;
}

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({
  isOpen,
  onClose,
  onNotesImported,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedNotes, setParsedNotes] = useState<NoteRecord[] | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (f: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some(ext => f.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setError('Por favor selecciona un archivo de Excel válido (.xlsx, .xls o .csv).');
      return;
    }

    setFile(f);
    setError(null);

    try {
      const buffer = await f.arrayBuffer();
      const { notes } = parseExcelFile(buffer);
      if (notes.length === 0) {
        setError('El archivo no contiene filas de datos o las columnas no pudieron ser identificadas.');
        setParsedNotes(null);
      } else {
        setParsedNotes(notes);
      }
    } catch (err: any) {
      console.error('Error al leer Excel:', err);
      setError(err.message || 'No se pudo leer el archivo Excel.');
      setParsedNotes(null);
    }
  };

  const handleConfirm = () => {
    if (parsedNotes && parsedNotes.length > 0) {
      onNotesImported(parsedNotes, importMode);
      handleClose();
    }
  };

  const handleDownloadTemplate = () => {
    exportNotesToExcel([], 'Plantilla_Columnas_Monitoreo_RTP.xlsx');
  };

  const handleClose = () => {
    setFile(null);
    setParsedNotes(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-800 flex items-center justify-center text-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Subir Archivo Excel</h2>
              <p className="text-xs text-emerald-200">
                Importa bases de datos históricas de monitoreo en formato .xlsx o .csv
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!parsedNotes ? (
            <>
              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-emerald-600 bg-emerald-50/70 scale-[1.01]'
                    : file
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    Arrastra tu archivo Excel (.xlsx / .csv) aquí
                  </div>
                  <div className="text-xs text-slate-500">
                    O haz clic para seleccionarlo de tu computadora
                  </div>
                </div>
              </div>

              {/* Template download advice */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 block">
                    ¿Necesitas el formato exacto de las 18 columnas?
                  </span>
                  <span className="text-slate-500">
                    Descarga la plantilla con encabezados oficiales (Año, # Mes, Mes, Fecha, RTP Relevante, etc.)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Descargar Plantilla</span>
                </button>
              </div>

              {/* Error display */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Error al procesar el archivo</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Parsed rows preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Se detectaron {parsedNotes.length} registros listos para importar</span>
                </div>
                <button
                  onClick={() => {
                    setParsedNotes(null);
                    setFile(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
                >
                  Elegir otro archivo
                </button>
              </div>

              {/* Mode choice: append vs replace */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                <span className="font-semibold text-slate-800 block">¿Cómo deseas integrar los datos?</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                    importMode === 'append'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Agregar a los datos actuales</span>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                    importMode === 'replace'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Reemplazar tabla completa</span>
                  </label>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-200">
                {parsedNotes.slice(0, 5).map((note, index) => (
                  <div key={index} className="p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 line-clamp-1">{note.tituloNota}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                        {note.fecha}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] flex gap-3">
                      <span>RTP Relevante: <strong>{note.esRelevanteRTP}</strong></span>
                      <span>Sentimiento: <strong>{note.sentimiento}</strong></span>
                      <span>Tema: {note.temaNota}</span>
                    </div>
                  </div>
                ))}
                {parsedNotes.length > 5 && (
                  <div className="p-2 text-center text-xs text-slate-500 bg-slate-50 font-medium">
                    + {parsedNotes.length - 5} registros adicionales...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {parsedNotes && (
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer"
            >
              <span>Importar {parsedNotes.length} Notas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
