import React from 'react';
import { Bus, FileSpreadsheet, Download, Sparkles, Trash2, BarChart3, Table as TableIcon } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'table';
  setActiveTab: (tab: 'dashboard' | 'table') => void;
  totalNotes: number;
  relevantNotes: number;
  onOpenPdfModal: () => void;
  onOpenExcelModal: () => void;
  onExportExcel: () => void;
  onClearAllNotes: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  totalNotes,
  relevantNotes,
  onOpenPdfModal,
  onOpenExcelModal,
  onExportExcel,
  onClearAllNotes,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top institution bar */}
      <div className="bg-purple-950 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold tracking-wide">
            <span className="bg-purple-800 text-purple-200 px-2 py-0.5 rounded text-[11px] font-bold">CDMX</span>
            <span>RED DE TRANSPORTE DE PASAJEROS (RTP)</span>
          </div>
          <span className="text-purple-300 hidden sm:inline">•</span>
          <span className="text-purple-200 hidden sm:inline">Gerencia de Proyectos Institucionales & Monitoreo de Medios</span>
        </div>
        <div className="flex items-center gap-4 text-purple-200">
          {totalNotes > 0 ? (
            <button
              onClick={onClearAllNotes}
              className="text-purple-200 hover:text-rose-300 flex items-center gap-1 transition-colors text-xs font-medium cursor-pointer"
              title="Eliminar todas las notas capturadas y limpiar la base de datos"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar todas las notas</span>
            </button>
          ) : (
            <span className="text-purple-300 text-[11px]">Base de datos lista para nuevas capturas</span>
          )}
        </div>
      </div>

      {/* Main navigation & actions */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-md shadow-purple-200 shrink-0">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Síntesis y Monitoreo de Medios</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-800 border border-purple-200">
                RTP
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Captura automática de 18 columnas desde PDF, gestión en Excel y análisis estadístico
            </p>
          </div>
        </div>

        {/* View toggles & action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tab buttons */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center border border-slate-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-purple-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
              <span>Gráficas y Filtros</span>
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'table'
                  ? 'bg-white text-purple-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-purple-600" />
              <span>Tabla de Columnas</span>
              <span className="ml-1 text-[10px] bg-slate-200 text-slate-700 rounded-full px-1.5 py-0.2">
                {totalNotes}
              </span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPdfModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 active:scale-95 text-white text-xs font-medium shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              <span>Analizar PDF</span>
            </button>

            <button
              onClick={onOpenExcelModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-medium shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Subir Excel</span>
            </button>

            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-medium border border-slate-300 transition-all cursor-pointer"
              title="Descargar archivo Excel con las 18 columnas"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
