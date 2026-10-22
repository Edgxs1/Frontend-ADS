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

export function formatearFechaHora(valor: string | null | undefined): string {
  if (!valor) {
    return "—";
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return formatearFecha(valor);
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
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
