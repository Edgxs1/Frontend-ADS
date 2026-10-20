"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ClipboardList, Loader2, Plus } from "lucide-react";
import { getReportes } from "@/services/reporte";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { useObra } from "@/providers/obra-provider";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
import { ReporteFormulario } from "./ReporteFormulario";
import { ReportesTabla } from "./ReportesTabla";
import type { Reporte } from "@/types";

interface DatosCargados {
  idObra: string;
  reportes: Reporte[];
  error: string | null;
}

export function DatosReportes() {
  const { obraActiva } = useObra();
  const { rol } = useSupabaseSession();
  const [datos, setDatos] = useState<DatosCargados | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const idObra = obraActiva?.id_obra ?? null;

  useEffect(() => {
    if (!idObra) {
      return;
    }

    const idSolicitada = idObra;
    let activo = true;

    getReportes(idSolicitada)
      .then((reportes) => {
        if (activo) {
          setDatos({ idObra: idSolicitada, reportes, error: null });
        }
      })
      .catch((err: unknown) => {
        if (activo) {
          setDatos({
            idObra: idSolicitada,
            reportes: [],
            error:
              err instanceof Error ? err.message : "Ocurrió un error inesperado.",
          });
        }
      });

    return () => {
      activo = false;
    };
  }, [idObra]);

  const datosValidos = useMemo(
    () => (datos && idObra && datos.idObra === idObra ? datos : null),
    [datos, idObra],
  );

  const cargando = idObra !== null && datosValidos === null;
  const reportes = useMemo(() => datosValidos?.reportes ?? [], [datosValidos]);
  const error = datosValidos?.error ?? null;
  const esSupervisor = rol === "Supervisor";

  if (!obraActiva) {
    return <SinObraSeleccionada />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
            <ClipboardList className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Reportes diarios
            </h1>
            <p className="text-sm text-slate-500">{obraActiva.nombre}</p>
          </div>
        </div>

        {esSupervisor ? (
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Crear reporte
          </button>
        ) : null}
      </header>

      {cargando ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden="true" />
        </div>
      ) : null}

      {!cargando && error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {!cargando && !error ? (
        <ReportesTabla
          idObra={obraActiva.id_obra}
          reportes={reportes}
          rol={rol}
          onActualizado={(actualizado) => {
            setDatos((prev) => {
              if (!prev || prev.idObra !== obraActiva.id_obra) return prev;

              return {
                ...prev,
                reportes: prev.reportes.map((reporte) =>
                  reporte.id_reporte === actualizado.id_reporte
                    ? actualizado
                    : reporte,
                ),
              };
            });
          }}
        />
      ) : null}

      {modalAbierto ? (
        <ReporteFormulario
          idObra={obraActiva.id_obra}
          onCerrar={() => setModalAbierto(false)}
          onCreado={(nuevo) => {
            setDatos((prev) => {
              const base =
                prev && prev.idObra === nuevo.id_obra ? prev.reportes : [];
              return {
                idObra: nuevo.id_obra,
                reportes: [nuevo, ...base],
                error: null,
              };
            });
          }}
        />
      ) : null}
    </div>
  );
}
