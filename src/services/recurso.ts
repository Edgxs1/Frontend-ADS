import { apiFetch, leerMensajeError } from "@/lib/api";

export interface RecursoCatalogoObra {
  id_recurso: string;
  id_obra: string | null;
  tipo: string | null;
  descripcion: string;
  activo: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function getRecursosPorObra(idObra: string): Promise<RecursoCatalogoObra[]> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/recursos`);

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudieron obtener los recursos."),
    );
  }

  const body = (await response.json()) as ApiResponse<RecursoCatalogoObra[]>;
  return body.data ?? [];
}

export async function crearRecursoObra(
  idObra: string,
  payload: { tipo: "PERSONAL" | "MAQUINARIA" | "EQUIPO"; descripcion: string },
): Promise<RecursoCatalogoObra> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/recursos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo crear el recurso."),
    );
  }

  const body = (await response.json()) as ApiResponse<RecursoCatalogoObra>;
  return body.data;
}

export async function actualizarRecursoObra(
  idObra: string,
  idRecurso: string,
  payload: { descripcion?: string; activo?: boolean },
): Promise<RecursoCatalogoObra> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/recursos/${idRecurso}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo actualizar el recurso."),
    );
  }

  const body = (await response.json()) as ApiResponse<RecursoCatalogoObra>;
  return body.data;
}
