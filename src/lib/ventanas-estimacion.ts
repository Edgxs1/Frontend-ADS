import type { TipoEstimacion } from "@/types/estimacion";
import type { TipoConcepto } from "@/types/concepto";

export const TIPO_CATALOGO_POR_ESTIMACION: Record<
  TipoEstimacion,
  TipoConcepto
> = {
  Normal: "Normal",
  Adicional: "Adicional",
  Extraordinaria: "Extraordinario",
};

export const MENSAJE_TRASLADO =
  "Fuera de tiempo. El proceso superó los 15 días naturales; la estimación se trasladará al periodo del siguiente mes";

export function diaDelMesActual(): number {
  return new Date().getDate();
}

export function ventanaPresentacion(dia = diaDelMesActual()): boolean {
  return dia >= 1 && dia <= 5;
}

export function ventanaRevision(dia = diaDelMesActual()): boolean {
  return dia >= 6 && dia <= 10;
}

export function ventanaAutorizacion(dia = diaDelMesActual()): boolean {
  return dia >= 11 && dia <= 15;
}
