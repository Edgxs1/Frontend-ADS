export const TIPOS_ESTIMACION = ["Normal", "Adicional", "Extraordinaria"] as const;
export type TipoEstimacion = (typeof TIPOS_ESTIMACION)[number];

export const TIPOS_CON_TOPES_25: readonly TipoEstimacion[] = [
  "Adicional",
  "Extraordinaria",
];

export const ESTADOS_ESTIMACION = [
  "Creada",
  "Por revisar",
  "Revisada",
  "Devuelta",
  "Aprobada",
] as const;
export type EstadoEstimacion = (typeof ESTADOS_ESTIMACION)[number];

export interface MetadataCaratula {
  descripcion?: string | null;
  hoja?: string | null;
  anticipo_total?: string | number | null;
  fecha_contrato?: string | null;
  fecha_adendum?: string | null;
  rfc_contratista?: string | null;
  registro_iva?: string | null;
  registro_cmic?: string | null;
  registro_gacm?: string | null;
  numero_contrato?: string | null;
  numero_adendum?: string | null;
  lugar_obra?: string | null;
  fianza_cumplimiento?: string | number | null;
  fianza_anticipo?: string | number | null;
  periodo_ejecucion?: string | null;
  numero_fianza_cumplimiento?: string | null;
  fecha_fianza_cumplimiento?: string | null;
  numero_fianza_anticipo?: string | null;
  fecha_fianza_anticipo?: string | null;
  [clave: string]: unknown;
}

export interface EstimacionConcepto {
  id_detalle?: string;
  id_estimacion?: string;
  id_concepto: string;
  id_partida?: string | null;
  partida_clave?: string | null;
  partida_descripcion?: string | null;
  clave?: string | null;
  descripcion?: string | null;
  unidad_medida?: string | null;
  cantidad_segun_proyecto?: number | null;
  cantidad_hasta_estimacion_anterior?: number | null;
  cantidad_de_esta_estimacion: number | null;
  cantidad_total_estimado?: number | null;
  cantidad_por_ejecutar?: number | null;
  precio_unitario_snapshot: number | null;
  importe: number | null;
  avance_fisico_monetizado?: number | null;
  avance_financiero_cobrado?: number | null;
  especificacion?: string | null;
  numero_especificacion?: string | null;
}

export interface ResumenPartida {
  id_partida: string | null;
  clave: string;
  descripcion: string;
  conceptos: number;
  importe: number;
}

export interface Estimacion {
  id_estimacion: string;
  id_obra: string;
  id_anticipo: string | null;
  folio: string;
  fecha: string | null;
  tipo: TipoEstimacion;
  estado: EstadoEstimacion;
  periodo_inicio: string | null;
  periodo_fin: string | null;
  importe_estimacion_actual: number | null;
  importe_acumulado_anterior: number | null;
  importe_acumulado_actual: number | null;
  porcentaje_anticipo_aplicado: number | null;
  importe_amortizacion_actual: number | null;
  importe_amortizado_acumulado_anterior: number | null;
  porcentaje_iva_aplicado: number | null;
  importe_iva: number | null;
  porcentaje_retencion_sfp: number | null;
  importe_retencion_sfp: number | null;
  importe_retencion_atraso_programa: number | null;
  importe_neto_a_recibir: number | null;
  importe_contrato_snapshot: number | null;
  metadata_caratula: MetadataCaratula | null;
  firma_superintendente: string | null;
  firma_supervisor: string | null;
  firma_residente: string | null;
  created_at: string;
}

export interface EstimacionDetalle extends Estimacion {
  conceptos: EstimacionConcepto[];
}

export interface ConceptoEstimacionPayload {
  id_concepto: string;
  cantidad: number;
  clave?: string | null;
  descripcion?: string | null;
  unidad_medida?: string | null;
  cantidad_segun_proyecto?: number | null;
  cantidad_hasta_estimacion_anterior?: number | null;
  cantidad_de_esta_estimacion?: number | null;
  precio_unitario_snapshot?: number | null;
  importe?: number | null;
  avance_fisico_monetizado?: number | null;
  avance_financiero_cobrado?: number | null;
}

export interface CrearEstimacionPayload {
  id_obra?: string;
  tipo: TipoEstimacion;
  fecha: string;
  periodo_inicio: string;
  periodo_fin: string;
  metadata_caratula?: MetadataCaratula;
  conceptos: ConceptoEstimacionPayload[];
  amortizacion?: number;
  retencion_manual?: number;
}

export type ActualizarEstimacionPayload = CrearEstimacionPayload;

export interface CambiarEstadoEstimacionPayload {
  estado: EstadoEstimacion;
  password?: string;
}

export interface CaratulaFinanciera {
  subtotal: number;
  iva: number;
  retencion_inspeccion: number;
  amortizacion_anticipo: number;
  retencion_atraso_programa: number;
  neto_a_recibir: number;
}

export interface CaratulaOficial {
  estimacion: Estimacion;
  conceptos: EstimacionConcepto[];
  caratula: CaratulaFinanciera;
}
