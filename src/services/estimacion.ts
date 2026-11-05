import { apiFetch, leerMensajeError } from "@/lib/api";
import type {
  CaratulaOficial,
  CrearEstimacionPayload,
  EstadoEstimacion,
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
  const response = await apiFetch(`/api/v1/estimaciones/${idObra}`);
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
  const response = await apiFetch("/api/v1/estimaciones", {
    method: "POST",
    body: JSON.stringify({ ...payload, id_obra: payload.id_obra ?? idObra }),
  });

  return leerData<Estimacion>(response, "No se pudo crear la estimación.");
}

export async function cambiarEstadoEstimacion(
  idEstimacion: string,
  estado: EstadoEstimacion,
): Promise<Estimacion> {
  const response = await apiFetch(`/api/v1/estimaciones/${idEstimacion}/estado`, {
    method: "PUT",
    body: JSON.stringify({ estado }),
  });

  return leerData<Estimacion>(
    response,
    "No se pudo actualizar el estado de la estimación.",
  );
}

export async function enviarRevision(
  _idObra: string,
  idEstimacion: string,
): Promise<Estimacion> {
  return cambiarEstadoEstimacion(idEstimacion, "Revisión");
}

export async function enviarAResidente(
  _idObra: string,
  idEstimacion: string,
): Promise<Estimacion> {
  return cambiarEstadoEstimacion(idEstimacion, "Autorización");
}

export async function autorizarEstimacion(
  _idObra: string,
  idEstimacion: string,
): Promise<Estimacion> {
  return cambiarEstadoEstimacion(idEstimacion, "Aprobada");
}

export async function rechazarEstimacion(
  _idObra: string,
  idEstimacion: string,
): Promise<Estimacion> {
  return cambiarEstadoEstimacion(idEstimacion, "Rechazada");
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
