export const TIPOS_ESTIMACION = ["Ordinaria", "Extraordinaria", "Adicional"] as const;
export type TipoEstimacion = (typeof TIPOS_ESTIMACION)[number];

export const ESTADOS_ESTIMACION = [
  "Borrador",
  "Revision Supervisor",
  "Revision Residente",
  "Autorizada",
  "Rechazada",
] as const;
export type EstadoEstimacion = (typeof ESTADOS_ESTIMACION)[number];

export interface EstimacionConcepto {
  id_detalle?: string;
  id_concepto: string;
  clave?: string | null;
  descripcion?: string | null;
  unidad_medida?: string | null;
  cantidad_segun_proyecto?: number | null;
  cantidad_hasta_estimacion_anterior?: number | null;
  cantidad_de_esta_estimacion: number;
  cantidad_total_estimado?: number | null;
  cantidad_por_ejecutar?: number | null;
  precio_unitario_snapshot: number;
  importe: number;
  avance_fisico_monetizado?: number | null;
  avance_financiero_cobrado?: number | null;
}

export interface Estimacion {
  id_estimacion: string;
  id_obra: string;
  id_anticipo: string | null;
  folio: string;
  fecha: string;
  tipo: TipoEstimacion;
  estado: EstadoEstimacion;
  periodo_inicio: string;
  periodo_fin: string;
  importe_estimacion_actual: number | null;
  importe_acumulado_anterior: number | null;
  importe_acumulado_actual: number | null;
  porcentaje_anticipo_aplicado: number | null;
  importe_amortizacion_actual: number;
  importe_amortizado_acumulado_anterior: number | null;
  porcentaje_iva_aplicado: number | null;
  importe_iva: number | null;
  porcentaje_retencion_sfp: number | null;
  importe_retencion_sfp: number | null;
  importe_retencion_atraso_programa: number;
  importe_neto_a_recibir: number | null;
  created_at: string;
  firma_superintendente: string | null;
  firma_supervisor: string | null;
  firma_residente: string | null;
}

export interface EstimacionDetalle extends Estimacion {
  conceptos: EstimacionConcepto[];
}

export interface ConceptoEstimacionPayload {
  id_concepto: string;
  cantidad: number;
}

export interface CrearEstimacionPayload {
  tipo: TipoEstimacion;
  fecha: string;
  periodo_inicio: string;
  periodo_fin: string;
  conceptos: ConceptoEstimacionPayload[];
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
