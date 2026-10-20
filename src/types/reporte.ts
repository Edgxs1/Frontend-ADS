export type EstadoReporte = "Validado" | "Por revisar";

export interface Reporte {
  id_reporte: string;
  id_obra: string;
  id_creador: string;
  estado: EstadoReporte;
  condicionantes: string;
  avance_general: string;
  created_at: string;
  creador_correo: string | null;
}

export interface FotoReporte {
  id_foto: string;
  id_reporte: string;
  url_foto: string;
}

export interface CrearReporteInput {
  condicionantes: string;
  avance_general: string;
}
