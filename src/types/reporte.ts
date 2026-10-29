export type EstadoReporte = "Validado" | "Por revisar";

export type EstadoTiempo = "Soleado" | "Nublado" | "Lluvia moderada" | "Lluvia intensa";
export type EstadoSenalamiento = "Buen estado" | "Mal estado" | "Suficiente" | "Insuficiente";
export type EstadoEPP = "Completo" | "Incompleto" | "Suficiente" | "Insuficiente";
export type EstadoSuministro = "En existencia" | "Sin materiales";
export type EstadoSufrimiento = "Suficiente" | "Insuficiente";

export interface Reporte {
  id_reporte: string;
  id_obra: string;
  id_creador: string;
  estado: EstadoReporte;
  created_at: string;
  condicionantes: any[] | null;
  problematica: any[] | null;
  interferencias: any[] | null;
  conceptos_relevantes: any[] | null;
  recursos_utilizados: any[] | null;
  actividades_realizadas: string | null;
  notas_relevantes: string | null;
  estado_tiempo: EstadoTiempo | null;
  hora_lluvia: string | null;
  senalamiento_preventivo: EstadoSenalamiento | null;
  equipo_proteccion: EstadoEPP | null;
  suministro_materiales: EstadoSuministro | null;
  estado_personal: EstadoSufrimiento | null;
  estado_maquinaria: EstadoSufrimiento | null;
  estado_equipo: EstadoSufrimiento | null;
  avance_general: number | null;
  fecha_estimada_conclusion: string | null;
  creador_correo: string | null;
}

export interface FotoReporte {
  id_foto: string;
  id_reporte: string;
  url_foto: string;
}

export interface CrearReporteInput {
  actividades_realizadas?: string | null;
  notas_relevantes?: string | null;
  hora_lluvia?: string | null;
  estado_tiempo?: EstadoTiempo | null;
  senalamiento_preventivo?: EstadoSenalamiento | null;
  equipo_proteccion?: EstadoEPP | null;
  suministro_materiales?: EstadoSuministro | null;
  estado_personal?: EstadoSufrimiento | null;
  estado_maquinaria?: EstadoSufrimiento | null;
  estado_equipo?: EstadoSufrimiento | null;
  avance_general: number;
  fecha_estimada_conclusion: string;
  condicionantes: any[];
  problematica: any[];
  interferencias: any[];
  conceptos_relevantes: any[];
  recursos_utilizados: any[];
}
