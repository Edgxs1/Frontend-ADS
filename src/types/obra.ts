export interface Obra {
  id_obra: string;
  nombre: string;
  tipo_edificacion: string | null;
  num_habitaciones: number | null;
  activo: boolean;
  created_at: string;
}
