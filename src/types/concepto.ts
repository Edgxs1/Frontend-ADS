export const TIPOS_CONCEPTO = ["Normal", "Adicional", "Extraordinario"] as const;

export type TipoConcepto = (typeof TIPOS_CONCEPTO)[number];

export interface Concepto {
  id_concepto: string;
  id_obra: string;
  id_partida: string;
  tipo: TipoConcepto;
  clave: string;
  unidad_medida: string;
  cantidad: number;
  precio_unitario: number;
  importe_total: number;
}

export interface ConceptoConPartida extends Concepto {
  partida_clave: string | null;
}
