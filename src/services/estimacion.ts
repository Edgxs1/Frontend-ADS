import { apiFetch, leerMensajeError } from "@/lib/api";
import type {
  CaratulaOficial,
  CrearEstimacionPayload,
  Estimacion,
} from "@/types/estimacion";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

async function leerData<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    throw new Error(await leerMensajeError(response, fallback));
  }

  const body = (await response.json()) as ApiResponse<T>;
  return body.data;
}

export async function getEstimaciones(idObra: string): Promise<Estimacion[]> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/estimaciones`);
  const data = await leerData<Estimacion[]>(
    response,
    "No se pudieron obtener las estimaciones.",
  );

  return data ?? [];
}

export async function crearEstimacion(
  idObra: string,
  payload: CrearEstimacionPayload,
): Promise<Estimacion> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/estimaciones`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return leerData<Estimacion>(response, "No se pudo crear la estimación.");
}

export async function enviarRevision(
  idObra: string,
  idEstimacion: string,
): Promise<Estimacion> {
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/estimaciones/${idEstimacion}/enviar-supervisor`,
    { method: "PATCH" },
  );

  return leerData<Estimacion>(
    response,
    "No se pudo enviar la estimación a revisión.",
  );
}

export async function enviarAResidente(
  idObra: string,
  idEstimacion: string,
): Promise<Estimacion> {
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/estimaciones/${idEstimacion}/enviar-residente`,
    { method: "PATCH" },
  );

  return leerData<Estimacion>(
    response,
    "No se pudo enviar la estimación al Residente.",
  );
}

export async function autorizarEstimacion(
  idObra: string,
  idEstimacion: string,
): Promise<Estimacion> {
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/estimaciones/${idEstimacion}/autorizar`,
    { method: "PATCH" },
  );

  return leerData<Estimacion>(response, "No se pudo autorizar la estimación.");
}

export async function rechazarEstimacion(
  idObra: string,
  idEstimacion: string,
): Promise<Estimacion> {
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/estimaciones/${idEstimacion}/rechazar`,
    { method: "PATCH" },
  );

  return leerData<Estimacion>(response, "No se pudo rechazar la estimación.");
}

export async function getCaratulaOficial(
  idObra: string,
  idEstimacion: string,
): Promise<CaratulaOficial> {
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/estimaciones/${idEstimacion}/caratula`,
  );

  return leerData<CaratulaOficial>(response, "No se pudo obtener la carátula.");
}
