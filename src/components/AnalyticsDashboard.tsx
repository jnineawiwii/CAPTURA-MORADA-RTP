import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  HelpCircle,
  TrendingUp,
  Radio,
  Tv,
  Globe,
  Newspaper,
  Share2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { NoteRecord, FilterState } from '../types';

interface AnalyticsDashboardProps {
  notes: NoteRecord[];
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onOpenPdfModal: () => void;
  onOpenExcelModal: () => void;
}

const COLORS_RELEVANCE = {
  relevante: '#7e22ce', // Purple for RTP Relevante
  noRelevante: '#94a3b8', // Slate for No Relevante
};

const COLORS_SENTIMENT = {
  positivo: '#16a34a', // Green
  negativo: '#dc2626', // Red
  informativo: '#ca8a04', // Amber/Yellow
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  notes,
  filters,
  onFilterChange,
  onResetFilters,
  onOpenPdfModal,
  onOpenExcelModal,
}) => {
  // Extract unique available years and months from notes
  const { availableYears, availableMonths } = useMemo(() => {
    const yearsSet = new Set<number>();
    const monthsMap = new Map<number, string>();

    notes.forEach((n) => {
      if (n.ano) yearsSet.add(n.ano);
      if (n.numMes && n.mes) {
        monthsMap.set(n.numMes, n.mes);
      }
    });

    const years = Array.from(yearsSet).sort((a, b) => b - a);
    const months = Array.from(monthsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([num, name]) => ({ num, name }));

    return { availableYears: years, availableMonths: months };
  }, [notes]);

  // Filter notes based on current filters
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Filter by Año
      if (filters.ano !== 'all' && String(n.ano) !== String(filters.ano)) {
        return false;
      }
      // Filter by Mes (either by month number or month name)
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
      // Filter by Search Term
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matches =
          n.tituloNota.toLowerCase().includes(term) ||
          n.temaNota.toLowerCase().includes(term) ||
          n.resumenNota.toLowerCase().includes(term) ||
          n.autor.toLowerCase().includes(term) ||
          n.impresos.toLowerCase().includes(term) ||
          n.digitales.toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [notes, filters]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = filteredNotes.length;
    let relevantes = 0;
    let noRelevantes = 0;
    let positivos = 0;
    let negativos = 0;
    let informativos = 0;

    // Cross combinations
    let relPositivos = 0;
    let relNegativos = 0;
    let relInformativos = 0;

    let noRelPositivos = 0;
    let noRelNegativos = 0;
    let noRelInformativos = 0;

    // Media counts
    let radioCount = 0;
    let tvCount = 0;
    let digitalesCount = 0;
    let impresosCount = 0;
    let otrosCount = 0;

    filteredNotes.forEach((n) => {
      const isRel = n.esRelevanteRTP.toLowerCase().startsWith('s');
      if (isRel) relevantes++;
      else noRelevantes++;

      if (n.sentimiento === 'Positivo') {
        positivos++;
        if (isRel) relPositivos++;
        else noRelPositivos++;
      } else if (n.sentimiento === 'Negativo') {
        negativos++;
        if (isRel) relNegativos++;
        else noRelNegativos++;
      } else {
        informativos++;
        if (isRel) relInformativos++;
        else noRelInformativos++;
      }

      if (n.radio && n.radio !== 'No' && n.radio !== 'N/A') radioCount++;
      if (n.television && n.television !== 'No' && n.television !== 'N/A') tvCount++;
      if (n.digitales && n.digitales !== 'No' && n.digitales !== 'N/A') digitalesCount++;
      if (n.impresos && n.impresos !== 'No' && n.impresos !== 'N/A') impresosCount++;
      if (n.otros && n.otros !== 'No' && n.otros !== 'N/A') otrosCount++;
    });

    const relevanciaPct = total > 0 ? Math.round((relevantes / total) * 100) : 0;

    return {
      total,
      relevantes,
      noRelevantes,
      relevanciaPct,
      positivos,
      negativos,
      informativos,
      relPositivos,
      relNegativos,
      relInformativos,
      noRelPositivos,
      noRelNegativos,
      noRelInformativos,
      radioCount,
      tvCount,
      digitalesCount,
      impresosCount,
      otrosCount,
    };
  }, [filteredNotes]);

  // Data for Charts
  const relevanceChartData = useMemo(() => {
    return [
      { name: 'Relevantes RTP (Sí)', value: metrics.relevantes, color: COLORS_RELEVANCE.relevante },
      { name: 'No Relevantes (No)', value: metrics.noRelevantes, color: COLORS_RELEVANCE.noRelevante },
    ];
  }, [metrics]);

  const sentimentChartData = useMemo(() => {
    return [
      { name: 'Positivas 🟢', cantidad: metrics.positivos, fill: COLORS_SENTIMENT.positivo },
      { name: 'Informativas 🟡', cantidad: metrics.informativos, fill: COLORS_SENTIMENT.informativo },
      { name: 'Negativas 🔴', cantidad: metrics.negativos, fill: COLORS_SENTIMENT.negativo },
    ];
  }, [metrics]);

  const crossBreakdownData = useMemo(() => {
    return [
      {
        categoria: 'Relevantes RTP',
        Positivo: metrics.relPositivos,
        Informativo: metrics.relInformativos,
        Negativo: metrics.relNegativos,
      },
      {
        categoria: 'Otras Notas',
        Positivo: metrics.noRelPositivos,
        Informativo: metrics.noRelInformativos,
        Negativo: metrics.noRelNegativos,
      },
    ];
  }, [metrics]);

  const mediaChannelsData = useMemo(() => {
    return [
      { canal: 'Impresos', notas: metrics.impresosCount, fill: '#0284c7' },
      { canal: 'Digitales', notas: metrics.digitalesCount, fill: '#0d9488' },
      { canal: 'Redes / Otros', notas: metrics.otrosCount, fill: '#6366f1' },
      { canal: 'Radio', notas: metrics.radioCount, fill: '#f59e0b' },
      { canal: 'Televisión', notas: metrics.tvCount, fill: '#ec4899' },
    ];
  }, [metrics]);

  const isFiltered =
    filters.ano !== 'all' ||
    filters.mes !== 'all' ||
    filters.relevancia !== 'all' ||
    filters.sentimiento !== 'all' ||
    filters.searchTerm !== '';

  return (
    <div className="space-y-6 pb-12">
      {/* Zero notes prompt banner */}
      {notes.length === 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 text-center space-y-4 shadow-xs">
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-base font-bold text-purple-950">
              Sistema listo para capturar y analizar notas informativas
            </h3>
            <p className="text-xs text-purple-800 leading-relaxed">
              La base de datos está limpia sin notas de ejemplo. Sube tu PDF de Síntesis Informativa para que la IA extraiga automáticamente los 18 campos en sus columnas, o sube tu archivo Excel para generar las gráficas de Relevantes / No Relevantes y Positivo / Negativo / Informativo.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenPdfModal}
              className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>Capturar notas desde PDF con IA</span>
            </button>
            <button
              onClick={onOpenExcelModal}
              className="px-4 py-2 bg-white border border-purple-300 hover:bg-purple-100 text-purple-900 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span>Subir archivo Excel existente</span>
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Filter Controls Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Filtros Estadísticos por Mes y Año</h2>
              <p className="text-xs text-slate-500">
                Segmenta las métricas de Relevancia RTP y Sentimiento de prensa
              </p>
            </div>
          </div>

          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1.5 text-xs text-purple-700 hover:text-purple-900 font-medium px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors w-fit cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Filtros</span>
            </button>
          )}
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          {/* Año filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Año
            </label>
            <div className="relative">
              <select
                value={filters.ano}
                onChange={(e) => onFilterChange({ ano: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="all">Todos los Años ({notes.length} notas)</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Año {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mes filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Mes
            </label>
            <div className="relative">
              <select
                value={filters.mes}
                onChange={(e) => onFilterChange({ mes: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="all">Todos los Meses</option>
                {availableMonths.map((m) => (
                  <option key={m.num} value={m.num}>
                    #{m.num} - {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Relevancia RTP filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              RTP Relevante
            </label>
            <select
              value={filters.relevancia}
              onChange={(e) => onFilterChange({ relevancia: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="all">Todas (Relevantes y No Relevantes)</option>
              <option value="Sí">Solo Relevantes para RTP (Sí)</option>
              <option value="No">No Relevantes para RTP (No)</option>
            </select>
          </div>

          {/* Sentimiento filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Sentimiento / Tono
            </label>
            <select
              value={filters.sentimiento}
              onChange={(e) => onFilterChange({ sentimiento: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="all">Todos los Tonos</option>
              <option value="Positivo">🟢 Positivo</option>
              <option value="Informativo">🟡 Informativo</option>
              <option value="Negativo">🔴 Negativo</option>
            </select>
          </div>
        </div>

        {/* Filter status indicator */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Mostrando: <strong>{filteredNotes.length}</strong> de <strong>{notes.length}</strong> notas registradas</span>
            {isFiltered && (
              <span className="bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded text-[10px]">
                Filtro activo
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            Filtros aplicados a todas las gráficas estadísticas en tiempo real
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Notes */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block">
            Total Notas
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{metrics.total}</span>
            <span className="text-xs text-slate-400">100%</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {filters.mes !== 'all' ? `Mes seleccionado` : `En todo el periodo`}
          </span>
        </div>

        {/* Relevantes RTP */}
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-purple-900">
              Relevantes RTP
            </span>
            <span className="text-[10px] font-bold bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded">
              {metrics.relevanciaPct}%
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-purple-950">{metrics.relevantes}</span>
            <span className="text-xs text-purple-700">notas</span>
          </div>
          <span className="text-[11px] text-purple-800 mt-1 block">
            Impacto directo a RTP
          </span>
        </div>

        {/* Positivas */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-900">
              Positivas 🟢
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-950">{metrics.positivos}</span>
            <span className="text-xs text-emerald-700">
              {metrics.total > 0 ? Math.round((metrics.positivos / metrics.total) * 100) : 0}%
            </span>
          </div>
          <span className="text-[11px] text-emerald-800 mt-1 block">
            Logros y obras
          </span>
        </div>

        {/* Informativas */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-amber-900">
              Informativas 🟡
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-950">{metrics.informativos}</span>
            <span className="text-xs text-amber-700">
              {metrics.total > 0 ? Math.round((metrics.informativos / metrics.total) * 100) : 0}%
            </span>
          </div>
          <span className="text-[11px] text-amber-800 mt-1 block">
            Avisos y agenda
          </span>
        </div>

        {/* Negativas */}
        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-rose-900">
              Negativas 🔴
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-950">{metrics.negativos}</span>
            <span className="text-xs text-rose-700">
              {metrics.total > 0 ? Math.round((metrics.negativos / metrics.total) * 100) : 0}%
            </span>
          </div>
          <span className="text-[11px] text-rose-800 mt-1 block">
            Fallas, quejas o incidentes
          </span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Relevancia RTP (Sí vs No) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-700"></span>
                <span>Distribución: Relevantes vs No Relevantes (RTP)</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {metrics.relevantes} Sí / {metrics.noRelevantes} No
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Identifica cuántas notas en el periodo correspondieron a RTP frente a notas generales de movilidad
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {metrics.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={relevanceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {relevanceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      `${val} notas (${metrics.total > 0 ? ((val / metrics.total) * 100).toFixed(1) : 0}%)`,
                      name,
                    ]}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 text-center">Sin notas para el filtro actual</div>
            )}
          </div>

          <div className="mt-2 pt-3 border-t border-slate-100 grid grid-cols-2 text-center text-xs">
            <div className="p-2 bg-purple-50 rounded-lg mr-1">
              <span className="text-purple-700 font-bold block">{metrics.relevantes} Notas</span>
              <span className="text-slate-500 text-[11px]">Relevantes RTP</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg ml-1">
              <span className="text-slate-700 font-bold block">{metrics.noRelevantes} Notas</span>
              <span className="text-slate-500 text-[11px]">Otros Transportes / Movilidad</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Sentimiento (Positivo, Informativo, Negativo) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Balance de Sentimiento (Positivo / Informativo / Negativo)</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {metrics.total} notas evaluadas
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Basado en las viñetas del documento (🟢 Positivo, 🟡 Informativo, 🔴 Negativo)
            </p>
          </div>

          <div className="h-64 w-full">
            {metrics.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number) => [`${val} notas`, 'Cantidad']}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                    {sentimentChartData.map((entry, index) => (
                      <Cell key={`bar-sentiment-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Sin datos que coincidan con los filtros
              </div>
            )}
          </div>

          <div className="mt-2 pt-3 border-t border-slate-100 grid grid-cols-3 text-center text-xs">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <span className="text-emerald-700 font-bold block">{metrics.positivos}</span>
              <span className="text-slate-500 text-[11px]">Positivas</span>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg mx-1">
              <span className="text-amber-700 font-bold block">{metrics.informativos}</span>
              <span className="text-slate-500 text-[11px]">Informativas</span>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg">
              <span className="text-rose-700 font-bold block">{metrics.negativos}</span>
              <span className="text-slate-500 text-[11px]">Negativas</span>
            </div>
          </div>
        </div>

        {/* Chart 3: Cruce Relevancia x Sentimiento */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-700" />
                <span>Cruce: Sentimiento en Notas de RTP vs Otras Notas</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Compara el tono de las notas donde RTP fue protagonista directo contra notas ajenas
            </p>
          </div>

          <div className="h-64 w-full">
            {metrics.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={crossBreakdownData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="categoria" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                  <Bar dataKey="Positivo" fill={COLORS_SENTIMENT.positivo} stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Informativo" fill={COLORS_SENTIMENT.informativo} stackId="a" />
                  <Bar dataKey="Negativo" fill={COLORS_SENTIMENT.negativo} stackId="a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Sin datos disponibles
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>RTP Relevante: <strong>{metrics.relPositivos}</strong> Pos / <strong>{metrics.relInformativos}</strong> Info / <strong>{metrics.relNegativos}</strong> Neg</span>
            <span className="text-purple-700 font-medium">Categorías apiladas</span>
          </div>
        </div>

        {/* Chart 4: Cobertura por Canales de Medios */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-sky-700" />
                <span>Distribución por Canales de Comunicación</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">Menciones registradas</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Presencia en Medios Impresos, Digitales, Redes Sociales, Radio y Televisión
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={mediaChannelsData}
                margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="canal" type="category" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number) => [`${val} menciones`, 'Cobertura']} />
                <Bar dataKey="notas" radius={[0, 6, 6, 0]}>
                  {mediaChannelsData.map((entry, index) => (
                    <Cell key={`bar-channel-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-5 text-center text-[10px] pt-3 border-t border-slate-100 text-slate-600">
            <div>
              <span className="font-bold text-sky-700 block">{metrics.impresosCount}</span>
              <span>Impresos</span>
            </div>
            <div>
              <span className="font-bold text-teal-700 block">{metrics.digitalesCount}</span>
              <span>Digitales</span>
            </div>
            <div>
              <span className="font-bold text-indigo-700 block">{metrics.otrosCount}</span>
              <span>Redes/Otros</span>
            </div>
            <div>
              <span className="font-bold text-amber-700 block">{metrics.radioCount}</span>
              <span>Radio</span>
            </div>
            <div>
              <span className="font-bold text-pink-700 block">{metrics.tvCount}</span>
              <span>TV</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
