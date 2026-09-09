import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { NotesTable } from './components/NotesTable';
import { PdfUploader } from './components/PdfUploader';
import { ExcelUploader } from './components/ExcelUploader';
import { NoteModal } from './components/NoteModal';
import { NoteRecord, FilterState } from './types';
import { exportNotesToExcel } from './utils/excel';
import { CheckCircle2, Sparkles, FileSpreadsheet, PlusCircle } from 'lucide-react';

const STORAGE_KEY = 'rtp_monitoreo_notas_v2';

export default function App() {
  // Clear any old sample cache from v1
  useEffect(() => {
    try {
      localStorage.removeItem('rtp_monitoreo_notas_v1');
    } catch (e) {}
  }, []);

  // Initialize notes from localStorage without mock data
  const [notes, setNotes] = useState<NoteRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('No se pudo cargar de localStorage:', e);
    }
    return [];
  });

  // Save to localStorage when notes change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn('Error al guardar en localStorage:', e);
    }
  }, [notes]);

  // Tab: 'dashboard' | 'table'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table'>('dashboard');

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    ano: 'all',
    mes: 'all',
    relevancia: 'all',
    sentimiento: 'all',
    searchTerm: '',
  });

  // Modal states
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteRecord | null>(null);

  // Notification banner state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      ano: 'all',
      mes: 'all',
      relevancia: 'all',
      sentimiento: 'all',
      searchTerm: '',
    });
  };

  // PDF Extraction Handler
  const handleNotesExtracted = (newNotes: NoteRecord[], sourceFilename: string) => {
    setNotes((prev) => [...newNotes, ...prev]);
    showToast(`¡Se capturaron exitosamente ${newNotes.length} notas desde ${sourceFilename}!`);
    setActiveTab('table');
  };

  // Excel Import Handler
  const handleNotesImported = (importedNotes: NoteRecord[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setNotes(importedNotes);
      showToast(`¡Se reemplazó la base de datos con ${importedNotes.length} notas del archivo Excel!`);
    } else {
      setNotes((prev) => [...importedNotes, ...prev]);
      showToast(`¡Se agregaron ${importedNotes.length} notas del archivo Excel!`);
    }
    setActiveTab('table');
  };

  // Note CRUD handlers
  const handleSaveNote = (savedNote: NoteRecord) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === savedNote.id);
      if (exists) {
        return prev.map((n) => (n.id === savedNote.id ? savedNote : n));
      } else {
        return [savedNote, ...prev];
      }
    });
    showToast(`Nota "${savedNote.tituloNota.slice(0, 30)}..." guardada.`);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    showToast('Nota eliminada correctamente.');
  };

  const handleDeleteMultipleNotes = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setNotes((prev) => prev.filter((n) => !idSet.has(n.id)));
    showToast(`Se eliminaron ${ids.length} notas seleccionadas correctamente.`);
  };

  const handleAddNewNote = () => {
    setEditingNote(null);
    setIsNoteModalOpen(true);
  };

  const handleEditNote = (note: NoteRecord) => {
    setEditingNote(note);
    setIsNoteModalOpen(true);
  };

  const handleExportExcel = () => {
    const filename = `Monitoreo_Notas_RTP_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportNotesToExcel(notes, filename);
    showToast('Archivo Excel descargado con las 18 columnas oficiales.');
  };

  const handleClearAllNotes = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar todas las notas de la base de datos?')) {
      setNotes([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('rtp_monitoreo_notas_v1');
      } catch (e) {}
      handleResetFilters();
      showToast('Se han eliminado todas las notas de la base de datos.');
    }
  };

  const relevantCount = notes.filter((n) => n.esRelevanteRTP.toLowerCase().startsWith('s')).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-purple-950 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalNotes={notes.length}
        relevantNotes={relevantCount}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        onExportExcel={handleExportExcel}
        onClearAllNotes={handleClearAllNotes}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grow w-full">
        {/* Banner with context */}
        <div className="mb-6 bg-linear-to-r from-purple-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-purple-800 text-purple-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                Módulo Automatizado
              </span>
              <span className="text-xs text-purple-200 font-medium">
                Monitoreo de Prensa Diaria
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold">
              Captura Inteligente y Reporte Estadístico de RTP
            </h2>
            <p className="text-xs text-purple-200 max-w-2xl">
              Sube tus documentos PDF de síntesis informativa para extraer las 18 columnas con IA o sube tu archivo Excel histórico para generar gráficos de Relevancia y Sentimiento filtrados por Año y Mes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-purple-950 hover:bg-purple-50 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>Analizar PDF</span>
            </button>
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-800 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span>Subir Excel</span>
            </button>
            <button
              onClick={handleAddNewNote}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-950/80 hover:bg-purple-950 text-white border border-purple-700/60 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-purple-300" />
              <span>Nueva Nota</span>
            </button>
          </div>
        </div>

        {/* View Switcher: Dashboard or Table */}
        {activeTab === 'dashboard' ? (
          <AnalyticsDashboard
            notes={notes}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onOpenPdfModal={() => setIsPdfModalOpen(true)}
            onOpenExcelModal={() => setIsExcelModalOpen(true)}
          />
        ) : (
          <NotesTable
            notes={notes}
            filters={filters}
            onFilterChange={handleFilterChange}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            onDeleteMultipleNotes={handleDeleteMultipleNotes}
            onAddNewNote={handleAddNewNote}
            onExportExcel={handleExportExcel}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Sistema de Monitoreo de Medios • Red de Transporte de Pasajeros de la Ciudad de México (RTP)
          </span>
          <span className="text-[11px] text-slate-400">
            Columnas oficiales: Año, # Mes, Mes, Fecha, Título, Relevancia RTP, Tema, Campaña, Radio, TV, Digitales, Impresos, Otros, Sentimiento, Link, Autor, Boletín, Resumen.
          </span>
        </div>
      </footer>

      {/* Modals */}
      <PdfUploader
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onNotesExtracted={handleNotesExtracted}
      />

      <ExcelUploader
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onNotesImported={handleNotesImported}
      />

      <NoteModal
        isOpen={isNoteModalOpen}
        note={editingNote}
        onClose={() => {
          setIsNoteModalOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
      />
    </div>
  );
}
