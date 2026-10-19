"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, FolderOpen, Loader2 } from "lucide-react";
import { getArchivosPorObra } from "@/services/archivo";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { useObra } from "@/providers/obra-provider";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
import { ExpedienteSubida } from "./ExpedienteSubida";
import { ExpedienteTabla } from "./ExpedienteTabla";
import type { ArchivoRepositorio } from "@/types";

interface DatosCargados {
  idObra: string;
  archivos: ArchivoRepositorio[];
  error: string | null;
}

export function DatosExpediente() {
  const { obraActiva } = useObra();
  const { rol } = useSupabaseSession();
  const [datos, setDatos] = useState<DatosCargados | null>(null);

  const idObra = obraActiva?.id_obra ?? null;

  useEffect(() => {
    if (!idObra) {
      return;
    }

    const idSolicitada = idObra;
    let activo = true;

    getArchivosPorObra(idSolicitada)
      .then((archivos) => {
        if (activo) {
          setDatos({ idObra: idSolicitada, archivos, error: null });
        }
      })
      .catch((err: unknown) => {
        if (activo) {
          setDatos({
            idObra: idSolicitada,
            archivos: [],
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
  const archivos = useMemo(() => datosValidos?.archivos ?? [], [datosValidos]);
  const error = datosValidos?.error ?? null;
  const puedeEliminar = rol === "Administrador";

  if (!obraActiva) {
    return <SinObraSeleccionada />;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
          <FolderOpen className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Expediente de obra
          </h1>
          <p className="text-sm text-slate-500">{obraActiva.nombre}</p>
        </div>
      </header>

      <ExpedienteSubida
        idObra={obraActiva.id_obra}
        onSubido={(nuevo) => {
          setDatos((prev) => {
            const base =
              prev && prev.idObra === nuevo.id_obra ? prev.archivos : [];
            return {
              idObra: nuevo.id_obra,
              archivos: [nuevo, ...base],
              error: null,
            };
          });
        }}
      />

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
        <ExpedienteTabla
          idObra={obraActiva.id_obra}
          archivos={archivos}
          puedeEliminar={puedeEliminar}
          onEliminado={(idArchivo) => {
            setDatos((prev) => {
              if (!prev || prev.idObra !== obraActiva.id_obra) return prev;

              return {
                ...prev,
                archivos: prev.archivos.filter(
                  (archivo) => archivo.id_archivo !== idArchivo,
                ),
              };
            });
          }}
        />
      ) : null}
    </div>
  );
}
