"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Building2, Loader2 } from "lucide-react";
import { getObras } from "@/services/obra";
import { ObraFormulario } from "./ObraFormulario";
import { ObrasTabla } from "./ObrasTabla";
import { AsignacionesObra } from "./AsignacionesObra";
import type { Obra } from "@/types";

export function DatosObras() {
  const [obras, setObras] = useState<Obra[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState<Obra | null>(null);

  useEffect(() => {
    let activo = true;

    getObras()
      .then((data) => {
        if (activo) {
          setObras(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (activo) {
          setObras([]);
          setError(
            err instanceof Error ? err.message : "Ocurrió un error inesperado.",
          );
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  const cargando = obras === null;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
          <Building2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Obras
          </h1>
          <p className="text-sm text-slate-500">
            Registra obras y administra las asignaciones de su equipo.
          </p>
        </div>
      </header>

      <ObraFormulario
        onCreada={(obra) => {
          setObras((prev) =>
            [...(prev ?? []), obra].sort((a, b) =>
              a.nombre.localeCompare(b.nombre),
            ),
          );
        }}
      />

      {cargando ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Loader2
            className="h-6 w-6 animate-spin text-slate-400"
            aria-hidden="true"
          />
        </div>
      ) : null}

      {!cargando && error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {!cargando && !error ? (
        <ObrasTabla
          obras={obras ?? []}
          obraSeleccionada={seleccionada?.id_obra ?? null}
          onSeleccionar={(obra) =>
            setSeleccionada((prev) =>
              prev?.id_obra === obra.id_obra ? null : obra,
            )
          }
        />
      ) : null}

      {!cargando && !error && seleccionada ? (
        <AsignacionesObra key={seleccionada.id_obra} obra={seleccionada} />
      ) : null}
    </div>
  );
}
