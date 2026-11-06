import { apiFetch, leerMensajeError } from "@/lib/api";
import type { Rol } from "@/providers/supabase-provider";
import type {
  ActualizarPerfilInput,
  CrearUsuarioInput,
  UsuarioAdmin,
} from "@/types";

export interface FiltrosUsuarios {
  search?: string;
  rol?: Rol;
}

export async function getUsuarios(
  filtros: FiltrosUsuarios = {},
): Promise<UsuarioAdmin[]> {
  const params = new URLSearchParams();
  const search = filtros.search?.trim();

  if (search) {
    params.set("search", search);
  }

  if (filtros.rol) {
    params.set("rol", filtros.rol);
  }

  const query = params.toString();
  const response = await apiFetch(
    `/api/v1/admin/usuarios${query ? `?${query}` : ""}`,
  );

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

export async function actualizarEstadoUsuario(
  idUsuario: string,
  activo: boolean,
): Promise<UsuarioAdmin> {
  const response = await apiFetch(`/api/v1/usuarios/${idUsuario}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ activo }),
  });

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo actualizar el estado."),
    );
  }

  const body = (await response.json()) as { data: UsuarioAdmin };
  return body.data;
}

export async function actualizarPerfil(
  input: ActualizarPerfilInput,
): Promise<void> {
  const response = await apiFetch("/api/v1/usuarios/perfil", {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo actualizar el perfil."),
    );
  }
}
