import { apiFetch } from "@/lib/api";
import type { Partida } from "@/types";

export interface CrearPartidaInput {
  clave: string;
  descripcion: string;
}

export async function obtenerPartidas(idObra: string): Promise<Partida[]> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/partidas`);

  if (!response.ok) {
    throw new Error("No se pudieron obtener las partidas.");
  }

  const body = (await response.json()) as { data: Partida[] };
  return body.data ?? [];
}

export async function crearPartida(
  idObra: string,
  input: CrearPartidaInput,
): Promise<Partida> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/partidas`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let mensaje = "No se pudo crear la partida.";
    try {
      const errBody = (await response.json()) as { error?: { message?: string } };
      if (errBody?.error?.message) mensaje = errBody.error.message;
    } catch {
      // ignore
    }
    throw new Error(mensaje);
  }

  const body = (await response.json()) as { data: Partida };
  return body.data;
}
