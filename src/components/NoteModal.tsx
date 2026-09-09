import React, { useState, useEffect } from 'react';
import { X, Save, ExternalLink, Trash2, Calendar, FileText, CheckCircle, Radio, Tv, Globe, Newspaper } from 'lucide-react';
import { NoteRecord } from '../types';

interface NoteModalProps {
  isOpen: boolean;
  note: NoteRecord | null;
  onClose: () => void;
  onSave: (note: NoteRecord) => void;
  onDelete?: (id: string) => void;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  note,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<NoteRecord | null>(null);

  useEffect(() => {
    if (note) {
      setFormData({ ...note });
    } else {
      const now = new Date();
      const currentMonthNum = now.getMonth() + 1;
      setFormData({
        id: `note-${Date.now()}`,
        ano: now.getFullYear(),
        numMes: currentMonthNum,
        mes: MONTHS[currentMonthNum - 1],
        fecha: now.toISOString().split('T')[0],
        tituloNota: '',
        esRelevanteRTP: 'Sí',
        temaNota: '',
        campana: 'N/A',
        radio: 'No',
        television: 'No',
        digitales: 'No',
        impresos: 'No',
        otros: 'No',
        sentimiento: 'Informativo',
        link: '',
        autor: 'Redacción',
        publicacionBoletin: 'No',
        resumenNota: '',
        fechaCaptura: now.toISOString().split('T')[0],
      });
    }
  }, [note, isOpen]);

  if (!isOpen || !formData) return null;

  const handleChange = (field: keyof NoteRecord, value: any) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };

      // Sync month name when month number changes
      if (field === 'numMes') {
        const num = Number(value);
        if (num >= 1 && num <= 12) {
          updated.mes = MONTHS[num - 1];
        }
      }

      // Sync year and month from date
      if (field === 'fecha' && value) {
        const parts = value.split('-');
        if (parts.length === 3) {
          const yr = Number(parts[0]);
          const mn = Number(parts[1]);
          if (!isNaN(yr)) updated.ano = yr;
          if (!isNaN(mn) && mn >= 1 && mn <= 12) {
            updated.numMes = mn;
            updated.mes = MONTHS[mn - 1];
          }
        }
      }

      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-purple-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-800 flex items-center justify-center text-purple-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {note ? 'Detalle y Edición de la Nota' : 'Registrar Nueva Nota Informativa'}
              </h2>
              <p className="text-xs text-purple-200">
                Gestión exhaustiva de los 18 campos de captura para RTP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white p-1 rounded-lg hover:bg-purple-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto grow">
          {/* Section 1: Fechas y Temporalidad */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-purple-700" />
              <span>1. Temporalidad (Año, Mes, Fecha)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Año</label>
                <input
                  type="number"
                  value={formData.ano}
                  onChange={(e) => handleChange('ano', Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1"># Mes</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={formData.numMes}
                  onChange={(e) => handleChange('numMes', Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mes</label>
                <select
                  value={formData.mes}
                  onChange={(e) => {
                    const idx = MONTHS.indexOf(e.target.value);
                    if (idx !== -1) {
                      handleChange('numMes', idx + 1);
                    }
                    handleChange('mes', e.target.value);
                  }}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-medium cursor-pointer"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fecha (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => handleChange('fecha', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contenido principal y Resumen */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Título de la nota <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.tituloNota}
                onChange={(e) => handleChange('tituloNota', e.target.value)}
                placeholder="Título completo de la nota informativa..."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tema de la nota
                </label>
                <input
                  type="text"
                  value={formData.temaNota}
                  onChange={(e) => handleChange('temaNota', e.target.value)}
                  placeholder="ej. Sendero Seguro, Movilidad, Fallas Metro..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campaña
                </label>
                <input
                  type="text"
                  value={formData.campana}
                  onChange={(e) => handleChange('campana', e.target.value)}
                  placeholder="ej. Camino Seguro: Jóvenes Seguros, N/A..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                RESUMEN DE LA NOTA (RTP) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.resumenNota}
                onChange={(e) => handleChange('resumenNota', e.target.value)}
                placeholder="Resumen ejecutivo del contenido y su relación con el servicio RTP..."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Section 3: Clasificación RTP y Sentimiento */}
          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200">
            <h3 className="text-xs font-bold text-purple-950 uppercase tracking-wider mb-3">
              2. Clasificación Institucional
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1.5">
                  RTP, ¿Es relevante en la nota?
                </label>
                <div className="flex gap-2">
                  {['Sí', 'No'].map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleChange('esRelevanteRTP', opt)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        formData.esRelevanteRTP === opt
                          ? opt === 'Sí'
                            ? 'bg-purple-700 text-white border-purple-700'
                            : 'bg-slate-700 text-white border-slate-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1.5">
                  Informativo / Positivo / Negativo
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { val: 'Positivo', color: 'bg-emerald-600 border-emerald-600 text-white', dot: '🟢' },
                    { val: 'Informativo', color: 'bg-amber-500 border-amber-500 text-white', dot: '🟡' },
                    { val: 'Negativo', color: 'bg-rose-600 border-rose-600 text-white', dot: '🔴' },
                  ].map((s) => (
                    <button
                      type="button"
                      key={s.val}
                      onClick={() => handleChange('sentimiento', s.val)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                        formData.sentimiento === s.val
                          ? s.color
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{s.dot}</span>
                      <span className="hidden sm:inline">{s.val}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1.5">
                  PUBLICACIÓN BOLETÍN
                </label>
                <div className="flex gap-2">
                  {['Sí', 'No'].map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleChange('publicacionBoletin', opt)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        formData.publicacionBoletin === opt
                          ? 'bg-purple-800 text-white border-purple-800'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Canales de Medios */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              3. Medios de Difusión y Canales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-amber-600" />
                  <span>MEDIOS ELECTRÓNICOS: RADIO *</span>
                </label>
                <input
                  type="text"
                  value={formData.radio}
                  onChange={(e) => handleChange('radio', e.target.value)}
                  placeholder="ej. Radio Fórmula, No..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Tv className="w-3 h-3 text-pink-600" />
                  <span>MEDIOS ELECTRÓNICOS: TELEVISIÓN *</span>
                </label>
                <input
                  type="text"
                  value={formData.television}
                  onChange={(e) => handleChange('television', e.target.value)}
                  placeholder="ej. Canal 6 Telediario, ADN 40, No..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-teal-600" />
                  <span>MEDIOS DIGITALES (Internet / Portales) *</span>
                </label>
                <input
                  type="text"
                  value={formData.digitales}
                  onChange={(e) => handleChange('digitales', e.target.value)}
                  placeholder="ej. Regeneración CDMX, Publimetro Web..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Newspaper className="w-3 h-3 text-sky-600" />
                  <span>MEDIOS IMPRESOS (Periódicos / Revistas) *</span>
                </label>
                <input
                  type="text"
                  value={formData.impresos}
                  onChange={(e) => handleChange('impresos', e.target.value)}
                  placeholder="ej. El Universal, La Jornada, Reforma..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  OTROS (Twitter, Facebook, You Tube, etc.)
                </label>
                <input
                  type="text"
                  value={formData.otros}
                  onChange={(e) => handleChange('otros', e.target.value)}
                  placeholder="ej. Twitter/X @regeneracioncdm, No..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Autor y Enlace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Autor</label>
              <input
                type="text"
                value={formData.autor}
                onChange={(e) => handleChange('autor', e.target.value)}
                placeholder="Nombre del articulista o 'Redacción'"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LINK (URL)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => handleChange('link', e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
                {formData.link && (
                  <a
                    href={formData.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 flex items-center justify-center shrink-0"
                    title="Visitar enlace"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {note && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Estás seguro de eliminar esta nota?')) {
                    onDelete(note.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar nota</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
