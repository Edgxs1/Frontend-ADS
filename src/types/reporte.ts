export type EstadoReporte = "Validado" | "Por revisar";

export type EstadoTipoDia = "Laborado" | "No laborado";
export type EstadoTiempo = "Soleado" | "Nublado" | "Lluvia moderada" | "Lluvia intensa";
export type EstadoSenalamiento = "Buen estado" | "Mal estado" | "Suficiente" | "Insuficiente";
export type EstadoEPP = "Completo" | "Incompleto" | "Suficiente" | "Insuficiente";
export type EstadoSuministro = "En existencia" | "Sin materiales";
export type EstadoSufrimiento = "Suficiente" | "Insuficiente";

export interface ReporteCondicionante {
  condicionante?: string;
  nombre?: string;
  tipo?: string;
  estatus?: string;
  semaforo?: string;
  frente?: string;
}

export interface ReporteProblematica {
  fecha?: string;
  problematica?: string;
  acciones_a_seguir?: string;
  status?: string;
  solucionado?: boolean;
}

export interface ReporteInterferencia {
  fecha?: string;
  interferencia?: string;
  status?: string;
  fecha_solucion?: string;
}

export interface ReporteConceptoRelevante {
  clave?: string;
  concepto?: string;
  fecha_inicio?: string;
  fecha_termino?: string;
  cantidad_proyecto?: number;
  cantidad_acumulada?: number;
  cantidad_adicional?: number;
  unidad?: string;
}

export type ReporteRecursoUtilizado = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface Reporte {
  id_reporte: string;
  id_obra: string;
  id_creador: string;
  estado: EstadoReporte;
  created_at: string;
  condicionantes: ReporteCondicionante[] | null;
  problematica: ReporteProblematica[] | null;
  interferencias: ReporteInterferencia[] | null;
  conceptos_relevantes: ReporteConceptoRelevante[] | null;
  recursos_utilizados: ReporteRecursoUtilizado[] | null;
  actividades_realizadas: string | null;
  notas_relevantes: string | null;
  estado_tiempo: EstadoTiempo | null;
  hora_lluvia: number | null;
  tipo_dia: EstadoTipoDia | null;
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
  hora_lluvia?: number | null;
  tipo_dia?: EstadoTipoDia | null;
  estado_tiempo?: EstadoTiempo | null;
  senalamiento_preventivo?: EstadoSenalamiento | null;
  equipo_proteccion?: EstadoEPP | null;
  suministro_materiales?: EstadoSuministro | null;
  estado_personal?: EstadoSufrimiento | null;
  estado_maquinaria?: EstadoSufrimiento | null;
  estado_equipo?: EstadoSufrimiento | null;
  avance_general: number;
  fecha_estimada_conclusion: string;
  condicionantes: ReporteCondicionante[];
  problematica: ReporteProblematica[];
  interferencias: ReporteInterferencia[];
  conceptos_relevantes: ReporteConceptoRelevante[];
  recursos_utilizados: ReporteRecursoUtilizado[];
}
