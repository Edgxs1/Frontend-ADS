import { formatearFecha, formatearMoneda } from "@/lib/format";
import { importeALetras } from "@/lib/numero-a-letras";
import type { ContratoConContratista } from "@/types";
import type {
  CaratulaOficial,
  EstimacionConcepto,
  MetadataCaratula,
  ResumenPartida,
} from "@/types/estimacion";

export interface FilaImporteCaratula {
  etiqueta: string;
  importe: number;
  porcentaje: number | null;
  negativo?: boolean;
  enfasis?: boolean;
}

export interface TotalResumenCaratula {
  totalEstimacion: number;
  amortizacion: number;
  subtotal: number;
  iva: number;
  retencionSfp: number;
  retencionAtraso: number;
  totalNeto: number;
}

export interface ConceptoCaratula {
  clave: string;
  especificacion: string;
  descripcion: string;
  unidad: string;
  cantidadSegunProyecto: string;
  cantidadHastaAnterior: string;
  cantidadEstaEstimacion: string;
  cantidadTotalEstimado: string;
  cantidadPorEjecutar: string;
  precioUnitario: string;
  importe: string;
}

export interface GrupoConceptosCaratula {
  clave: string;
  descripcion: string;
  importe: number;
  conceptos: ConceptoCaratula[];
}

export interface DatoCaratula {
  etiqueta: string;
  valor: string;
}

export interface FianzaCaratula {
  concepto: string;
  numero: string;
  fecha: string;
  importe: string;
}

export interface FirmaCaratula {
  accion: string;
  rol: string;
  hash: string | null;
}

export interface DatosCaratula {
  nombreObra: string;
  descripcion: string;
  hoja: string;
  contratoNumero: string;
  fechaContrato: string;
  contratista: string;
  rfc: string;
  estimacionNumero: string;
  periodoInicio: string;
  periodoFin: string;
  lugarObra: string;
  importesSinIva: FilaImporteCaratula[];
  delAnticipo: FilaImporteCaratula[];
  delNeto: FilaImporteCaratula[];
  contratistaDetalle: DatoCaratula[];
  contratoDetalle: DatoCaratula[];
  fianzasDetalle: FianzaCaratula[];
  estimacionDetalle: DatoCaratula[];
  gruposConceptos: GrupoConceptosCaratula[];
  porcentajeIva: number;
  resumenPartidas: ResumenPartida[];
  resumenTotales: TotalResumenCaratula;
  subtotalPartidas: number;
  importeConLetraSubtotal: string;
  importeConLetraNeto: string;
  firmas: FirmaCaratula[];
}

function aTexto(valor: unknown): string | null {
  if (typeof valor === "string") {
    const limpio = valor.trim();
    return limpio.length > 0 ? limpio : null;
  }

  if (typeof valor === "number" && Number.isFinite(valor)) {
    return String(valor);
  }

  return null;
}

function aNumero(valor: unknown): number | null {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return valor;
  }

  if (typeof valor === "string") {
    const limpio = valor.replace(/[^0-9.-]/g, "");

    if (limpio.length === 0) {
      return null;
    }

    const numero = Number(limpio);
    return Number.isFinite(numero) ? numero : null;
  }

  return null;
}

function calcularPorcentaje(importe: number, base: number): number | null {
  if (!Number.isFinite(base) || base <= 0) {
    return null;
  }

  return (importe / base) * 100;
}

function describirMonto(valor: unknown): string | null {
  const numero = aNumero(valor);

  if (numero !== null) {
    return formatearMoneda(numero);
  }

  return aTexto(valor);
}

function redondearMoneda(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function formatearCantidad(valor: unknown): string {
  const numero = aNumero(valor);

  if (numero === null) {
    return "—";
  }

  return numero.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function mapearConcepto(concepto: EstimacionConcepto): ConceptoCaratula {
  return {
    clave: aTexto(concepto.clave) ?? "—",
    especificacion:
      aTexto(concepto.especificacion) ??
      aTexto(concepto.numero_especificacion) ??
      "—",
    descripcion: aTexto(concepto.descripcion) ?? "—",
    unidad: aTexto(concepto.unidad_medida) ?? "—",
    cantidadSegunProyecto: formatearCantidad(
      concepto.cantidad_segun_proyecto,
    ),
    cantidadHastaAnterior: formatearCantidad(
      concepto.cantidad_hasta_estimacion_anterior,
    ),
    cantidadEstaEstimacion: formatearCantidad(
      concepto.cantidad_de_esta_estimacion,
    ),
    cantidadTotalEstimado: formatearCantidad(
      concepto.cantidad_total_estimado,
    ),
    cantidadPorEjecutar: formatearCantidad(concepto.cantidad_por_ejecutar),
    precioUnitario: formatearMoneda(concepto.precio_unitario_snapshot),
    importe: formatearMoneda(concepto.importe),
  };
}

function agruparConceptos(
  conceptos: EstimacionConcepto[],
): GrupoConceptosCaratula[] {
  const grupos = new Map<string, GrupoConceptosCaratula>();

  for (const concepto of conceptos) {
    const id = concepto.id_partida ?? "sin-partida";
    const grupo = grupos.get(id) ?? {
      clave: aTexto(concepto.partida_clave) ?? "Sin partida",
      descripcion:
        aTexto(concepto.partida_descripcion) ??
        "Conceptos sin partida asignada",
      importe: 0,
      conceptos: [],
    };

    grupo.conceptos.push(mapearConcepto(concepto));
    grupo.importe += Number(concepto.importe ?? 0);
    grupos.set(id, grupo);
  }

  return [...grupos.values()]
    .map((grupo) => ({
      ...grupo,
      importe: redondearMoneda(grupo.importe),
      conceptos: grupo.conceptos.sort((a, b) =>
        a.clave.localeCompare(b.clave, "es", { numeric: true }),
      ),
    }))
    .sort((a, b) => a.clave.localeCompare(b.clave, "es", { numeric: true }));
}

function determinarPorcentajeIva(valor: unknown): number {
  const numero = aNumero(valor);

  if (numero === null || numero <= 0) {
    return 16;
  }

  return redondearMoneda(numero <= 1 ? numero * 100 : numero);
}

function describirPeriodo(
  metadata: MetadataCaratula,
  contrato: ContratoConContratista | null,
): string {
  const texto = aTexto(metadata.periodo_ejecucion);

  if (texto) {
    return texto;
  }

  const inicio = contrato?.periodo_ejecucion_inicio;
  const fin = contrato?.periodo_ejecucion_fin;

  if (inicio || fin) {
    return `Del ${formatearFecha(inicio)} al ${formatearFecha(fin)}`;
  }

  return "—";
}

export function calcularDatosCaratula(
  caratula: CaratulaOficial,
  nombreObra: string,
  contrato: ContratoConContratista | null,
  resumenPartidas: ResumenPartida[],
): DatosCaratula {
  const { estimacion, caratula: financiero } = caratula;
  const metadata: MetadataCaratula = estimacion.metadata_caratula ?? {};
  const contratista = contrato?.contratista ?? null;

  const contratoTotal =
    aNumero(estimacion.importe_contrato_snapshot) ??
    aNumero(contrato?.importe_contrato) ??
    0;
  const importeActual =
    aNumero(estimacion.importe_estimacion_actual) ?? financiero.subtotal;
  const acumuladoActualRegistrado = aNumero(
    estimacion.importe_acumulado_actual,
  );
  const acumuladoAnterior =
    aNumero(estimacion.importe_acumulado_anterior) ??
    Math.max(0, (acumuladoActualRegistrado ?? importeActual) - importeActual);
  const acumuladoActual =
    acumuladoActualRegistrado ?? acumuladoAnterior + importeActual;
  const saldoSinIva =
    contratoTotal > 0 ? contratoTotal - acumuladoActual : 0;

  const amortizacionAnterior =
    aNumero(estimacion.importe_amortizado_acumulado_anterior) ?? 0;
  const amortizacionActual = financiero.amortizacion_anticipo;
  const amortizacionAcumulada =
    amortizacionAnterior + amortizacionActual;
  const anticipoTotal =
    aNumero(metadata.anticipo_total) ??
    aNumero(metadata.fianza_anticipo) ??
    amortizacionAcumulada;
  const anticipoSaldo =
    anticipoTotal > 0 ? anticipoTotal - amortizacionAcumulada : 0;

  const subtotalNeto = redondearMoneda(
    financiero.subtotal - financiero.amortizacion_anticipo,
  );
  const porcentajeIva = determinarPorcentajeIva(
    estimacion.porcentaje_iva_aplicado,
  );
  const baseIva = Math.max(0, subtotalNeto);
  const ivaCalculado = redondearMoneda(baseIva * (porcentajeIva / 100));
  const netoCalculado = redondearMoneda(
    financiero.subtotal +
      ivaCalculado -
      financiero.retencion_inspeccion -
      financiero.amortizacion_anticipo -
      financiero.retencion_atraso_programa,
  );
  const contratoNumero =
    aTexto(metadata.numero_contrato) ??
    aTexto(contrato?.numero_contrato) ??
    "—";
  const fechaContrato = formatearFecha(
    aTexto(metadata.fecha_contrato) ?? contrato?.fecha_contrato,
  );
  const rfc =
    aTexto(metadata.rfc_contratista) ??
    aTexto(contratista?.rfc) ??
    "—";
  const lugarObra =
    aTexto(metadata.lugar_obra) ??
    aTexto(contrato?.lugar_obra) ??
    "—";
  const subtotalPartidas = redondearMoneda(
    resumenPartidas.length > 0
      ? resumenPartidas.reduce(
          (total, partida) => total + Number(partida.importe ?? 0),
          0,
        )
      : financiero.subtotal,
  );
  const periodoEstimacion = `Del ${formatearFecha(
    estimacion.periodo_inicio,
  )} al ${formatearFecha(estimacion.periodo_fin)}`;

  return {
    nombreObra,
    descripcion: aTexto(metadata.descripcion) ?? "—",
    hoja: aTexto(metadata.hoja) ?? "1 de 1",
    contratoNumero,
    fechaContrato,
    contratista: aTexto(contratista?.razon_social) ?? "—",
    rfc,
    estimacionNumero: estimacion.folio,
    periodoInicio: formatearFecha(estimacion.periodo_inicio),
    periodoFin: formatearFecha(estimacion.periodo_fin),
    lugarObra,
    importesSinIva: [
      {
        etiqueta: "Contrato",
        importe: contratoTotal,
        porcentaje: contratoTotal > 0 ? 100 : null,
      },
      {
        etiqueta: "Acum. anterior",
        importe: acumuladoAnterior,
        porcentaje: calcularPorcentaje(acumuladoAnterior, contratoTotal),
      },
      {
        etiqueta: "Actual",
        importe: importeActual,
        porcentaje: calcularPorcentaje(importeActual, contratoTotal),
      },
      {
        etiqueta: "Acum. actual",
        importe: acumuladoActual,
        porcentaje: calcularPorcentaje(acumuladoActual, contratoTotal),
      },
      {
        etiqueta: "Saldo",
        importe: saldoSinIva,
        porcentaje: calcularPorcentaje(saldoSinIva, contratoTotal),
      },
    ],
    delAnticipo: [
      {
        etiqueta: "Anticipo total",
        importe: anticipoTotal,
        porcentaje: anticipoTotal > 0 ? 100 : null,
      },
      {
        etiqueta: "Amort. anterior",
        importe: amortizacionAnterior,
        porcentaje: calcularPorcentaje(amortizacionAnterior, anticipoTotal),
      },
      {
        etiqueta: "Actual",
        importe: amortizacionActual,
        porcentaje: calcularPorcentaje(amortizacionActual, anticipoTotal),
      },
      {
        etiqueta: "Acumulada",
        importe: amortizacionAcumulada,
        porcentaje: calcularPorcentaje(amortizacionAcumulada, anticipoTotal),
      },
      {
        etiqueta: "Saldo",
        importe: anticipoSaldo,
        porcentaje: calcularPorcentaje(anticipoSaldo, anticipoTotal),
      },
    ],
    delNeto: [
      {
        etiqueta: "Importe estimación",
        importe: financiero.subtotal,
        porcentaje: null,
      },
      {
        etiqueta: "Amortización",
        importe: financiero.amortizacion_anticipo,
        porcentaje: null,
        negativo: true,
      },
      {
        etiqueta: "Subtotal",
        importe: subtotalNeto,
        porcentaje: null,
      },
      {
        etiqueta: `IVA (${porcentajeIva.toLocaleString("es-MX", {
          maximumFractionDigits: 2,
        })}%)`,
        importe: ivaCalculado,
        porcentaje: null,
      },
      {
        etiqueta: "Retención 0.5% SFP",
        importe: financiero.retencion_inspeccion,
        porcentaje: null,
        negativo: true,
      },
      {
        etiqueta: "Retención atraso",
        importe: financiero.retencion_atraso_programa,
        porcentaje: null,
        negativo: true,
      },
      {
        etiqueta: "Neto a recibir",
        importe: netoCalculado,
        porcentaje: null,
        enfasis: true,
      },
    ],
    contratistaDetalle: [
      {
        etiqueta: "RFC",
        valor: rfc,
      },
      {
        etiqueta: "Registro IVA",
        valor:
          aTexto(metadata.registro_iva) ??
          aTexto(contratista?.registro_iva) ??
          "—",
      },
      {
        etiqueta: "Registro CMIC",
        valor:
          aTexto(metadata.registro_cmic) ??
          aTexto(contratista?.registro_cmic) ??
          "—",
      },
      {
        etiqueta: "Registro GACM",
        valor:
          aTexto(metadata.registro_gacm) ??
          aTexto(contratista?.registro_gacm) ??
          "—",
      },
    ],
    contratoDetalle: [
      {
        etiqueta: "Número de contrato",
        valor: contratoNumero,
      },
      {
        etiqueta: "Fecha de contrato",
        valor: fechaContrato,
      },
      {
        etiqueta: "Número de adendum",
        valor: aTexto(metadata.numero_adendum) ?? "—",
      },
      {
        etiqueta: "Fecha de adendum",
        valor: formatearFecha(aTexto(metadata.fecha_adendum)),
      },
      {
        etiqueta: "Lugar de la obra",
        valor: lugarObra,
      },
      {
        etiqueta: "Periodo de ejecución",
        valor: describirPeriodo(metadata, contrato),
      },
    ],
    fianzasDetalle: [
      {
        concepto: "Fianza de cumplimiento",
        numero: aTexto(metadata.numero_fianza_cumplimiento) ?? "—",
        fecha: formatearFecha(aTexto(metadata.fecha_fianza_cumplimiento)),
        importe: describirMonto(metadata.fianza_cumplimiento) ?? "—",
      },
      {
        concepto: "Fianza de anticipo",
        numero: aTexto(metadata.numero_fianza_anticipo) ?? "—",
        fecha: formatearFecha(aTexto(metadata.fecha_fianza_anticipo)),
        importe: describirMonto(metadata.fianza_anticipo) ?? "—",
      },
    ],
    estimacionDetalle: [
      {
        etiqueta: "Número",
        valor: estimacion.folio,
      },
      {
        etiqueta: "Monto de estimación",
        valor: formatearMoneda(importeActual),
      },
      {
        etiqueta: "Estimado anterior",
        valor: formatearMoneda(acumuladoAnterior),
      },
      {
        etiqueta: "Monto del contrato",
        valor: formatearMoneda(contratoTotal),
      },
      {
        etiqueta: "Total estimado",
        valor: formatearMoneda(acumuladoActual),
      },
      {
        etiqueta: "Saldo del contrato",
        valor: formatearMoneda(saldoSinIva),
      },
      {
        etiqueta: "Periodo de ejecución",
        valor: periodoEstimacion,
      },
    ],
    gruposConceptos: agruparConceptos(caratula.conceptos),
    porcentajeIva,
    resumenPartidas,
    resumenTotales: {
      totalEstimacion: financiero.subtotal,
      amortizacion: financiero.amortizacion_anticipo,
      subtotal: subtotalNeto,
      iva: ivaCalculado,
      retencionSfp: financiero.retencion_inspeccion,
      retencionAtraso: financiero.retencion_atraso_programa,
      totalNeto: netoCalculado,
    },
    subtotalPartidas,
    importeConLetraSubtotal: importeALetras(subtotalPartidas),
    importeConLetraNeto: importeALetras(netoCalculado),
    firmas: [
      {
        accion: "Formuló",
        rol: "Superintendente",
        hash: estimacion.firma_superintendente,
      },
      {
        accion: "Revisó",
        rol: "Supervisor",
        hash: estimacion.firma_supervisor,
      },
      {
        accion: "Autorizó",
        rol: "Residente",
        hash: estimacion.firma_residente,
      },
    ],
  };
}
