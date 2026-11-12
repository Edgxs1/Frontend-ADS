export type TipoPendiente = "estimacion" | "bitacora" | "reporte";

export interface TareaPendiente {
  id: string;
  tipo: TipoPendiente;
  id_obra: string;
  obra: string;
  titulo: string;
  descripcion: string;
  estado: string;
  fecha: string | null;
  ruta: string;
}
