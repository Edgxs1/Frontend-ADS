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

const ZONA_HORARIA_MEXICO = "America/Mexico_City";

export function diaDelMesActual(): number {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA_MEXICO,
    day: "2-digit",
  }).formatToParts(new Date());

  const dia = Number(partes.find((parte) => parte.type === "day")?.value);

  return Number.isFinite(dia) ? dia : new Date().getDate();
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
