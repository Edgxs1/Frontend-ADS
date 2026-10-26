"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { useObra } from "@/providers/obra-provider";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
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
import { getCatalogosPorObra } from "@/services/catalogo";
import { crearEstimacion } from "@/services/estimacion";
import { formatearMoneda } from "@/lib/format";
import { TIPOS_ESTIMACION } from "@/types/estimacion";
import type { CrearEstimacionPayload, TipoEstimacion } from "@/types/estimacion";
import type { ConceptoConPartida } from "@/types";

const detalleSchema = z.object({
  id_concepto: z.uuid("Selecciona un concepto"),
  cantidad: z
    .number("Requerido")
    .positive("La cantidad debe ser mayor a 0"),
});

const esquemaEstimacion = z
  .object({
    tipo: z.enum(TIPOS_ESTIMACION, "Selecciona un tipo"),
    periodo_inicio: z.string().min(1, "Requerido"),
    periodo_fin: z.string().min(1, "Requerido"),
    conceptos: z.array(detalleSchema).min(1, "Agrega al menos un concepto"),
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
  Ordinaria: "Ordinaria (Normal)",
  Extraordinaria: "Extraordinaria",
  Adicional: "Adicional",
};

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NuevaEstimacionPageClient() {
  const router = useRouter();
  const { rol, loading, loadingPerfil } = useSupabaseSession();
  const { obraActiva } = useObra();

  const idObra = obraActiva?.id_obra ?? null;
  const esSuperintendente = rol === "Superintendente";

  const [catalogos, setCatalogos] = useState<ConceptoConPartida[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [errorCatalogos, setErrorCatalogos] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(esquemaEstimacion),
    defaultValues: {
      tipo: "Ordinaria",
      periodo_inicio: "",
      periodo_fin: "",
      conceptos: [{ id_concepto: "", cantidad: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "conceptos",
  });

  const conceptosSeleccionados = watch("conceptos");

  useEffect(() => {
    if (!idObra) return;

    let activo = true;
    setCargandoCatalogos(true);
    setErrorCatalogos(null);

    getCatalogosPorObra(idObra)
      .then((data) => {
        if (activo) setCatalogos(data);
      })
      .catch((err: unknown) => {
        if (activo) {
          setErrorCatalogos(
            err instanceof Error ? err.message : "Ocurrió un error inesperado.",
          );
        }
      })
      .finally(() => {
        if (activo) setCargandoCatalogos(false);
      });

    return () => {
      activo = false;
    };
  }, [idObra]);

  const catalogoPorId = useMemo(() => {
    const mapa = new Map<string, ConceptoConPartida>();
    for (const concepto of catalogos) {
      mapa.set(concepto.id_concepto, concepto);
    }
    return mapa;
  }, [catalogos]);

  const totalLocal = useMemo(() => {
    if (!conceptosSeleccionados) return 0;

    return conceptosSeleccionados.reduce((total, item) => {
      const concepto = catalogoPorId.get(item.id_concepto);
      if (!concepto) return total;

      const cantidad = Number(item.cantidad);
      if (!Number.isFinite(cantidad) || cantidad <= 0) return total;

      return total + cantidad * concepto.precio_unitario;
    }, 0);
  }, [conceptosSeleccionados, catalogoPorId]);

  const conErrorDeCantidad = useMemo(() => {
    return (conceptosSeleccionados ?? []).some((item) => {
      const concepto = catalogoPorId.get(item.id_concepto);
      const cantidad = Number(item.cantidad);
      if (!concepto || !Number.isFinite(cantidad)) return false;
      return cantidad > concepto.cantidad;
    });
  }, [conceptosSeleccionados, catalogoPorId]);

  const onSubmit = handleSubmit(async (valores) => {
    if (!idObra) return;

    setErrorServidor(null);

    const payload: CrearEstimacionPayload = {
      tipo: valores.tipo,
      fecha: hoy(),
      periodo_inicio: valores.periodo_inicio,
      periodo_fin: valores.periodo_fin,
      conceptos: valores.conceptos.map((concepto) => ({
        id_concepto: concepto.id_concepto,
        cantidad: concepto.cantidad,
      })),
    };

    try {
      await crearEstimacion(idObra, payload);
      router.push("/dashboard/estimaciones");
      router.refresh();
    } catch (err) {
      setErrorServidor(
        err instanceof Error ? err.message : "Ocurrió un error inesperado.",
      );
    }
  });

  if (loading || loadingPerfil) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden="true" />
      </div>
    );
  }

  if (!esSuperintendente) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            Solo el Superintendente puede registrar nuevas estimaciones.
          </span>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/dashboard/estimaciones">
            <ArrowLeft className="h-4 w-4" />
            Volver a estimaciones
          </Link>
        </Button>
      </div>
    );
  }

  if (!obraActiva) {
    return <SinObraSeleccionada />;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link
          href="/dashboard/estimaciones"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a estimaciones
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
            <Calculator className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Nueva Estimación
            </h1>
            <p className="text-sm text-slate-500">{obraActiva.nombre}</p>
          </div>
        </div>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos generales</CardTitle>
            <CardDescription>
              Define el tipo de estimación y el periodo que cubre.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="tipo">Tipo de estimación</Label>
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
              {errors.tipo ? (
                <p className="mt-1 text-xs text-red-600">{errors.tipo.message}</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="periodo_inicio">Periodo inicio</Label>
              <Input
                id="periodo_inicio"
                type="date"
                {...register("periodo_inicio")}
              />
              {errors.periodo_inicio ? (
                <p className="mt-1 text-xs text-red-600">
                  {errors.periodo_inicio.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="periodo_fin">Periodo fin</Label>
              <Input id="periodo_fin" type="date" {...register("periodo_fin")} />
              {errors.periodo_fin ? (
                <p className="mt-1 text-xs text-red-600">
                  {errors.periodo_fin.message}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Detalle de conceptos</CardTitle>
              <CardDescription>
                Selecciona conceptos del catálogo y captura las cantidades.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={cargandoCatalogos || catalogos.length === 0}
              onClick={() => append({ id_concepto: "", cantidad: 0 })}
            >
              <Plus className="h-4 w-4" />
              Agregar concepto
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {cargandoCatalogos ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Cargando catálogo de conceptos...
              </div>
            ) : null}

            {errorCatalogos ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{errorCatalogos}</span>
              </div>
            ) : null}

            {!cargandoCatalogos && !errorCatalogos && catalogos.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Esta obra aún no tiene conceptos en el catálogo. Registra
                conceptos antes de crear una estimación.
              </div>
            ) : null}

            {fields.map((field, index) => {
              const idSeleccionado = conceptosSeleccionados?.[index]?.id_concepto ?? "";
              const concepto = catalogoPorId.get(idSeleccionado);
              const cantidadCapturada = Number(
                conceptosSeleccionados?.[index]?.cantidad ?? 0,
              );
              const excedeMaximo =
                Boolean(concepto) &&
                Number.isFinite(cantidadCapturada) &&
                cantidadCapturada > (concepto?.cantidad ?? 0);
              const importeLocal =
                concepto && Number.isFinite(cantidadCapturada) && cantidadCapturada > 0
                  ? cantidadCapturada * concepto.precio_unitario
                  : 0;

              return (
                <div
                  key={field.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-5">
                      <Label htmlFor={`concepto-${index}`}>Concepto</Label>
                      <select
                        id={`concepto-${index}`}
                        {...register(`conceptos.${index}.id_concepto`)}
                        className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400/40"
                      >
                        <option value="">Selecciona un concepto</option>
                        {catalogos.map((item) => (
                          <option key={item.id_concepto} value={item.id_concepto}>
                            {item.clave} — {item.descripcion}
                          </option>
                        ))}
                      </select>
                      {errors.conceptos?.[index]?.id_concepto ? (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.conceptos[index]?.id_concepto?.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="md:col-span-3">
                      <Label htmlFor={`cantidad-${index}`}>Cantidad</Label>
                      <Input
                        id={`cantidad-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        aria-invalid={excedeMaximo}
                        {...register(`conceptos.${index}.cantidad`, {
                          valueAsNumber: true,
                        })}
                      />
                      {concepto ? (
                        <p className="mt-1 text-xs text-slate-500">
                          Cantidad máxima permitida:{" "}
                          <span className="font-medium text-slate-700">
                            {concepto.cantidad}
                          </span>{" "}
                          {concepto.unidad_medida}
                        </p>
                      ) : null}
                      {excedeMaximo ? (
                        <p className="mt-1 text-xs text-red-600">
                          La cantidad excede el máximo del catálogo.
                        </p>
                      ) : null}
                      {errors.conceptos?.[index]?.cantidad ? (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.conceptos[index]?.cantidad?.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="md:col-span-3">
                      <Label>Importe local (solo lectura)</Label>
                      <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-medium text-slate-700">
                        {formatearMoneda(importeLocal)}
                      </div>
                      {concepto ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {formatearMoneda(concepto.precio_unitario)} /{" "}
                          {concepto.unidad_medida}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-end justify-end md:col-span-1">
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
                    </div>
                  </div>
                </div>
              );
            })}

            {errors.conceptos?.message ? (
              <p className="text-xs text-red-600">{errors.conceptos.message}</p>
            ) : null}

            <div className="flex items-center justify-end border-t border-slate-100 pt-4">
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Subtotal local
                </p>
                <p className="text-xl font-semibold tracking-tight text-slate-900">
                  {formatearMoneda(totalLocal)}
                </p>
                <p className="text-xs text-slate-500">
                  Cálculo visual. El importe oficial lo determina el backend.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {errorServidor ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorServidor}</span>
          </div>
        ) : null}

        {conErrorDeCantidad ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Hay cantidades que exceden el máximo permitido. Corrígelas para
              evitar un rechazo del servidor.
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/estimaciones">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Crear estimación
          </Button>
        </div>
      </form>
    </div>
  );
}
