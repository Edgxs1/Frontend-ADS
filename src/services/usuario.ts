import { apiFetch, leerMensajeError } from "@/lib/api";
import type { CrearUsuarioInput, UsuarioAdmin } from "@/types";

export async function getUsuarios(): Promise<UsuarioAdmin[]> {
  const response = await apiFetch("/api/v1/admin/usuarios");

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudieron obtener los usuarios."),
    );
  }

  const body = (await response.json()) as { data: UsuarioAdmin[] };
  return body.data ?? [];
}

export async function crearUsuario(
  input: CrearUsuarioInput,
): Promise<UsuarioAdmin> {
  const response = await apiFetch("/api/v1/admin/usuarios", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo crear el usuario."),
    );
  }

  const body = (await response.json()) as { data: UsuarioAdmin };
  return body.data;
}

export async function actualizarRolUsuario(
  idUsuario: string,
  idRol: number,
): Promise<UsuarioAdmin> {
  const response = await apiFetch(
    `/api/v1/admin/usuarios/${idUsuario}/rol`,
    {
      method: "PATCH",
      body: JSON.stringify({ id_rol: idRol }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo actualizar el rol."),
    );
  }

  const body = (await response.json()) as { data: UsuarioAdmin };
  return body.data;
}
