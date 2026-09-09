import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  ArrowUpDown,
  ExternalLink,
  Edit2,
  Trash2,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  HelpCircle,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import { NoteRecord, FilterState, COLUMN_DEFINITIONS } from '../types';
import { exportNotesToExcel } from '../utils/excel';

interface NotesTableProps {
  notes: NoteRecord[];
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onEditNote: (note: NoteRecord) => void;
  onDeleteNote: (id: string) => void;
  onDeleteMultipleNotes?: (ids: string[]) => void;
  onAddNewNote: () => void;
  onExportExcel: () => void;
}

type SortField = 'fecha' | 'ano' | 'numMes' | 'tituloNota' | 'esRelevanteRTP' | 'sentimiento';
type SortOrder = 'asc' | 'desc';

export const NotesTable: React.FC<NotesTableProps> = ({
  notes,
  filters,
  onFilterChange,
  onEditNote,
  onDeleteNote,
  onDeleteMultipleNotes,
  onAddNewNote,
  onExportExcel,
}) => {
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Filter by Año
      if (filters.ano !== 'all' && String(n.ano) !== String(filters.ano)) {
        return false;
      }
      // Filter by Mes
      if (filters.mes !== 'all') {
        const matchesNum = String(n.numMes) === String(filters.mes);
        const matchesName = n.mes.toLowerCase() === String(filters.mes).toLowerCase();
        if (!matchesNum && !matchesName) return false;
      }
      // Filter by Relevancia RTP
      if (filters.relevancia !== 'all') {
        const isRel = n.esRelevanteRTP.toLowerCase().startsWith('s');
        if (filters.relevancia === 'Sí' && !isRel) return false;
        if (filters.relevancia === 'No' && isRel) return false;
      }
      // Filter by Sentimiento
      if (filters.sentimiento !== 'all' && n.sentimiento !== filters.sentimiento) {
        return false;
      }
      // Search term
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return (
          n.tituloNota.toLowerCase().includes(term) ||
          n.temaNota.toLowerCase().includes(term) ||
          n.resumenNota.toLowerCase().includes(term) ||
          n.autor.toLowerCase().includes(term) ||
          n.campana.toLowerCase().includes(term) ||
          n.impresos.toLowerCase().includes(term) ||
          n.digitales.toLowerCase().includes(term) ||
          n.radio.toLowerCase().includes(term) ||
          n.television.toLowerCase().includes(term) ||
          n.otros.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [notes, filters]);

  // Sort notes
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredNotes, sortField, sortOrder]);

  // Clean up selectedIds if notes are deleted externally
  useEffect(() => {
    const existingIds = new Set(notes.map((n) => n.id));
    setSelectedIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (existingIds.has(id)) next.add(id);
      });
      return next.size !== prev.size ? next : prev;
    });
  }, [notes]);

  // Multi-selection helper calculations
  const visibleIds = useMemo(() => sortedNotes.map((n) => n.id), [sortedNotes]);
  const isAllVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const isSomeVisibleSelected =
    visibleIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        isSomeVisibleSelected && !isAllVisibleSelected;
    }
  }, [isSomeVisibleSelected, isAllVisibleSelected]);

  const handleToggleSelectRow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      // Deselect all visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Select all visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;

    const count = idsToDelete.length;
    const confirmMessage =
      count === 1
        ? '¿Estás seguro de que deseas eliminar la nota seleccionada?'
        : `¿Estás seguro de que deseas eliminar las ${count} notas seleccionadas al mismo tiempo? Esta acción no se puede deshacer.`;

    if (window.confirm(confirmMessage)) {
      if (onDeleteMultipleNotes) {
        onDeleteMultipleNotes(idsToDelete);
      } else {
        idsToDelete.forEach((id) => onDeleteNote(id));
      }
      setSelectedIds(new Set());
    }
  };

  const handleExportSelected = () => {
    const selectedList = notes.filter((n) => selectedIds.has(n.id));
    if (selectedList.length === 0) return;
    exportNotesToExcel(
      selectedList,
      `Notas_Seleccionadas_RTP_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Table toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex flex-wrap items-center gap-2 grow max-w-2xl">
          {/* Search bar */}
          <div className="relative grow min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
              placeholder="Buscar por título, tema, autor, medio, resumen..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            />
            {filters.searchTerm && (
              <button
                onClick={() => onFilterChange({ searchTerm: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick filter pills */}
          <select
            value={filters.relevancia}
            onChange={(e) => onFilterChange({ relevancia: e.target.value })}
            className="text-xs py-2 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">RTP Relevante: Todas</option>
            <option value="Sí">RTP Relevante: Sí</option>
            <option value="No">RTP Relevante: No</option>
          </select>

          <select
            value={filters.sentimiento}
            onChange={(e) => onFilterChange({ sentimiento: e.target.value })}
            className="text-xs py-2 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">Sentimiento: Todos</option>
            <option value="Positivo">🟢 Positivo</option>
            <option value="Informativo">🟡 Informativo</option>
            <option value="Negativo">🔴 Negativo</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer animate-in fade-in"
              title={`Eliminar las ${selectedIds.size} notas seleccionadas`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Borrar ({selectedIds.size})</span>
            </button>
          )}

          <button
            onClick={onAddNewNote}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Nota</span>
          </button>

          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Exportar registros filtrados a Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar ({sortedNotes.length})</span>
          </button>
        </div>
      </div>

      {/* Floating Selection Banner when items are selected */}
      {selectedIds.size > 0 && (
        <div className="bg-purple-950 text-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-800 shadow-inner animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-800 border border-purple-700 flex items-center justify-center font-bold text-xs shrink-0 text-purple-200">
              {selectedIds.size}
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                <span>{selectedIds.size} {selectedIds.size === 1 ? 'nota seleccionada' : 'notas seleccionadas'}</span>
                <span className="text-[10px] bg-purple-800/80 text-purple-200 px-2 py-0.5 rounded-full font-medium">
                  {selectedIds.size === sortedNotes.length
                    ? 'Todas las de la vista actual'
                    : `${Math.round((selectedIds.size / sortedNotes.length) * 100)}% de la vista`}
                </span>
              </p>
              <p className="text-[11px] text-purple-200">
                Acciones por lote disponibles: eliminación múltiple o exportación selectiva
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Eliminar las notas seleccionadas simultáneamente"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar {selectedIds.size} nota{selectedIds.size > 1 ? 's' : ''}</span>
            </button>

            <button
              type="button"
              onClick={handleExportSelected}
              className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-purple-100 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-800"
              title="Descargar únicamente las notas seleccionadas a un archivo Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar selección a Excel</span>
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="px-2.5 py-1.5 bg-transparent hover:bg-purple-900/80 text-purple-300 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
            >
              Deseleccionar
            </button>
          </div>
        </div>
      )}

      {/* Main Table with all 18 columns */}
      <div className="overflow-x-auto grow max-h-[650px] relative scrollbar-thin">
        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
          {/* Table Header */}
          <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-20 border-b border-slate-300 shadow-xs">
            <tr>
              <th className="p-3 w-16 text-center bg-slate-100 sticky left-0 z-30 shadow-xs border-r border-slate-200">
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="checkbox"
                    ref={headerCheckboxRef}
                    checked={isAllVisibleSelected}
                    onChange={handleToggleSelectAllVisible}
                    title={isAllVisibleSelected ? "Deseleccionar todas las notas visibles" : "Seleccionar todas las notas visibles"}
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-700"
                  />
                  <span>#</span>
                </div>
              </th>
              <th className="p-3 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('ano')}>
                <div className="flex items-center gap-1">
                  <span>Año</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('numMes')}>
                <div className="flex items-center gap-1">
                  <span># Mes</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3">Mes</th>
              <th className="p-3 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('fecha')}>
                <div className="flex items-center gap-1">
                  <span>Fecha</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3 min-w-[260px] cursor-pointer hover:bg-slate-200" onClick={() => handleSort('tituloNota')}>
                <div className="flex items-center gap-1">
                  <span>Título de la nota</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('esRelevanteRTP')}>
                <div className="flex items-center gap-1">
                  <span>RTP, ¿Es relevante?</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3 min-w-[160px]">Tema de la nota</th>
              <th className="p-3 min-w-[140px]">Campaña</th>
              <th className="p-3 min-w-[170px]">RADIO *</th>
              <th className="p-3 min-w-[170px]">TELEVISIÓN *</th>
              <th className="p-3 min-w-[200px]">MEDIOS DIGITALES *</th>
              <th className="p-3 min-w-[180px]">MEDIOS IMPRESOS *</th>
              <th className="p-3 min-w-[160px]">OTROS (Redes)</th>
              <th className="p-3 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('sentimiento')}>
                <div className="flex items-center gap-1">
                  <span>Informativo / Positivo / Negativo</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3">LINK</th>
              <th className="p-3">Autor</th>
              <th className="p-3">PUBLICACIÓN BOLETÍN</th>
              <th className="p-3 min-w-[320px]">RESUMEN DE LA NOTA (RTP)</th>
              <th className="p-3 text-center sticky right-0 bg-slate-100 z-10">Acciones</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {sortedNotes.length > 0 ? (
              sortedNotes.map((note, index) => {
                const isRel = note.esRelevanteRTP.toLowerCase().startsWith('s');
                const isSelected = selectedIds.has(note.id);
                return (
                  <tr
                    key={note.id || index}
                    className={`transition-colors group cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50/90 hover:bg-purple-100/70 border-l-4 border-l-purple-700'
                        : 'hover:bg-purple-50/40'
                    }`}
                    onClick={() => onEditNote(note)}
                  >
                    <td
                      className={`p-3 text-center sticky left-0 z-10 border-r border-slate-200 transition-colors ${
                        isSelected
                          ? 'bg-purple-100/90 text-purple-900 font-bold'
                          : 'bg-white group-hover:bg-purple-50/40 text-slate-500 font-mono text-[11px]'
                      }`}
                      onClick={(e) => handleToggleSelectRow(note.id, e)}
                      title={isSelected ? "Desmarcar selección" : "Seleccionar nota para borrar o exportar"}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelectRow(note.id, e as any)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-700"
                        />
                        <span>{index + 1}</span>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{note.ano}</td>
                    <td className="p-3 text-center font-mono text-slate-600">{note.numMes}</td>
                    <td className="p-3 text-slate-700">{note.mes}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-600">{note.fecha}</td>
                    <td className="p-3 font-semibold text-slate-900 max-w-[320px] truncate" title={note.tituloNota}>
                      {note.tituloNota}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isRel
                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isRel ? <CheckCircle2 className="w-3 h-3 text-purple-700" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                        <span>{note.esRelevanteRTP}</span>
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 max-w-[200px] truncate" title={note.temaNota}>
                      {note.temaNota || 'General'}
                    </td>
                    <td className="p-3 text-slate-600 max-w-[180px] truncate" title={note.campana}>
                      {note.campana || 'N/A'}
                    </td>
                    <td className="p-3 text-slate-600 max-w-[180px] truncate" title={note.radio}>
                      {note.radio || 'No'}
                    </td>
                    <td className="p-3 text-slate-600 max-w-[180px] truncate" title={note.television}>
                      {note.television || 'No'}
                    </td>
                    <td className="p-3 text-slate-600 max-w-[220px] truncate" title={note.digitales}>
                      {note.digitales || 'No'}
                    </td>
                    <td className="p-3 text-slate-600 max-w-[200px] truncate" title={note.impresos}>
                      {note.impresos || 'No'}
                    </td>
                    <td className="p-3 text-slate-600 max-w-[180px] truncate" title={note.otros}>
                      {note.otros || 'No'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          note.sentimiento === 'Positivo'
                            ? 'bg-emerald-100 text-emerald-800'
                            : note.sentimiento === 'Negativo'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <span>
                          {note.sentimiento === 'Positivo'
                            ? '🟢'
                            : note.sentimiento === 'Negativo'
                            ? '🔴'
                            : '🟡'}
                        </span>
                        <span>{note.sentimiento}</span>
                      </span>
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      {note.link ? (
                        <a
                          href={note.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-medium underline text-[11px]"
                          title={note.link}
                        >
                          <span>Ver enlace</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Sin link</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-700 max-w-[150px] truncate" title={note.autor}>
                      {note.autor || 'Redacción'}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          note.publicacionBoletin === 'Sí'
                            ? 'bg-purple-100 text-purple-800'
                            : 'text-slate-500'
                        }`}
                      >
                        {note.publicacionBoletin || 'No'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 max-w-[340px] truncate" title={note.resumenNota}>
                      {note.resumenNota}
                    </td>
                    <td
                      className={`p-3 text-center sticky right-0 border-l border-slate-200 z-10 transition-colors ${
                        isSelected
                          ? 'bg-purple-50/95 group-hover:bg-purple-100/80'
                          : 'bg-white group-hover:bg-purple-50/40'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditNote(note)}
                          className="p-1 hover:bg-purple-100 text-purple-700 rounded transition-colors cursor-pointer"
                          title="Editar fila"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
                          title="Eliminar fila individual"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={20} className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">
                      {notes.length === 0
                        ? 'Aún no hay notas registradas en el sistema'
                        : 'No se encontraron notas con los filtros actuales'}
                    </p>
                    <p className="text-xs text-slate-400 max-w-md">
                      {notes.length === 0
                        ? 'Sube un documento PDF de síntesis informativa o importa un archivo Excel para comenzar a registrar notas en las 18 columnas.'
                        : 'Prueba ajustando los filtros de Año, Mes, Relevancia o el término de búsqueda.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span>Mostrando <strong>{sortedNotes.length}</strong> de <strong>{notes.length}</strong> registros capturados</span>
          {selectedIds.size > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300 animate-in fade-in">
              <span>{selectedIds.size} seleccionada{selectedIds.size > 1 ? 's' : ''}</span>
              <button
                type="button"
                onClick={handleClearSelection}
                className="hover:text-purple-600 ml-1 cursor-pointer"
                title="Quitar selección"
              >
                ✕
              </button>
            </span>
          )}
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">
            <strong>{sortedNotes.filter(n => n.esRelevanteRTP.toLowerCase().startsWith('s')).length}</strong> Relevantes RTP
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">
            <strong>{sortedNotes.filter(n => n.sentimiento === 'Positivo').length}</strong> Positivas / <strong>{sortedNotes.filter(n => n.sentimiento === 'Negativo').length}</strong> Negativas / <strong>{sortedNotes.filter(n => n.sentimiento === 'Informativo').length}</strong> Informativas
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Haz clic en la casilla para seleccionar varias notas o en la fila para editarla
        </div>
      </div>
    </div>
  );
};
