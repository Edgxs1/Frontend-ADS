"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2, Pencil } from "lucide-react";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { useObra } from "@/providers/obra-provider";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
import { EstimacionFormulario } from "@/components/estimaciones/EstimacionFormulario";
import { Button } from "@/components/ui/button";
import { getCaratulaOficial } from "@/services/estimacion";
import type { EstimacionDetalle } from "@/types/estimacion";

interface DatosEdicion {
  idObra: string;
  estimacion: EstimacionDetalle;
}

export function EditarEstimacionPageClient() {
  const router = useRouter();
  const params = useParams<{ id_estimacion: string }>();
  const { rol, loading, loadingPerfil } = useSupabaseSession();
  const { obraActiva } = useObra();
  const idEstimacion = params?.id_estimacion ?? "";
  const idObra = obraActiva?.id_obra ?? null;

  const [datos, setDatos] = useState<DatosEdicion | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idObra || !idEstimacion) return;

    let activo = true;
    const obraSolicitada = idObra;

    getCaratulaOficial(obraSolicitada, idEstimacion)
      .then((caratula) => {
        if (!activo) return;

        setDatos({
          idObra: obraSolicitada,
          estimacion: {
            ...caratula.estimacion,
            conceptos: caratula.conceptos,
          },
        });
      })
      .catch((err: unknown) => {
        if (activo) {
          setError(
            err instanceof Error ? err.message : "Ocurrió un error inesperado.",
          );
        }
      });

    return () => {
      activo = false;
    };
  }, [idObra, idEstimacion]);

  const datosValidos = useMemo(
    () => (datos && idObra && datos.idObra === idObra ? datos : null),
    [datos, idObra],
  );

  const esSuperintendente = rol === "Superintendente";
  const cargando =
    Boolean(idObra && idEstimacion) &&
    datosValidos === null &&
    error === null &&
    !loading &&
    !loadingPerfil;

  if (loading || loadingPerfil) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Loader2
          className="h-8 w-8 animate-spin text-slate-400"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!esSuperintendente) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            Solo el Superintendente puede editar estimaciones.
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

  const estimacion = datosValidos?.estimacion;
  const editable =
    estimacion?.estado === "Creada" || estimacion?.estado === "Rechazada";

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
            <Pencil className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Editar Estimación {estimacion?.folio ?? ""}
            </h1>
            <p className="text-sm text-slate-500">{obraActiva.nombre}</p>
          </div>
        </div>
      </header>

      {cargando ? (
        <div className="flex min-h-[40dvh] items-center justify-center">
          <Loader2
            className="h-7 w-7 animate-spin text-slate-400"
            aria-hidden="true"
          />
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <span>{error}</span>
        </div>
      ) : null}

      {estimacion && !editable ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <span>
            Esta estimación está en estado &quot;{estimacion.estado}&quot;. Solo
            se pueden editar estimaciones en estado Creada o Rechazada.
          </span>
        </div>
      ) : null}

      {estimacion && editable ? (
        <EstimacionFormulario
          key={estimacion.id_estimacion}
          idObra={obraActiva.id_obra}
          estimacion={estimacion}
          onSuccess={(actualizada) => {
            router.push(
              `/dashboard/estimaciones/${actualizada.id_estimacion}`,
            );
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
