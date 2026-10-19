import { apiFetch } from "@/lib/api";
import type { Concepto, ConceptoConPartida, CrearConceptoInput } from "@/types";

export async function getCatalogosPorObra(
  idObra: string,
): Promise<ConceptoConPartida[]> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/catalogos`);

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
