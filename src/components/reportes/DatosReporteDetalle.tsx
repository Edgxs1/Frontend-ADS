"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Loader2,
  UserRound,
} from "lucide-react";
import { getFotos, getReportes } from "@/services/reporte";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { useObra } from "@/providers/obra-provider";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
import { formatearFecha } from "@/lib/format";
import { EstadoBadge } from "./EstadoBadge";
import { FotosUpload } from "./FotosUpload";
import { GaleriaFotos } from "./GaleriaFotos";
import type { FotoReporte, Reporte } from "@/types";

interface DatosCargados {
  idObra: string;
  idReporte: string;
  reporte: Reporte | null;
  fotos: FotoReporte[];
  error: string | null;
}

interface DatosReporteDetalleProps {
  idReporte: string;
}

export function DatosReporteDetalle({ idReporte }: DatosReporteDetalleProps) {
  const { obraActiva } = useObra();
  const { rol } = useSupabaseSession();
  const [datos, setDatos] = useState<DatosCargados | null>(null);

  const idObra = obraActiva?.id_obra ?? null;

  useEffect(() => {
    if (!idObra) {
      return;
    }

    const obraSolicitada = idObra;
    let activo = true;

    Promise.all([
      getReportes(obraSolicitada),
      getFotos(obraSolicitada, idReporte),
    ])
      .then(([reportes, fotos]) => {
        if (!activo) return;

        const reporte =
          reportes.find((item) => item.id_reporte === idReporte) ?? null;

        setDatos({
          idObra: obraSolicitada,
          idReporte,
          reporte,
          fotos,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (activo) {
          setDatos({
            idObra: obraSolicitada,
            idReporte,
            reporte: null,
            fotos: [],
            error:
              err instanceof Error ? err.message : "Ocurrió un error inesperado.",
          });
        }
      });

    return () => {
      activo = false;
    };
  }, [idObra, idReporte]);

  const datosValidos = useMemo(
    () =>
      datos && idObra && datos.idObra === idObra && datos.idReporte === idReporte
        ? datos
        : null,
    [datos, idObra, idReporte],
  );

  const cargando = idObra !== null && datosValidos === null;
  const reporte = datosValidos?.reporte ?? null;
  const fotos = datosValidos?.fotos ?? [];
  const error = datosValidos?.error ?? null;

  const esSupervisor = rol === "Supervisor";
  const reporteValidado = reporte?.estado === "Validado";

  if (!obraActiva) {
    return <SinObraSeleccionada />;
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden="true" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{error}</span>
      </div>
    );
  }

  if (!reporte) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        No se encontró el reporte solicitado en esta obra.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Detalle del reporte
          </h1>
          <EstadoBadge estado={reporte.estado} />
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-2 text-sm">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <div>
              <dt className="text-slate-500">Fecha</dt>
              <dd className="font-medium text-slate-800">
                {formatearFecha(reporte.created_at)}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <div>
              <dt className="text-slate-500">Creador</dt>
              <dd className="font-medium text-slate-800">
                {reporte.creador_correo ?? "—"}
              </dd>
            </div>
          </div>
        </dl>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Avance general</h2>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
              {reporte.avance_general}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Condicionantes</h2>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
              {reporte.condicionantes}
            </p>
          </div>
        </div>
      </section>

      {esSupervisor && !reporteValidado ? (
        <FotosUpload
          idObra={obraActiva.id_obra}
          idReporte={reporte.id_reporte}
          fotosActuales={fotos.length}
          onSubidas={(nuevas) => {
            setDatos((prev) => {
              if (!prev || prev.idReporte !== reporte.id_reporte) return prev;
              return { ...prev, fotos: [...prev.fotos, ...nuevas] };
            });
          }}
        />
      ) : null}

      <GaleriaFotos
        idObra={obraActiva.id_obra}
        idReporte={reporte.id_reporte}
        fotos={fotos}
        puedeEliminar={esSupervisor && !reporteValidado}
        onEliminada={(idFoto) => {
          setDatos((prev) => {
            if (!prev || prev.idReporte !== reporte.id_reporte) return prev;
            return {
              ...prev,
              fotos: prev.fotos.filter((foto) => foto.id_foto !== idFoto),
            };
          });
        }}
      />
    </div>
  );
}
