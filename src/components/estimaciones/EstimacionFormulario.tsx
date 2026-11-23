"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  Calculator,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatearMoneda } from "@/lib/format";
import {
  MENSAJE_TRASLADO,
  TIPO_CATALOGO_POR_ESTIMACION,
  diaDelMesActual,
  ventanaPresentacion,
} from "@/lib/ventanas-estimacion";
import { getCatalogosPorObra } from "@/services/catalogo";
import { getContrato } from "@/services/contrato";
import {
  actualizarEstimacion,
  crearEstimacion,
  getEstimaciones,
} from "@/services/estimacion";
import {
  TIPOS_CON_TOPES_25,
  TIPOS_ESTIMACION,
} from "@/types/estimacion";
import type {
  CrearEstimacionPayload,
  Estimacion,
  EstimacionDetalle,
  MetadataCaratula,
  TipoEstimacion,
} from "@/types/estimacion";
import type { ConceptoConPartida, ContratoConContratista } from "@/types";

const fechaOpcionalSchema = z
  .string()
  .refine(
    (valor) => !valor || /^\d{4}-\d{2}-\d{2}$/.test(valor),
    "Formato de fecha inválido (YYYY-MM-DD)",
  )
  .optional();

const metadataSchema = z.object({
  descripcion: z.string().trim().max(255).optional(),
  hoja: z.string().trim().max(50).optional(),
  anticipo_total: z.string().trim().max(255).optional(),
  numero_contrato: z.string().max(100).optional(),
  fecha_contrato: fechaOpcionalSchema,
  rfc_contratista: z.string().trim().max(20).optional(),
  registro_iva: z.string().trim().max(50).optional(),
  registro_cmic: z.string().trim().max(50).optional(),
  registro_gacm: z.string().trim().max(50).optional(),
  numero_adendum: z.string().trim().max(100).optional(),
  fecha_adendum: fechaOpcionalSchema,
  lugar_obra: z.string().trim().max(255).optional(),
  periodo_ejecucion: z.string().trim().max(255).optional(),
  fianza_cumplimiento: z.string().trim().max(255).optional(),
  fianza_anticipo: z.string().trim().max(255).optional(),
  numero_fianza_cumplimiento: z.string().trim().max(100).optional(),
  fecha_fianza_cumplimiento: fechaOpcionalSchema,
  numero_fianza_anticipo: z.string().trim().max(100).optional(),
  fecha_fianza_anticipo: fechaOpcionalSchema,
});

const conceptoSchema = z
  .object({
    id_concepto: z.uuid("Selecciona un concepto"),
    cantidad: z.number("Requerido").positive("La cantidad debe ser mayor a 0"),
    unidad: z.string().optional(),
    cantidad_proyecto: z.number().nonnegative().optional(),
    precio_unitario: z.number().nonnegative().optional(),
    cantidad_anterior: z.number().nonnegative().optional(),
    saldo: z.number().optional(),
  })
  .superRefine((concepto, ctx) => {
    const saldo = concepto.saldo;

    if (
      typeof saldo === "number" &&
      Number.isFinite(saldo) &&
      concepto.cantidad > saldo + 1e-9
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cantidad"],
        message: `La cantidad no puede exceder el saldo disponible (${formatearCantidad(saldo)}).`,
      });
    }
  });

const esquemaEstimacion = z
  .object({
    tipo: z.enum(TIPOS_ESTIMACION, "Selecciona un tipo"),
    fecha: z.string().min(1, "Requerido"),
    periodo_inicio: z.string().min(1, "Requerido"),
    periodo_fin: z.string().min(1, "Requerido"),
    amortizacion_porcentaje: z
      .number("Requerido")
      .min(0, "No puede ser negativo")
      .max(100, "No puede exceder 100%"),
    retencion_sfp_porcentaje: z
      .number("Requerido")
      .min(0, "No puede ser negativo")
      .max(100, "No puede exceder 100%"),
    retencion_manual: z
      .number("Requerido")
      .min(0, "No puede ser negativo"),
    metadata_caratula: metadataSchema,
    conceptos: z.array(conceptoSchema).min(1, "Agrega al menos un concepto"),
  })
  .refine((data) => data.periodo_fin >= data.periodo_inicio, {
    message: "El fin del periodo no puede ser anterior al inicio",
    path: ["periodo_fin"],
  })
  .refine(
    (data) => {
      const ids = data.conceptos
        .map((concepto) => concepto.id_concepto)
        .filter(Boolean);
      return new Set(ids).size === ids.length;
    },
    {
      message: "No puedes agregar el mismo concepto dos veces",
      path: ["conceptos"],
    },
  );

type FormValues = z.infer<typeof esquemaEstimacion>;

const ETIQUETAS_TIPO: Record<TipoEstimacion, string> = {
  Normal: "Normal",
  Adicional: "Adicional (sujeta al tope del 25%)",
  Extraordinaria: "Extraordinaria (sujeta al tope del 25%)",
};

const TASA_IVA = 0.16;
const TASA_SFP_DEFAULT = 0.5;

interface EstimacionFormularioProps {
  idObra: string;
  estimacion?: EstimacionDetalle | null;
  onSuccess: (estimacion: Estimacion) => void;
  onCancelHref?: string;
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function aTexto(valor: unknown): string {
  if (valor === null || valor === undefined) {
    return "";
  }

  return String(valor);
}

function textoONull(valor: string | undefined): string | null {
  const texto = valor?.trim() ?? "";
  return texto.length > 0 ? texto : null;
}

function redondear(valor: number): number {
  return Number(valor.toFixed(2));
}

function formatearCantidad(valor: number): string {
  return valor.toLocaleString("es-MX", { maximumFractionDigits: 2 });
}

function crearFilaVacia(): FormValues["conceptos"][number] {
  return {
    id_concepto: "",
    cantidad: 0,
    unidad: "",
    cantidad_proyecto: 0,
    precio_unitario: 0,
    cantidad_anterior: 0,
    saldo: 0,
  };
}

function crearValoresIniciales(
  estimacion?: EstimacionDetalle | null,
): FormValues {
  const metadata = estimacion?.metadata_caratula ?? {};
  const conceptos =
    estimacion && estimacion.conceptos.length > 0
      ? estimacion.conceptos.map((concepto) => {
          const cantidadProyecto = Number(
            concepto.cantidad_segun_proyecto ?? 0,
          );
          const cantidadAnterior = Number(
            concepto.cantidad_hasta_estimacion_anterior ?? 0,
          );

          return {
            id_concepto: concepto.id_concepto,
            cantidad: Number(concepto.cantidad_de_esta_estimacion ?? 0),
            unidad: concepto.unidad_medida ?? "",
            cantidad_proyecto: cantidadProyecto,
            precio_unitario: Number(concepto.precio_unitario_snapshot ?? 0),
            cantidad_anterior: cantidadAnterior,
            saldo: redondear(cantidadProyecto - cantidadAnterior),
          };
        })
      : [crearFilaVacia()];

  const importeEstimacion = Number(estimacion?.importe_estimacion_actual ?? 0);
  const importeAmortizacion = Number(
    estimacion?.importe_amortizacion_actual ?? 0,
  );
  const porcentajeAmortizacion =
    importeEstimacion > 0
      ? (importeAmortizacion / importeEstimacion) * 100
      : 0;

  return {
    tipo: estimacion?.tipo ?? "Normal",
    fecha: estimacion?.fecha?.slice(0, 10) ?? hoy(),
    periodo_inicio: estimacion?.periodo_inicio?.slice(0, 10) ?? "",
    periodo_fin: estimacion?.periodo_fin?.slice(0, 10) ?? "",
    amortizacion_porcentaje: Number(porcentajeAmortizacion.toFixed(4)),
    retencion_sfp_porcentaje: Number(
      (Number(estimacion?.porcentaje_retencion_sfp ?? 0) * 100).toFixed(4),
    ) || TASA_SFP_DEFAULT,
    retencion_manual: Number(
      estimacion?.importe_retencion_atraso_programa ?? 0,
    ),
    metadata_caratula: {
      descripcion: aTexto(metadata.descripcion),
      hoja: aTexto(metadata.hoja),
      anticipo_total: aTexto(metadata.anticipo_total),
      numero_contrato: aTexto(metadata.numero_contrato),
      fecha_contrato: aTexto(metadata.fecha_contrato),
      rfc_contratista: aTexto(metadata.rfc_contratista),
      registro_iva: aTexto(metadata.registro_iva),
      registro_cmic: aTexto(metadata.registro_cmic),
      registro_gacm: aTexto(metadata.registro_gacm),
      numero_adendum: aTexto(metadata.numero_adendum),
      fecha_adendum: aTexto(metadata.fecha_adendum),
      lugar_obra: aTexto(metadata.lugar_obra),
      periodo_ejecucion: aTexto(metadata.periodo_ejecucion),
      fianza_cumplimiento: aTexto(metadata.fianza_cumplimiento),
      fianza_anticipo: aTexto(metadata.fianza_anticipo),
      numero_fianza_cumplimiento: aTexto(
        metadata.numero_fianza_cumplimiento,
      ),
      fecha_fianza_cumplimiento: aTexto(
        metadata.fecha_fianza_cumplimiento,
      ),
      numero_fianza_anticipo: aTexto(metadata.numero_fianza_anticipo),
      fecha_fianza_anticipo: aTexto(metadata.fecha_fianza_anticipo),
    },
    conceptos,
  };
}

function construirMetadata(
  metadata: FormValues["metadata_caratula"],
): MetadataCaratula {
  return {
    descripcion: textoONull(metadata.descripcion),
    hoja: textoONull(metadata.hoja),
    anticipo_total: textoONull(metadata.anticipo_total),
    numero_contrato: textoONull(metadata.numero_contrato),
    fecha_contrato: textoONull(metadata.fecha_contrato),
    rfc_contratista: textoONull(metadata.rfc_contratista),
    registro_iva: textoONull(metadata.registro_iva),
    registro_cmic: textoONull(metadata.registro_cmic),
    registro_gacm: textoONull(metadata.registro_gacm),
    numero_adendum: textoONull(metadata.numero_adendum),
    fecha_adendum: textoONull(metadata.fecha_adendum),
    lugar_obra: textoONull(metadata.lugar_obra),
    periodo_ejecucion: textoONull(metadata.periodo_ejecucion),
    fianza_cumplimiento: textoONull(metadata.fianza_cumplimiento),
    fianza_anticipo: textoONull(metadata.fianza_anticipo),
    numero_fianza_cumplimiento: textoONull(
      metadata.numero_fianza_cumplimiento,
    ),
    fecha_fianza_cumplimiento: textoONull(
      metadata.fecha_fianza_cumplimiento,
    ),
    numero_fianza_anticipo: textoONull(metadata.numero_fianza_anticipo),
    fecha_fianza_anticipo: textoONull(metadata.fecha_fianza_anticipo),
  };
}

export function EstimacionFormulario({
  idObra,
  estimacion = null,
  onSuccess,
  onCancelHref = "/dashboard/estimaciones",
}: EstimacionFormularioProps) {
  const valoresIniciales = useMemo(
    () => crearValoresIniciales(estimacion),
    [estimacion],
  );
  const [catalogos, setCatalogos] = useState<ConceptoConPartida[]>([]);
  const [contrato, setContrato] = useState<ContratoConContratista | null>(null);
  const [estimaciones, setEstimaciones] = useState<Estimacion[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [errorDatos, setErrorDatos] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [panelAcumuladosAbierto, setPanelAcumuladosAbierto] = useState(true);
  const tipoPrevioRef = useRef<TipoEstimacion | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(esquemaEstimacion),
    defaultValues: valoresIniciales,
    mode: "onChange",
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "conceptos",
  });

  const conceptosCapturados = useWatch({ control, name: "conceptos" });
  const tipoSeleccionado = useWatch({ control, name: "tipo" });
  const fechaSeleccionada = useWatch({ control, name: "fecha" });
  const amortizacionPorcentaje = useWatch({
    control,
    name: "amortizacion_porcentaje",
  });
  const retencionSfpPorcentaje = useWatch({
    control,
    name: "retencion_sfp_porcentaje",
  });
  const retencionManual = useWatch({ control, name: "retencion_manual" });

  const fechaCorte = fechaSeleccionada || valoresIniciales.fecha || hoy();

  useEffect(() => {
    let activo = true;

    Promise.all([
      getCatalogosPorObra(idObra, {
        tipoEstimacion: tipoSeleccionado,
        fechaCorte,
        excluirIdEstimacion: estimacion?.id_estimacion,
      }),
      getContrato(idObra).catch(() => null),
      getEstimaciones(idObra).catch(() => []),
    ])
      .then(([catalogosCargados, contratoCargado, lista]) => {
        if (!activo) return;

        setCatalogos(catalogosCargados);
        setContrato(contratoCargado);
        setEstimaciones(lista);
        setErrorDatos(null);

        if (contratoCargado && !estimacion) {
          if (!getValues("metadata_caratula.numero_contrato")) {
            setValue(
              "metadata_caratula.numero_contrato",
              contratoCargado.numero_contrato,
            );
          }
          if (!getValues("metadata_caratula.fecha_contrato")) {
            setValue(
              "metadata_caratula.fecha_contrato",
              contratoCargado.fecha_contrato?.slice(0, 10) ?? "",
            );
          }
          if (!getValues("metadata_caratula.rfc_contratista")) {
            setValue(
              "metadata_caratula.rfc_contratista",
              contratoCargado.contratista?.rfc ?? "",
            );
          }
          if (!getValues("metadata_caratula.registro_iva")) {
            setValue(
              "metadata_caratula.registro_iva",
              contratoCargado.contratista?.registro_iva ?? "",
            );
          }
          if (!getValues("metadata_caratula.registro_cmic")) {
            setValue(
              "metadata_caratula.registro_cmic",
              contratoCargado.contratista?.registro_cmic ?? "",
            );
          }
          if (!getValues("metadata_caratula.registro_gacm")) {
            setValue(
              "metadata_caratula.registro_gacm",
              contratoCargado.contratista?.registro_gacm ?? "",
            );
          }
          if (!getValues("metadata_caratula.lugar_obra")) {
            setValue(
              "metadata_caratula.lugar_obra",
              contratoCargado.lugar_obra ?? "",
            );
          }
          if (!getValues("metadata_caratula.periodo_ejecucion")) {
            setValue(
              "metadata_caratula.periodo_ejecucion",
              `${contratoCargado.periodo_ejecucion_inicio ?? ""} — ${
                contratoCargado.periodo_ejecucion_fin ?? ""
              }`,
            );
          }
        }
      })
      .catch((err: unknown) => {
        if (activo) {
          setErrorDatos(
            err instanceof Error ? err.message : "Ocurrió un error inesperado.",
          );
        }
      })
      .finally(() => {
        if (activo) setCargandoDatos(false);
      });

    return () => {
      activo = false;
    };
  }, [
    idObra,
    fechaCorte,
    tipoSeleccionado,
    estimacion,
    getValues,
    setValue,
  ]);

  useEffect(() => {
    const tipoAnterior = tipoPrevioRef.current;
    tipoPrevioRef.current = tipoSeleccionado;

    if (tipoAnterior === null || tipoAnterior === tipoSeleccionado) {
      return;
    }

    replace([]);
    setErrorServidor(null);
  }, [tipoSeleccionado, replace]);

  const catalogoPorId = useMemo(() => {
    const mapa = new Map<string, ConceptoConPartida>();
    for (const concepto of catalogos) {
      mapa.set(concepto.id_concepto, concepto);
    }
    return mapa;
  }, [catalogos]);

  const conceptosOriginalesPorId = useMemo(() => {
    const mapa = new Map(
      (estimacion?.conceptos ?? []).map((concepto) => [
        concepto.id_concepto,
        concepto,
      ]),
    );
    return mapa;
  }, [estimacion]);

  const tipoCatalogoRequerido = TIPO_CATALOGO_POR_ESTIMACION[tipoSeleccionado];

  const catalogosDisponibles = useMemo(
    () =>
      catalogos.filter(
        (concepto) => concepto.tipo === tipoCatalogoRequerido,
      ),
    [catalogos, tipoCatalogoRequerido],
  );

  const catalogoDisponiblePorId = useMemo(() => {
    const mapa = new Map<string, ConceptoConPartida>();
    for (const concepto of catalogosDisponibles) {
      mapa.set(concepto.id_concepto, concepto);
    }
    return mapa;
  }, [catalogosDisponibles]);

  const acumuladosPrevios = useMemo(
    () =>
      catalogosDisponibles.filter(
        (concepto) =>
          Number(concepto.cantidad_anterior ?? 0) > 0 ||
          Number(concepto.importe_anterior ?? 0) > 0,
      ),
    [catalogosDisponibles],
  );

  function aplicarConceptoFila(index: number, idConcepto: string): void {
    const concepto = catalogoPorId.get(idConcepto);
    const original = conceptosOriginalesPorId.get(idConcepto);
    const cantidadProyecto = Number(
      original?.cantidad_segun_proyecto ?? concepto?.cantidad ?? 0,
    );
    const cantidadAnterior = Number(
      concepto?.cantidad_anterior ??
        original?.cantidad_hasta_estimacion_anterior ??
        0,
    );
    const precioUnitario = Number(
      original?.precio_unitario_snapshot ?? concepto?.precio_unitario ?? 0,
    );
    const saldo = Number(
      concepto?.saldo_cantidad ??
        Math.max(cantidadProyecto - cantidadAnterior, 0),
    );
    const opciones = { shouldDirty: true, shouldValidate: true };

    setValue(
      `conceptos.${index}.unidad`,
      original?.unidad_medida ?? concepto?.unidad_medida ?? "",
      opciones,
    );
    setValue(
      `conceptos.${index}.cantidad_proyecto`,
      redondear(cantidadProyecto),
      opciones,
    );
    setValue(
      `conceptos.${index}.cantidad_anterior`,
      redondear(cantidadAnterior),
      opciones,
    );
    setValue(
      `conceptos.${index}.precio_unitario`,
      redondear(precioUnitario),
      opciones,
    );
    setValue(`conceptos.${index}.saldo`, redondear(saldo), opciones);

    if (getValues(`conceptos.${index}.id_concepto`) !== idConcepto) {
      setValue(`conceptos.${index}.cantidad`, 0, opciones);
    }
  }

  const filas = useMemo(() => {
    return (conceptosCapturados ?? []).map((item) => {
      const concepto = catalogoPorId.get(item.id_concepto);
      const original = conceptosOriginalesPorId.get(item.id_concepto);
      const cantidad = Number(item.cantidad);
      const cantidadValida = Number.isFinite(cantidad) && cantidad > 0;
      const cantidadProyecto = Number(
        item.cantidad_proyecto ??
          concepto?.cantidad ??
          original?.cantidad_segun_proyecto ??
          0,
      );
      const cantidadAnterior = Number(
        item.cantidad_anterior ??
          concepto?.cantidad_anterior ??
          original?.cantidad_hasta_estimacion_anterior ??
          0,
      );
      const precioUnitario = Number(
        item.precio_unitario ??
          original?.precio_unitario_snapshot ??
          concepto?.precio_unitario ??
          0,
      );
      const saldo = Number(
        item.saldo ??
          concepto?.saldo_cantidad ??
          Math.max(cantidadProyecto - cantidadAnterior, 0),
      );
      const saldoDisponible = Math.max(saldo, 0);
      const cantidadAcumulada =
        cantidadAnterior + (cantidadValida ? cantidad : 0);
      const saldoRestante = redondear(cantidadProyecto - cantidadAcumulada);
      const importe = cantidadValida ? redondear(cantidad * precioUnitario) : 0;
      const excedeSaldo =
        Boolean(concepto || original) && cantidad > saldoDisponible + 1e-9;
      const importeMaximo = saldoDisponible * precioUnitario;
      const excedeImporte =
        Boolean(concepto || original) && importe > importeMaximo + 1e-9;

      return {
        idConcepto: item.id_concepto,
        clave: original?.clave ?? concepto?.clave ?? "—",
        descripcion: original?.descripcion ?? concepto?.descripcion ?? "—",
        unidad:
          item.unidad ||
          original?.unidad_medida ||
          concepto?.unidad_medida ||
          "—",
        cantidad,
        cantidadValida,
        cantidadProyecto,
        cantidadAnterior,
        cantidadAcumulada,
        saldo,
        saldoDisponible,
        saldoRestante,
        precioUnitario,
        importe,
        excedeSaldo,
        excedeVolumen: excedeSaldo,
        excedeImporte,
      };
    });
  }, [conceptosCapturados, catalogoPorId, conceptosOriginalesPorId]);

  const hayErroresVolumen = filas.some(
    (fila) => fila.excedeVolumen || fila.excedeImporte,
  );

  const subtotal = filas.reduce((total, fila) => total + fila.importe, 0);
  const retencionSfp = subtotal * (retencionSfpPorcentaje / 100);
  const amortizacion = subtotal * (amortizacionPorcentaje / 100);
  const baseIva = Math.max(0, subtotal - amortizacion);
  const iva = baseIva * TASA_IVA;
  const retencionAtraso = Number(retencionManual) || 0;
  const neto = subtotal + iva - retencionSfp - amortizacion - retencionAtraso;

  const tipoConTope25 = TIPOS_CON_TOPES_25.includes(tipoSeleccionado);
  const importeContrato = contrato?.importe_contrato ?? null;
  const tope25 =
    typeof importeContrato === "number" ? importeContrato * 0.25 : null;
  const acumuladoAdicionalAprobado = useMemo(
    () =>
      estimaciones
        .filter(
          (item) =>
            item.estado === "Aprobada" &&
            TIPOS_CON_TOPES_25.includes(item.tipo),
        )
        .reduce(
          (total, item) =>
            total + Number(item.importe_estimacion_actual ?? 0),
          0,
        ),
    [estimaciones],
  );
  const excedeTope25 =
    tipoConTope25 &&
    tope25 !== null &&
    acumuladoAdicionalAprobado + subtotal > tope25;

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);

    if (hayErroresVolumen) {
      setErrorServidor(
        "Hay conceptos que exceden el volumen total disponible. Corrígelos antes de guardar.",
      );
      return;
    }

    if (excedeTope25) {
      setErrorServidor(
        "La estimación excede el tope del 25% permitido para estimaciones adicionales o extraordinarias.",
      );
      return;
    }

    if (!estimacion && !ventanaPresentacion()) {
      setErrorServidor(
        diaDelMesActual() >= 16
          ? MENSAJE_TRASLADO
          : "Fuera de tiempo. La presentación de estimaciones solo está permitida del día 1 al 5 del mes.",
      );
      return;
    }

    const filasEnvio = filas.filter((fila) => fila.cantidadValida);
    const tipoRequerido = TIPO_CATALOGO_POR_ESTIMACION[valores.tipo];
    const conceptosTipoInvalido = filasEnvio.filter((fila) => {
      const concepto = catalogoPorId.get(fila.idConcepto);
      return concepto && concepto.tipo !== tipoRequerido;
    });

    if (conceptosTipoInvalido.length > 0) {
      setErrorServidor(
        `RF3.1 - Los conceptos seleccionados deben pertenecer al catálogo "${tipoRequerido}".`,
      );
      return;
    }

    const subtotalEnvio = filasEnvio.reduce(
      (total, fila) => total + fila.importe,
      0,
    );

    const payload: CrearEstimacionPayload = {
      id_obra: idObra,
      tipo: valores.tipo,
      fecha: valores.fecha || fechaCorte,
      periodo_inicio: valores.periodo_inicio,
      periodo_fin: valores.periodo_fin,
      metadata_caratula: construirMetadata(valores.metadata_caratula),
      amortizacion: redondear(
        subtotalEnvio * (valores.amortizacion_porcentaje / 100),
      ),
      retencion_manual: redondear(valores.retencion_manual),
      conceptos: filasEnvio.map((fila) => ({
        id_concepto: fila.idConcepto,
        cantidad: fila.cantidad,
        cantidad_de_esta_estimacion: fila.cantidad,
        cantidad_hasta_estimacion_anterior: fila.cantidadAnterior,
        cantidad_segun_proyecto: fila.cantidadProyecto,
        precio_unitario_snapshot: fila.precioUnitario,
        importe: redondear(fila.importe),
        clave: fila.clave,
        descripcion: fila.descripcion,
        unidad_medida: fila.unidad,
      })),
    };

    try {
      const guardada = estimacion
        ? await actualizarEstimacion(
            idObra,
            estimacion.id_estimacion,
            payload,
          )
        : await crearEstimacion(idObra, payload);

      onSuccess(guardada);
    } catch (err) {
      setErrorServidor(
        err instanceof Error ? err.message : "Ocurrió un error inesperado.",
      );
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4" aria-hidden="true" />
            Datos de contrato y fianzas
          </CardTitle>
          <CardDescription>
            Información de la carátula oficial: contrato, contratista,
            adendum y fianzas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo
            id="numero_contrato"
            etiqueta="Número de contrato"
            error={errors.metadata_caratula?.numero_contrato?.message}
          >
            <Input
              id="numero_contrato"
              {...register("metadata_caratula.numero_contrato")}
            />
          </Campo>

          <Campo
            id="fecha_contrato"
            etiqueta="Fecha de contrato"
            error={errors.metadata_caratula?.fecha_contrato?.message}
          >
            <Input
              id="fecha_contrato"
              type="date"
              {...register("metadata_caratula.fecha_contrato")}
            />
          </Campo>

          <Campo
            id="rfc_contratista"
            etiqueta="RFC del contratista"
            error={errors.metadata_caratula?.rfc_contratista?.message}
          >
            <Input
              id="rfc_contratista"
              {...register("metadata_caratula.rfc_contratista")}
            />
          </Campo>

          <Campo
            id="registro_iva"
            etiqueta="Registro IVA"
            error={errors.metadata_caratula?.registro_iva?.message}
          >
            <Input
              id="registro_iva"
              {...register("metadata_caratula.registro_iva")}
            />
          </Campo>

          <Campo
            id="registro_cmic"
            etiqueta="Registro CMIC"
            error={errors.metadata_caratula?.registro_cmic?.message}
          >
            <Input
              id="registro_cmic"
              {...register("metadata_caratula.registro_cmic")}
            />
          </Campo>

          <Campo
            id="registro_gacm"
            etiqueta="Registro GACM"
            error={errors.metadata_caratula?.registro_gacm?.message}
          >
            <Input
              id="registro_gacm"
              {...register("metadata_caratula.registro_gacm")}
            />
          </Campo>

          <Campo
            id="numero_adendum"
            etiqueta="Número de adendum"
            error={errors.metadata_caratula?.numero_adendum?.message}
          >
            <Input
              id="numero_adendum"
              {...register("metadata_caratula.numero_adendum")}
            />
          </Campo>

          <Campo
            id="fecha_adendum"
            etiqueta="Fecha del adendum"
            error={errors.metadata_caratula?.fecha_adendum?.message}
          >
            <Input
              id="fecha_adendum"
              type="date"
              {...register("metadata_caratula.fecha_adendum")}
            />
          </Campo>

          <Campo
            id="lugar_obra"
            etiqueta="Lugar de la obra"
            error={errors.metadata_caratula?.lugar_obra?.message}
          >
            <Input
              id="lugar_obra"
              {...register("metadata_caratula.lugar_obra")}
            />
          </Campo>

          <Campo
            id="descripcion"
            etiqueta="Descripción de la obra"
            error={errors.metadata_caratula?.descripcion?.message}
          >
            <Input
              id="descripcion"
              {...register("metadata_caratula.descripcion")}
            />
          </Campo>

          <Campo
            id="hoja"
            etiqueta="Hoja"
            error={errors.metadata_caratula?.hoja?.message}
            ayuda="Ejemplo: 1 de 1"
          >
            <Input
              id="hoja"
              placeholder="1 de 1"
              {...register("metadata_caratula.hoja")}
            />
          </Campo>

          <Campo
            id="periodo_ejecucion"
            etiqueta="Periodo de ejecución"
            error={errors.metadata_caratula?.periodo_ejecucion?.message}
          >
            <Input
              id="periodo_ejecucion"
              {...register("metadata_caratula.periodo_ejecucion")}
            />
          </Campo>

          <Campo
            id="anticipo_total"
            etiqueta="Anticipo total (monto)"
            error={errors.metadata_caratula?.anticipo_total?.message}
          >
            <Input
              id="anticipo_total"
              inputMode="decimal"
              {...register("metadata_caratula.anticipo_total")}
            />
          </Campo>

          <Campo
            id="fianza_cumplimiento"
            etiqueta="Fianza de cumplimiento (monto)"
            error={errors.metadata_caratula?.fianza_cumplimiento?.message}
          >
            <Input
              id="fianza_cumplimiento"
              inputMode="decimal"
              {...register("metadata_caratula.fianza_cumplimiento")}
            />
          </Campo>

          <Campo
            id="fianza_anticipo"
            etiqueta="Fianza de anticipo (monto)"
            error={errors.metadata_caratula?.fianza_anticipo?.message}
          >
            <Input
              id="fianza_anticipo"
              inputMode="decimal"
              {...register("metadata_caratula.fianza_anticipo")}
            />
          </Campo>

          <Campo
            id="numero_fianza_cumplimiento"
            etiqueta="Número fianza de cumplimiento"
            error={
              errors.metadata_caratula?.numero_fianza_cumplimiento?.message
            }
          >
            <Input
              id="numero_fianza_cumplimiento"
              {...register("metadata_caratula.numero_fianza_cumplimiento")}
            />
          </Campo>

          <Campo
            id="fecha_fianza_cumplimiento"
            etiqueta="Fecha fianza de cumplimiento"
            error={
              errors.metadata_caratula?.fecha_fianza_cumplimiento?.message
            }
          >
            <Input
              id="fecha_fianza_cumplimiento"
              type="date"
              {...register("metadata_caratula.fecha_fianza_cumplimiento")}
            />
          </Campo>

          <Campo
            id="numero_fianza_anticipo"
            etiqueta="Número fianza de anticipo"
            error={errors.metadata_caratula?.numero_fianza_anticipo?.message}
          >
            <Input
              id="numero_fianza_anticipo"
              {...register("metadata_caratula.numero_fianza_anticipo")}
            />
          </Campo>

          <Campo
            id="fecha_fianza_anticipo"
            etiqueta="Fecha fianza de anticipo"
            error={errors.metadata_caratula?.fecha_fianza_anticipo?.message}
          >
            <Input
              id="fecha_fianza_anticipo"
              type="date"
              {...register("metadata_caratula.fecha_fianza_anticipo")}
            />
          </Campo>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parámetros financieros</CardTitle>
          <CardDescription>
            Amortización del anticipo, retención de inspección y retención
            manual por atraso.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo
            id="tipo"
            etiqueta="Tipo de estimación"
            error={errors.tipo?.message}
          >
            <select
              id="tipo"
              {...register("tipo")}
              className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400/40"
            >
              {TIPOS_ESTIMACION.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {ETIQUETAS_TIPO[tipo]}
                </option>
              ))}
            </select>
          </Campo>

          <Campo
            id="periodo_inicio"
            etiqueta="Periodo inicio"
            error={errors.periodo_inicio?.message}
          >
            <Input
              id="periodo_inicio"
              type="date"
              {...register("periodo_inicio")}
            />
          </Campo>

          <Campo
            id="periodo_fin"
            etiqueta="Periodo fin"
            error={errors.periodo_fin?.message}
          >
            <Input
              id="periodo_fin"
              type="date"
              {...register("periodo_fin")}
            />
          </Campo>

          <Campo
            id="amortizacion_porcentaje"
            etiqueta="% amortización de anticipo"
            error={errors.amortizacion_porcentaje?.message}
          >
            <Input
              id="amortizacion_porcentaje"
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register("amortizacion_porcentaje", {
                valueAsNumber: true,
              })}
            />
          </Campo>

          <Campo
            id="retencion_sfp_porcentaje"
            etiqueta="Retención SFP (%)"
            error={errors.retencion_sfp_porcentaje?.message}
            ayuda="La retención oficial de inspección es 0.5%."
          >
            <Input
              id="retencion_sfp_porcentaje"
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register("retencion_sfp_porcentaje", {
                valueAsNumber: true,
              })}
            />
          </Campo>

          <Campo
            id="retencion_manual"
            etiqueta="Retención por atraso (MXN)"
            error={errors.retencion_manual?.message}
          >
            <Input
              id="retencion_manual"
              type="number"
              step="0.01"
              min="0"
              {...register("retencion_manual", { valueAsNumber: true })}
            />
          </Campo>
        </CardContent>
        <CardContent className="border-t border-slate-100 pt-4">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
            <Resumen etiqueta="Subtotal" valor={subtotal} />
            <Resumen etiqueta="IVA (16%)" valor={iva} />
            <Resumen etiqueta="Retención SFP" valor={retencionSfp} negativo />
            <Resumen
              etiqueta="Amortización"
              valor={amortizacion}
              negativo
            />
            <Resumen
              etiqueta="Retención atraso"
              valor={retencionAtraso}
              negativo
            />
            <Resumen etiqueta="Neto estimado" valor={neto} destacado />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Generadores de obra</CardTitle>
            <CardDescription>
              Captura la cantidad de esta estimación por concepto. La cantidad
              anterior se calcula automáticamente.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={cargandoDatos || catalogosDisponibles.length === 0}
            onClick={() => append(crearFilaVacia())}
          >
            <Plus className="h-4 w-4" />
            Agregar concepto
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {cargandoDatos ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando catálogo y acumulados...
            </div>
          ) : null}

          {errorDatos ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>{errorDatos}</span>
            </div>
          ) : null}

          {!cargandoDatos && !errorDatos && catalogos.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Esta obra aún no tiene conceptos en el catálogo. Registra
              conceptos antes de crear una estimación.
            </div>
          ) : null}

          {!cargandoDatos &&
          !errorDatos &&
          catalogos.length > 0 &&
          catalogosDisponibles.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              No hay conceptos de tipo &quot;{tipoCatalogoRequerido}&quot; en el
              catálogo de esta obra. Cambia el tipo de estimación o registra
              conceptos de ese tipo.
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[1240px] text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Concepto</th>
                  <th className="px-3 py-2 text-center font-semibold">
                    Unidad
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Cant. proyecto
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Cant. anterior
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Cant. esta estimación
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Cant. acumulada
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Saldo restante
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">P.U.</th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Importe
                  </th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {fields.map((field, index) => {
                  const fila = filas[index];
                  const item = conceptosCapturados?.[index];
                  const idSeleccionado = item?.id_concepto ?? "";
                  const registroConcepto = register(
                    `conceptos.${index}.id_concepto`,
                  );
                  const mensajeCantidad =
                    errors.conceptos?.[index]?.cantidad?.message ??
                    (fila?.excedeSaldo
                      ? `No puede exceder el saldo disponible (${formatearCantidad(fila.saldoDisponible)}).`
                      : null);

                  return (
                    <tr key={field.id} className="align-top">
                      <td className="px-3 py-3">
                        <select
                          id={`concepto-${index}`}
                          {...registroConcepto}
                          onChange={(evento) => {
                            void registroConcepto.onChange(evento);
                            aplicarConceptoFila(index, evento.target.value);
                          }}
                          className="flex h-9 w-full min-w-[240px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400/40"
                        >
                          <option value="">Selecciona un concepto</option>
                          {catalogosDisponibles.map((concepto) => (
                            <option
                              key={concepto.id_concepto}
                              value={concepto.id_concepto}
                              disabled={conceptosCapturados.some(
                                (otro, otroIndex) =>
                                  otroIndex !== index &&
                                  otro.id_concepto === concepto.id_concepto,
                              )}
                            >
                              {concepto.clave} — {concepto.descripcion}
                            </option>
                          ))}
                          {idSeleccionado &&
                          !catalogoDisponiblePorId.has(idSeleccionado) &&
                          conceptosOriginalesPorId.has(idSeleccionado) &&
                          !catalogoPorId.has(idSeleccionado) ? (
                            <option
                              value={idSeleccionado}
                              disabled={conceptosCapturados.some(
                                (otro, otroIndex) =>
                                  otroIndex !== index &&
                                  otro.id_concepto === idSeleccionado,
                              )}
                            >
                              {conceptosOriginalesPorId.get(idSeleccionado)
                                ?.clave ?? idSeleccionado}{" "}
                              — concepto original
                            </option>
                          ) : null}
                        </select>
                        <p className="mt-1 max-w-[360px] truncate text-xs text-slate-500">
                          {fila?.descripcion ?? "Sin descripción"}
                        </p>
                        {errors.conceptos?.[index]?.id_concepto ? (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.conceptos[index]?.id_concepto?.message}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-3 py-3 text-center text-slate-600">
                        {fila?.unidad ?? "—"}
                      </td>

                      <td className="px-3 py-3 text-right text-slate-600">
                        {fila
                          ? formatearCantidad(fila.cantidadProyecto)
                          : "—"}
                      </td>

                      <td className="px-3 py-3 text-right text-slate-600">
                        {fila
                          ? formatearCantidad(fila.cantidadAnterior)
                          : "—"}
                      </td>

                      <td className="px-3 py-3 text-right">
                        <Input
                          id={`cantidad-${index}`}
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={fila?.saldoDisponible}
                          aria-invalid={Boolean(
                            fila?.excedeSaldo || fila?.excedeImporte,
                          )}
                          className="ml-auto w-32 text-right"
                          {...register(`conceptos.${index}.cantidad`, {
                            valueAsNumber: true,
                          })}
                        />
                        {mensajeCantidad ? (
                          <p className="mt-1 text-xs text-red-600">
                            {mensajeCantidad}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-3 py-3 text-right text-slate-600">
                        {fila
                          ? formatearCantidad(fila.cantidadAcumulada)
                          : "—"}
                      </td>

                      <td className="px-3 py-3 text-right text-slate-600">
                        {fila ? formatearCantidad(fila.saldoRestante) : "—"}
                      </td>

                      <td className="px-3 py-3 text-right text-slate-600">
                        {formatearMoneda(fila?.precioUnitario ?? 0)}
                      </td>

                      <td className="px-3 py-3 text-right font-medium text-slate-900">
                        {formatearMoneda(fila?.importe ?? 0)}
                      </td>

                      <td className="px-3 py-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-red-600"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}
                          aria-label="Quitar concepto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() =>
                setPanelAcumuladosAbierto((abierto) => !abierto)
              }
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-slate-50"
            >
              <span>
                <span className="block text-sm font-semibold text-slate-900">
                  Estado de Acumulados Previos del Catálogo
                </span>
                <span className="block text-xs text-slate-500">
                  Avance estimado del catálogo &quot;{tipoCatalogoRequerido}&quot;
                  antes de esta estimación.
                </span>
              </span>
              <span className="shrink-0 text-xs font-medium text-slate-500">
                {panelAcumuladosAbierto ? "Ocultar" : "Mostrar"}
              </span>
            </button>

            {panelAcumuladosAbierto ? (
              <div className="border-t border-slate-200 p-4">
                {acumuladosPrevios.length === 0 ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    Aún no hay cantidades estimadas previamente para este tipo
                    de catálogo
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[1000px] text-sm">
                      <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Clave</th>
                          <th className="px-3 py-2 font-semibold">Concepto</th>
                          <th className="px-3 py-2 text-center font-semibold">
                            Unidad
                          </th>
                          <th className="px-3 py-2 text-right font-semibold">
                            Cant. Proyecto
                          </th>
                          <th className="px-3 py-2 text-right font-semibold">
                            Cant. Estimada Anterior
                          </th>
                          <th className="px-3 py-2 text-right font-semibold">
                            Saldo por Estimar
                          </th>
                          <th className="px-3 py-2 text-right font-semibold">
                            % Avance Estimado
                          </th>
                          <th className="px-3 py-2 text-right font-semibold">
                            Importe Acumulado Anterior
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {acumuladosPrevios.map((concepto) => {
                          const cantidadProyecto = Number(concepto.cantidad ?? 0);
                          const cantidadAnterior = Number(
                            concepto.cantidad_anterior ?? 0,
                          );
                          const saldo = Number(
                            concepto.saldo_cantidad ??
                              Math.max(cantidadProyecto - cantidadAnterior, 0),
                          );
                          const importeAnterior = Number(
                            concepto.importe_anterior ?? 0,
                          );
                          const porcentaje =
                            cantidadProyecto > 0
                              ? (cantidadAnterior / cantidadProyecto) * 100
                              : 0;

                          return (
                            <tr key={concepto.id_concepto} className="align-top">
                              <td className="px-3 py-2 font-medium text-slate-900">
                                {concepto.clave}
                              </td>
                              <td className="px-3 py-2 text-slate-600">
                                {concepto.descripcion}
                              </td>
                              <td className="px-3 py-2 text-center text-slate-600">
                                {concepto.unidad_medida}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-600">
                                {formatearCantidad(cantidadProyecto)}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-600">
                                {formatearCantidad(cantidadAnterior)}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-600">
                                {formatearCantidad(saldo)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <div className="ml-auto flex w-28 items-center gap-2">
                                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className="h-full rounded-full bg-slate-500"
                                      style={{
                                        width: `${Math.min(Math.max(porcentaje, 0), 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="w-12 text-right text-xs text-slate-600">
                                    {porcentaje.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-slate-900">
                                {formatearMoneda(importeAnterior)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {filas.some((fila) => fila.excedeVolumen || fila.excedeImporte) ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>
                RF3.7: hay conceptos cuya cantidad acumulada o importe excede
                el volumen total del catálogo. Corrige las cantidades marcadas
                para poder guardar.
              </span>
            </div>
          ) : null}

          {errors.conceptos?.message ? (
            <p className="text-xs text-red-600">{errors.conceptos.message}</p>
          ) : null}

          <div className="flex items-center justify-end border-t border-slate-100 pt-4">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Subtotal de conceptos
              </p>
              <p className="text-xl font-semibold tracking-tight text-slate-900">
                {formatearMoneda(subtotal)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {errorServidor ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <span>{errorServidor}</span>
        </div>
      ) : null}

      {tipoConTope25 && contrato ? (
        <div
          className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${
            excedeTope25
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          {tope25 === null ? (
            <span>
              No hay un contrato registrado para validar la regla del 25%.
            </span>
          ) : (
            <span>
              RF3.11 — Regla del 25%: acumulado aprobado{" "}
              <strong>{formatearMoneda(acumuladoAdicionalAprobado)}</strong> +
              esta estimación <strong>{formatearMoneda(subtotal)}</strong> ={" "}
              <strong>
                {formatearMoneda(acumuladoAdicionalAprobado + subtotal)}
              </strong>{" "}
              / tope <strong>{formatearMoneda(tope25)}</strong>.{" "}
              {excedeTope25
                ? "La estimación excede el tope permitido y no puede guardarse."
                : "Dentro del tope permitido."}
            </span>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button asChild variant="outline">
          <a href={onCancelHref}>Cancelar</a>
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || hayErroresVolumen || excedeTope25}
          className="gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          {estimacion ? "Guardar cambios" : "Crear estimación"}
        </Button>
      </div>
    </form>
  );
}

function Campo({
  id,
  etiqueta,
  error,
  ayuda,
  children,
}: {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id}>{etiqueta}</Label>
      {children}
      {ayuda ? <p className="mt-1 text-xs text-slate-500">{ayuda}</p> : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function Resumen({
  etiqueta,
  valor,
  negativo = false,
  destacado = false,
}: {
  etiqueta: string;
  valor: number;
  negativo?: boolean;
  destacado?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        destacado
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <p
        className={`text-[10px] uppercase tracking-wide ${
          destacado ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {etiqueta}
      </p>
      <p
        className={`mt-0.5 text-sm font-semibold ${
          destacado ? "text-white" : "text-slate-900"
        }`}
      >
        {negativo ? `( - ) ${formatearMoneda(valor)}` : formatearMoneda(valor)}
      </p>
    </div>
  );
}
