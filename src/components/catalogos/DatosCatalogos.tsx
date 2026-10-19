"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BookOpen, Loader2 } from "lucide-react";
import { getCatalogosPorObra } from "@/services/catalogo";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { useObra } from "@/providers/obra-provider";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
import { ConceptoFormulario } from "./ConceptoFormulario";
import { CatalogoTabla } from "./CatalogoTabla";
import { TIPOS_CONCEPTO } from "@/types";
import type { ConceptoConPartida, TipoConcepto } from "@/types";

interface DatosCargados {
  idObra: string;
  conceptos: ConceptoConPartida[];
  error: string | null;
}

export function DatosCatalogos() {
  const { obraActiva } = useObra();
  const { rol } = useSupabaseSession();
  const [datos, setDatos] = useState<DatosCargados | null>(null);
  const [tipoActivo, setTipoActivo] = useState<TipoConcepto>("Normal");

  const idObra = obraActiva?.id_obra ?? null;

  useEffect(() => {
    if (!idObra) {
      return;
    }

    const idSolicitada = idObra;
    let activo = true;

    getCatalogosPorObra(idSolicitada)
      .then((conceptos) => {
        if (activo) {
          setDatos({ idObra: idSolicitada, conceptos, error: null });
        }
      })
      .catch((err: unknown) => {
        if (activo) {
          setDatos({
            idObra: idSolicitada,
            conceptos: [],
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
  const conceptos = useMemo(() => datosValidos?.conceptos ?? [], [datosValidos]);
  const error = datosValidos?.error ?? null;
  const puedeCrear = rol === "Administrador" || rol === "Superintendente";

  const conteos = useMemo(
    () =>
      TIPOS_CONCEPTO.map((tipo) => ({
        tipo,
        total: conceptos.filter((concepto) => concepto.tipo === tipo).length,
      })),
    [conceptos],
  );

  const conceptosVisibles = useMemo(
    () => conceptos.filter((concepto) => concepto.tipo === tipoActivo),
    [conceptos, tipoActivo],
  );

  if (!obraActiva) {
    return <SinObraSeleccionada />;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Catálogos
          </h1>
          <p className="text-sm text-slate-500">{obraActiva.nombre}</p>
        </div>
      </header>

      {puedeCrear ? (
        <ConceptoFormulario
          idObra={obraActiva.id_obra}
          onCreada={(nuevo) => {
            setDatos((prev) => {
              const base =
                prev && prev.idObra === nuevo.id_obra ? prev.conceptos : [];

              return {
                idObra: nuevo.id_obra,
                conceptos: [...base, nuevo].sort((a, b) =>
                  a.clave.localeCompare(b.clave),
                ),
                error: null,
              };
            });

            setTipoActivo(nuevo.tipo);
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

      {!cargando && !error ? (
        <>
          <div
            role="tablist"
            aria-label="Tipos de concepto"
            className="flex flex-wrap gap-2"
          >
            {conteos.map(({ tipo, total }) => {
              const activa = tipoActivo === tipo;

              return (
                <button
                  key={tipo}
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  onClick={() => setTipoActivo(tipo)}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
                    activa
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {tipo}
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs",
                      activa ? "bg-white/15 text-white" : "bg-slate-900/5 text-slate-500",
                    ].join(" ")}
                  >
                    {total}
                  </span>
                </button>
              );
            })}
          </div>

          <CatalogoTabla
            titulo={`Conceptos — ${tipoActivo}`}
            conceptos={conceptosVisibles}
          />
        </>
      ) : null}
    </div>
  );
}
