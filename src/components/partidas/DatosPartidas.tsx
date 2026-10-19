"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ClipboardList, Loader2 } from "lucide-react";
import { obtenerPartidas } from "@/services/partida";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { useObra } from "@/providers/obra-provider";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
import { PartidaFormulario } from "@/components/partidas/PartidaFormulario";
import { PartidasLista } from "@/components/partidas/PartidasLista";
import type { Partida } from "@/types";

interface DatosPartidasCargados {
  idObra: string;
  partidas: Partida[];
  error: string | null;
}

export function DatosPartidas() {
  const { obraActiva } = useObra();
  const { rol } = useSupabaseSession();
  const [datos, setDatos] = useState<DatosPartidasCargados | null>(null);

  const idObra = obraActiva?.id_obra ?? null;

  useEffect(() => {
    if (!idObra) {
      return;
    }

    const idSolicitada = idObra;
    let activo = true;

    obtenerPartidas(idSolicitada)
      .then((partidas) => {
        if (activo) {
          setDatos({ idObra: idSolicitada, partidas, error: null });
        }
      })
      .catch((err: unknown) => {
        if (activo) {
          setDatos({
            idObra: idSolicitada,
            partidas: [],
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
  const partidas = datosValidos?.partidas ?? [];
  const error = datosValidos?.error ?? null;
  const puedeCrear = rol === "Administrador" || rol === "Superintendente";

  if (!obraActiva) {
    return <SinObraSeleccionada />;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
          <ClipboardList className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Partidas
          </h1>
          <p className="text-sm text-slate-500">{obraActiva.nombre}</p>
        </div>
      </header>

      {puedeCrear ? (
        <PartidaFormulario
          idObra={obraActiva.id_obra}
          onCreada={(nueva) => {
            setDatos((prev) => {
              const base =
                prev && prev.idObra === nueva.id_obra ? prev.partidas : [];
              return {
                idObra: nueva.id_obra,
                partidas: [...base, nueva].sort((a, b) =>
                  a.clave.localeCompare(b.clave),
                ),
                error: null,
              };
            });
          }}
        />
      ) : null}

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

      {!cargando && !error ? <PartidasLista partidas={partidas} /> : null}
    </div>
  );
}
