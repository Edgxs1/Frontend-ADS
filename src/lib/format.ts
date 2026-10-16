export function formatearFecha(valor: string | null | undefined): string {
  if (!valor) {
    return "—";
  }

  const soloFecha = valor.slice(0, 10);
  const [anio, mes, dia] = soloFecha.split("-");

  if (!anio || !mes || !dia) {
    return valor;
  }

  return `${dia}/${mes}/${anio}`;
}

export function formatearMoneda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) {
    return "—";
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor);
}
