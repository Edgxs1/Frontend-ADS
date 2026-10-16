import { apiFetch } from "@/lib/api";
import type { ContratoConContratista, RegistrarContratoInput } from "@/types";

interface CuerpoError {
  error?: { message?: string };
}

async function leerMensajeError(
  response: Response,
  fallback: string,
): Promise<string> {
  const body = (await response.json().catch(() => null)) as CuerpoError | null;
  return body?.error?.message ?? fallback;
}

export async function getContrato(
  idObra: string,
): Promise<ContratoConContratista | null> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/contrato`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo obtener el contrato."),
    );
  }

  const body = (await response.json()) as { data: ContratoConContratista };
  return body.data;
}

export async function registrarContrato(
  idObra: string,
  data: RegistrarContratoInput,
): Promise<ContratoConContratista> {
  const response = await apiFetch(`/api/v1/obras/${idObra}/contrato`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(response, "No se pudo registrar el contrato."),
    );
  }

  const body = (await response.json()) as { data: ContratoConContratista };
  return body.data;
}
