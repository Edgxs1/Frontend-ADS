import type { Contratista } from "./contratista";

export interface Contrato {
  id_contrato: string;
  id_obra: string;
  id_contratista: string;
  numero_contrato: string;
  fecha_contrato: string;
  lugar_obra: string;
  periodo_ejecucion_inicio: string;
  periodo_ejecucion_fin: string;
  importe_contrato: number;
}

export interface ContratoConContratista extends Contrato {
  contratista: Contratista;
}

export interface ContratistaInput {
  razon_social: string;
  rfc: string;
  registro_iva: string;
  registro_cmic: string;
  registro_gacm: string;
  representante_legal: string;
  cargo_representante: string;
  telefono_representante: string;
}

export interface RegistrarContratoInput {
  numero_contrato: string;
  fecha_contrato: string;
  lugar_obra: string;
  periodo_ejecucion_inicio: string;
  periodo_ejecucion_fin: string;
  importe_contrato: number;
  contratista: ContratistaInput;
}
