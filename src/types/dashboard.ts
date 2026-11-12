export type AgrupacionHistorico = "mes" | "semana";

export interface PuntoHistorico {
  periodo: string;
  etiqueta: string;
  fecha: string;
  avance_fisico: number;
  avance_financiero: number;
}

export interface RecursosFinancieros {
  pagado: number;
  saldo_por_pagar: number;
  retenciones: number;
}

export interface DashboardIndicadores {
  avance_fisico_real: number;
  avance_fisico_programado: number;
  avance_financiero_real: number;
  avance_financiero_programado: number;
  avance_fisico_monetizado: number;
  avance_financiero_cobrado: number;
  desfase_alerta: boolean;
  importe_contrato: number;
  importe_ejecutado: number;
  importe_fisico_monetizado: number;
  fecha_corte: string;
  recursos_financieros: RecursosFinancieros;
  historico: PuntoHistorico[];
}
