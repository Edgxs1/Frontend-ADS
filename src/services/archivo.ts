import { apiFetch } from "@/lib/api";
import type { ArchivoRepositorio } from "@/types";

export interface SubirArchivoInput {
  tipo_documento: string;
  archivo: File;
}

export async function getArchivosPorObra(
  idObra: string,
): Promise<ArchivoRepositorio[]> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/archivos`);

  if (!response.ok) {
    throw new Error("No se pudieron obtener los archivos del expediente.");
  }

  const body = (await response.json()) as { data: ArchivoRepositorio[] };
  return body.data ?? [];
}

export async function subirArchivo(
  idObra: string,
  input: SubirArchivoInput,
): Promise<ArchivoRepositorio> {
  const formData = new FormData();
  formData.append("tipo_documento", input.tipo_documento);
  formData.append("archivo", input.archivo);

  const response = await apiFetch(`/api/v1/obras/${idObra}/archivos`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let mensaje = "No se pudo subir el archivo.";

    try {
      const errBody = (await response.json()) as { error?: { message?: string } };
      if (errBody?.error?.message) {
        mensaje = errBody.error.message;
      }
    } catch {
      // no body
    }

    throw new Error(mensaje);
  }

  const body = (await response.json()) as { data: ArchivoRepositorio };
  return body.data;
}

export async function eliminarArchivo(
  idObra: string,
  idArchivo: string,
): Promise<void> {
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/archivos/${idArchivo}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    let mensaje = "No se pudo eliminar el archivo.";

    try {
      const errBody = (await response.json()) as { error?: { message?: string } };
      if (errBody?.error?.message) {
        mensaje = errBody.error.message;
      }
    } catch {
      // no body
    }

    throw new Error(mensaje);
  }
}
