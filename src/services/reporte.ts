import { apiFetch, leerMensajeError } from "@/lib/api";
import type {
  CrearReporteInput,
  EstadoReporte,
  FotoReporte,
  Reporte,
} from "@/types";

export async function getReportes(idObra: string): Promise<Reporte[]> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/reportes`);

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudieron obtener los reportes."),
    );
  }

  const body = (await response.json()) as { data: Reporte[] };
  return body.data ?? [];
}

export async function crearReporte(
  idObra: string,
  data: CrearReporteInput,
): Promise<Reporte> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/reportes`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo crear el reporte."),
    );
  }

  const body = (await response.json()) as { data: Reporte };
  return body.data;
}

export async function actualizarReporte(
  idObra: string,
  idReporte: string,
  data: CrearReporteInput,
): Promise<Reporte> {
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/reportes/${idReporte}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo actualizar el reporte."),
    );
  }

  const body = (await response.json()) as { data: Reporte };
  return body.data;
}

export async function cambiarEstadoReporte(
  idObra: string,
  idReporte: string,
  estado: EstadoReporte,
): Promise<Reporte> {
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/reportes/${idReporte}/estado`,
    {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(
        response,
        "No se pudo cambiar el estado del reporte.",
      ),
    );
  }

  const body = (await response.json()) as { data: Reporte };
  return body.data;
}

export async function getFotos(
  idObra: string,
  idReporte: string,
): Promise<FotoReporte[]> {
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/reportes/${idReporte}/fotos`,
  );

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudieron obtener las fotos."),
    );
  }

  const body = (await response.json()) as { data: FotoReporte[] };
  return body.data ?? [];
}

export async function subirFotos(
  idObra: string,
  idReporte: string,
  formData: FormData,
): Promise<FotoReporte[]> {
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/reportes/${idReporte}/fotos`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudieron subir las fotos."),
    );
  }

  const body = (await response.json()) as { data: FotoReporte[] };
  return body.data ?? [];
}

export async function eliminarFoto(
  idObra: string,
  idReporte: string,
  idFoto: string,
): Promise<void> {
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/reportes/${idReporte}/fotos/${idFoto}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo eliminar la foto."),
    );
  }
}
