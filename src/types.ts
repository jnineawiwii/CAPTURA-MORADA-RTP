export interface NoteRecord {
  id: string;
  ano: number;
  numMes: number;
  mes: string;
  fecha: string;
  tituloNota: string;
  esRelevanteRTP: 'Sí' | 'No' | string;
  temaNota: string;
  campana: string;
  radio: string;
  television: string;
  digitales: string;
  impresos: string;
  otros: string;
  sentimiento: 'Informativo' | 'Positivo' | 'Negativo' | string;
  link: string;
  autor: string;
  publicacionBoletin: 'Sí' | 'No' | string;
  resumenNota: string;
  fuentePdf?: string;
  fechaCaptura?: string;
}

export const COLUMN_DEFINITIONS = [
  { key: 'ano', label: 'Año', required: true, width: '80px' },
  { key: 'numMes', label: '# Mes', required: true, width: '70px' },
  { key: 'mes', label: 'Mes', required: true, width: '100px' },
  { key: 'fecha', label: 'Fecha', required: true, width: '110px' },
  { key: 'tituloNota', label: 'Título de la nota', required: true, width: '280px' },
  { key: 'esRelevanteRTP', label: 'RTP, ¿Es relevante en la nota?', required: true, width: '140px' },
  { key: 'temaNota', label: 'Tema de la nota', required: true, width: '160px' },
  { key: 'campana', label: 'Campaña', required: false, width: '150px' },
  { key: 'radio', label: 'MEDIOS ELECTRÓNICOS TRADICIONALES: RADIO *', required: false, width: '180px' },
  { key: 'television', label: 'MEDIOS ELECTRÓNICOS TRADICIONALES: TELEVISIÓN *', required: false, width: '180px' },
  { key: 'digitales', label: 'MEDIOS DE COMUNICACIÓN DIGITALES (Internet: portales de noticias, canales de tv y radio digitales) *', required: false, width: '220px' },
  { key: 'impresos', label: 'MEDIOS IMPRESOS (Publicación de inserciones en revistas y periódicos) *', required: false, width: '200px' },
  { key: 'otros', label: 'OTROS (Twitter, Facebook, You Tube, etc.).', required: false, width: '180px' },
  { key: 'sentimiento', label: 'Informativo / Positivo/ Negativo', required: true, width: '140px' },
  { key: 'link', label: 'LINK', required: false, width: '180px' },
  { key: 'autor', label: 'Autor', required: false, width: '140px' },
  { key: 'publicacionBoletin', label: 'PUBLICACIÓN BOLETÍN', required: false, width: '130px' },
  { key: 'resumenNota', label: 'RESUMEN  DE LA NOTA (RTP)', required: true, width: '320px' },
] as const;

export interface FilterState {
  ano: string; // 'all' or year
  mes: string; // 'all' or month name or number
  relevancia: string; // 'all' | 'Sí' | 'No'
  sentimiento: string; // 'all' | 'Positivo' | 'Negativo' | 'Informativo'
  searchTerm: string;
  medioTipo?: string; // 'all' | 'radio' | 'television' | 'digitales' | 'impresos' | 'otros'
}
