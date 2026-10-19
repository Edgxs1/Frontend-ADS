import type { Rol } from "@/providers/supabase-provider";

export interface AsignacionObra {
  id_asignacion: string;
  id_usuario: string;
  id_obra: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: string;
  correo: string;
  id_rol: number | null;
  rol: Rol | null;
}
