import { apiFetch, leerMensajeError } from "@/lib/api";
import type {
  ActualizarEstimacionPayload,
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

export async function actualizarEstimacion(
  idObra: string,
  idEstimacion: string,
  payload: ActualizarEstimacionPayload,
): Promise<Estimacion> {
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/estimaciones/${idEstimacion}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );

  return leerData<Estimacion>(
    response,
    "No se pudo actualizar la estimación.",
  );
}

export async function cambiarEstadoEstimacion(
  idEstimacion: string,
  estado: EstadoEstimacion,
  password?: string,
): Promise<Estimacion> {
  const response = await apiFetch(`/api/v1/estimaciones/${idEstimacion}/estado`, {
    method: "PATCH",
    body: JSON.stringify(password ? { estado, password } : { estado }),
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
  return cambiarEstadoEstimacion(idEstimacion, "Por revisar");
}

export async function enviarAResidente(
  _idObra: string,
  idEstimacion: string,
): Promise<Estimacion> {
  return cambiarEstadoEstimacion(idEstimacion, "Revisada");
}

export async function autorizarEstimacion(
  _idObra: string,
  idEstimacion: string,
  password?: string,
): Promise<Estimacion> {
  return cambiarEstadoEstimacion(idEstimacion, "Aprobada", password);
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

/**
 * RF3.10 - Cantidades acumuladas de estimaciones aprobadas anteriores.
 *
 * El backend recalcula estos valores al guardar, pero el formulario los
 * necesita para mostrar "Cantidad anterior" y validar el volumen disponible.
 */
export async function getCantidadesAnteriores(
  idObra: string,
  fechaCorte: string,
  excluirIdEstimacion?: string,
): Promise<Map<string, number>> {
  const estimaciones = await getEstimaciones(idObra);

  const anteriores = estimaciones.filter(
    (estimacion) =>
      estimacion.estado === "Aprobada" &&
      estimacion.id_estimacion !== excluirIdEstimacion &&
      Boolean(estimacion.fecha) &&
      String(estimacion.fecha) < fechaCorte,
  );

  if (anteriores.length === 0) {
    return new Map();
  }

  const caratulas = await Promise.all(
    anteriores.map((estimacion) =>
      getCaratulaOficial(idObra, estimacion.id_estimacion).catch(() => null),
    ),
  );

  const cantidades = new Map<string, number>();

  for (const caratula of caratulas) {
    for (const concepto of caratula?.conceptos ?? []) {
      const cantidad = Number(concepto.cantidad_de_esta_estimacion ?? 0);
      cantidades.set(
        concepto.id_concepto,
        (cantidades.get(concepto.id_concepto) ?? 0) + cantidad,
      );
    }
  }

  return cantidades;
}
