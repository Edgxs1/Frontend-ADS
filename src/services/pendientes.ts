import { apiFetch, leerMensajeError } from "@/lib/api";
import type { TareaPendiente } from "@/types";

export async function getPendientes(): Promise<TareaPendiente[]> {
  const response = await apiFetch("/api/v1/pendientes");

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(
        response,
        "No se pudo obtener la bandeja de pendientes.",
      ),
    );
  }

  const body = (await response.json()) as { data: TareaPendiente[] };
  return body.data ?? [];
}
