export interface FotoCompendio {
  id_foto: string;
  id_reporte: string;
  url_foto: string;
  fecha_reporte: string | null;
}

export interface CompendioMensual {
  id_compendio: string;
  id_obra: string;
  mes: number;
  anio: number;
  id_supervisor: string;
  fotografias: FotoCompendio[];
  created_at: string;
  updated_at: string;
  supervisor_correo: string | null;
}

export interface FotoReportePeriodo {
  id_foto: string;
  id_reporte: string;
  url_foto: string;
}

export interface ReporteConFotos {
  id_reporte: string;
  id_obra: string;
  id_creador: string;
  estado: string;
  created_at: string;
  actividades_realizadas: string | null;
  notas_relevantes: string | null;
  avance_general: number | null;
  fecha_estimada_conclusion: string | null;
  fotos: FotoReportePeriodo[];
}

export interface PeriodoCompendio {
  mes: number;
  anio: number;
  compendio: CompendioMensual | null;
  reportes: ReporteConFotos[];
}

export interface CrearCompendioInput {
  mes: number;
  anio: number;
  fotografias: Array<{ id_foto: string }>;
}
