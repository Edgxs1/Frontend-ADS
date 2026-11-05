export type EstadoNota = "Abierta" | "Pendiente de Firma" | "Completada";

export interface NotaBitacora {
  id_nota: string;
  id_obra: string;
  id_creador: string;
  texto: string;
  estado: EstadoNota;
  created_at: string;
  creador_correo: string | null;
  firma_superintendente: string | null;
  firma_supervisor: string | null;
  firma_residente: string | null;
}

export interface CrearNotaInput {
  texto: string;
}

export interface EditarNotaInput {
  texto: string;
}
