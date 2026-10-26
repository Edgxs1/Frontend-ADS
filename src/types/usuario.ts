import type { Rol } from "@/providers/supabase-provider";

export interface RolSistema {
  id: number;
  nombre: Rol;
}

export const ROLES_SISTEMA: readonly RolSistema[] = [
  { id: 1, nombre: "Administrador" },
  { id: 2, nombre: "Superintendente" },
  { id: 3, nombre: "Supervisor" },
  { id: 4, nombre: "Residente" },
  { id: 5, nombre: "Directivo" },
];

export interface UsuarioAdmin {
  id_usuario: string;
  correo: string;
  id_rol: number | null;
  rol: Rol | null;
  rfc: string | null;
  telefono: string | null;
  cedula_profesional: string | null;
  activo: boolean;
}

export interface ActualizarPerfilInput {
  rfc?: string;
  telefono?: string;
  cedula_profesional?: string;
}

export interface CrearUsuarioInput {
  email: string;
  id_rol: number;
  password: string;
}
