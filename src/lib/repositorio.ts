export const CARPETAS_REPOSITORIO = [
  "Contrato y Anexos",
  "Documentos del Contratista",
  "Documentos de Supervisión",
  "Actas y Cierres",
] as const;

export type CarpetaRepositorio = (typeof CARPETAS_REPOSITORIO)[number];

export const CARPETA_POR_ROL: Record<string, CarpetaRepositorio> = {
  Administrador: "Contrato y Anexos",
  Superintendente: "Documentos del Contratista",
  Supervisor: "Documentos de Supervisión",
  Residente: "Actas y Cierres",
};

export function carpetaPermitidaPorRol(
  rol: string | null | undefined,
): CarpetaRepositorio | null {
  if (!rol) {
    return null;
  }

  return CARPETA_POR_ROL[rol] ?? null;
}
