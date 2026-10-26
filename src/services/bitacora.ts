import { apiFetch, leerMensajeError } from "@/lib/api";
import type { CrearNotaInput, EditarNotaInput, NotaBitacora } from "@/types";

export async function getNotas(idObra: string): Promise<NotaBitacora[]> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/bitacora`);

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudieron obtener las notas."),
    );
  }

  const body = (await response.json()) as { data: NotaBitacora[] };
  return body.data ?? [];
}

export async function crearNota(
  idObra: string,
  data: CrearNotaInput,
): Promise<NotaBitacora> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/bitacora`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo crear la nota."),
    );
  }

  const body = (await response.json()) as { data: NotaBitacora };
  return body.data;
}

export async function editarNota(
  idObra: string,
  idNota: string,
  data: EditarNotaInput,
): Promise<NotaBitacora> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/bitacora/${idNota}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo editar la nota."),
    );
  }

  const body = (await response.json()) as { data: NotaBitacora };
  return body.data;
}

export async function eliminarNota(
  idObra: string,
  idNota: string,
): Promise<void> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/bitacora/${idNota}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo eliminar la nota."),
    );
  }
}

export async function firmarNota(
  idObra: string,
  idNota: string,
): Promise<NotaBitacora> {
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/bitacora/${idNota}/firmar`,
    {
      method: "PATCH",
    },
  );

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo firmar la nota."),
    );
  }

  const body = (await response.json()) as { data: NotaBitacora };
  return body.data;
}
