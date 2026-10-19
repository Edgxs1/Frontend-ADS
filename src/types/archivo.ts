export interface ArchivoRepositorio {
  id_archivo: string;
  id_obra: string;
  id_subido_por: string;
  tipo_documento: string;
  url_archivo: string;
  created_at?: string | null;
}
