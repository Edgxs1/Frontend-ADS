import { apiFetch } from "@/lib/api";
import type { Concepto, ConceptoConPartida, CrearConceptoInput } from "@/types";
import type { TipoEstimacion } from "@/types/estimacion";

export interface CatalogosPorObraOpciones {
  tipoEstimacion?: TipoEstimacion;
  fechaCorte?: string;
  excluirIdEstimacion?: string;
}

export async function getCatalogosPorObra(
  idObra: string,
  opciones?: CatalogosPorObraOpciones,
): Promise<ConceptoConPartida[]> {
  const parametros = new URLSearchParams();

  if (opciones?.tipoEstimacion) {
    parametros.set("tipo_estimacion", opciones.tipoEstimacion);
  }
  if (opciones?.fechaCorte) {
    parametros.set("fecha_corte", opciones.fechaCorte);
  }
  if (opciones?.excluirIdEstimacion) {
    parametros.set("excluir_id_estimacion", opciones.excluirIdEstimacion);
  }

  const consulta = parametros.toString();
  const url = `/api/v1/obras/${idObra}/catalogos${consulta ? `?${consulta}` : ""}`;
  const response = await apiFetch(url);

  if (!response.ok) {
    throw new Error("No se pudieron obtener los conceptos.");
  }

  const body = (await response.json()) as { data: ConceptoConPartida[] };
  return body.data ?? [];
}

export async function crearConcepto(
  idObra: string,
  data: CrearConceptoInput,
): Promise<Concepto> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/catalogos`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let mensaje = "No se pudo crear el concepto.";

    try {
      const errBody = (await response.json()) as { error?: { message?: string } };
      if (errBody?.error?.message) {
        mensaje = errBody.error.message;
      }
    } catch {
      // respuesta sin cuerpo JSON
    }

    throw new Error(mensaje);
  }

  const body = (await response.json()) as { data: Concepto };
  return body.data;
}

export async function actualizarConcepto(
  idObra: string,
  idConcepto: string,
  data: CrearConceptoInput,
): Promise<Concepto> {
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/catalogos/${idConcepto}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    let mensaje = "No se pudo actualizar el concepto.";

    try {
      const errBody = (await response.json()) as { error?: { message?: string } };
      if (errBody?.error?.message) {
        mensaje = errBody.error.message;
      }
    } catch {
      // respuesta sin cuerpo JSON
    }

    throw new Error(mensaje);
  }

  const body = (await response.json()) as { data: Concepto };
  return body.data;
}

export async function eliminarConcepto(
  idObra: string,
  idConcepto: string,
): Promise<void> {
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/catalogos/${idConcepto}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    let mensaje = "No se pudo eliminar el concepto.";

    try {
      const errBody = (await response.json()) as { error?: { message?: string } };
      if (errBody?.error?.message) {
        mensaje = errBody.error.message;
      }
    } catch {
      // respuesta sin cuerpo JSON
    }

    throw new Error(mensaje);
  }
}
