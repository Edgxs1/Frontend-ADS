import { apiFetch, leerMensajeError } from "@/lib/api";
import type { AsignacionObra, CrearObraInput, Obra } from "@/types";

export async function getObras(): Promise<Obra[]> {
  const response = await apiFetch("/api/v1/obras");

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudieron obtener las obras."),
    );
  }

  const body = (await response.json()) as { data: Obra[] };
  return body.data ?? [];
}

export async function crearObra(input: CrearObraInput): Promise<Obra> {
  const response = await apiFetch("/api/v1/obras", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo registrar la obra."),
    );
  }

  const body = (await response.json()) as { data: Obra };
  return body.data;
}

export async function eliminarObra(idObra: string): Promise<void> {
  const response = await apiFetch(`/api/v1/obras/${idObra}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo eliminar la obra."),
    );
  }
}

export async function getAsignacionesObra(
  idObra: string,
): Promise<AsignacionObra[]> {
  const response = await apiFetch(
    `/api/v1/admin/obras/${idObra}/asignaciones`,
  );

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(
        response,
        "No se pudieron obtener las asignaciones de la obra.",
      ),
    );
  }

  const body = (await response.json()) as { data: AsignacionObra[] };
  return body.data ?? [];
}

export async function asignarUsuarioAObra(
  idObra: string,
  idUsuario: string,
): Promise<void> {
  const response = await apiFetch("/api/v1/admin/asignar", {
    method: "POST",
    body: JSON.stringify({ id_obra: idObra, id_usuario: idUsuario }),
  });

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo asignar el usuario."),
    );
  }
}
