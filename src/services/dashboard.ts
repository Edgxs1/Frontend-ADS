import { apiFetch, leerMensajeError } from "@/lib/api";
import type { AgrupacionHistorico, DashboardIndicadores } from "@/types";

export async function getDashboardObra(
  idObra: string,
  agrupacion: AgrupacionHistorico = "mes",
): Promise<DashboardIndicadores> {
  const params = new URLSearchParams({ agrupacion });
  const response = await apiFetch(
    `/api/v1/obras/${idObra}/dashboard?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(
      await leerMensajeError(
        response,
        "No se pudieron obtener los indicadores de la obra.",
      ),
    );
  }

  const body = (await response.json()) as { data: DashboardIndicadores };
  return body.data;
}
