import { apiFetch, leerMensajeError } from "@/lib/api";
import type {
  CompendioMensual,
  CrearCompendioInput,
  FotoCompendio,
  PeriodoCompendio,
} from "@/types";

export async function getCompendios(
  idObra: string,
): Promise<CompendioMensual[]> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/compendios`);

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(
        response,
        "No se pudieron obtener los compendios mensuales.",
      ),
    );
  }

  const body = (await response.json()) as { data: CompendioMensual[] };
  return body.data ?? [];
}

export async function getFotosReportesPeriodo(
  idObra: string,
  mes: number,
  anio: number,
): Promise<FotoCompendio[]> {
  const params = new URLSearchParams({
    mes: String(mes),
    anio: String(anio),
  });
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/reportes-fotos?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(
        response,
        "No se pudieron obtener las fotografías del periodo.",
      ),
    );
  }

  const body = (await response.json()) as { data: FotoCompendio[] };
  return body.data ?? [];
}

export async function getPeriodoCompendio(
  idObra: string,
  mes: number,
  anio: number,
): Promise<PeriodoCompendio> {
  const params = new URLSearchParams({
    mes: String(mes),
    anio: String(anio),
  });
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/compendios/periodo?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(
        response,
        "No se pudieron obtener las fotografías del periodo.",
      ),
    );
  }

  const body = (await response.json()) as { data: PeriodoCompendio };
  return body.data;
}

export async function generarCompendio(
  idObra: string,
  input: CrearCompendioInput,
): Promise<CompendioMensual> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/compendios`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(
        response,
        "No se pudo generar el compendio mensual.",
      ),
    );
  }

  const body = (await response.json()) as { data: CompendioMensual };
  return body.data;
}
