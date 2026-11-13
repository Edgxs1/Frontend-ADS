"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  ChevronRight,
  ClipboardList,
  FileSignature,
  Inbox,
  Loader2,
} from "lucide-react";
import { getPendientes } from "@/services/pendientes";
import { formatearFecha } from "@/lib/format";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TareaPendiente, TipoPendiente } from "@/types";

const ICONO_POR_TIPO = {
  estimacion: FileSignature,
  bitacora: BookOpen,
  reporte: ClipboardList,
} satisfies Record<TipoPendiente, typeof FileSignature>;

const ETIQUETA_POR_TIPO: Record<TipoPendiente, string> = {
  estimacion: "Estimaciones",
  bitacora: "Notas de bitácora",
  reporte: "Reportes diarios",
};

export function BandejaPendientes() {
  const { supabase, session } = useSupabaseSession();
  const [tareas, setTareas] = useState<TareaPendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const lista = await getPendientes();
      setTareas(lista);
      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo obtener la bandeja de pendientes.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;

    getPendientes()
      .then((lista) => {
        if (!activo) {
          return;
        }

        setTareas(lista);
        setError(null);
        setCargando(false);
      })
      .catch((err: unknown) => {
        if (!activo) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "No se pudo obtener la bandeja de pendientes.",
        );
        setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    const channel = supabase.channel("pendientes_channel");
    const tablas = [
      "estimaciones",
      "reportes_diarios",
      "bitacora_notas",
    ] as const;

    for (const table of tablas) {
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table },
        () => {
          void cargar();
        },
      );
      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table },
        () => {
          void cargar();
        },
      );
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, session, cargar]);

  const resumen = useMemo(() => {
    const conteo: Record<TipoPendiente, number> = {
      estimacion: 0,
      bitacora: 0,
      reporte: 0,
    };

    for (const tarea of tareas) {
      conteo[tarea.tipo] += 1;
    }

    return conteo;
  }, [tareas]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Bandeja de pendientes</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Acciones que requieren tu atención en este momento.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          <Inbox className="h-3.5 w-3.5" aria-hidden="true" />
          {tareas.length}
        </span>
      </CardHeader>

      <CardContent className="space-y-4">
        {cargando ? (
          <div className="flex items-center justify-center py-8">
            <Loader2
              className="h-6 w-6 animate-spin text-slate-400"
              aria-hidden="true"
            />
          </div>
        ) : null}

        {!cargando && error ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>{error}</span>
          </div>
        ) : null}

        {!cargando && !error && tareas.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-8 text-slate-400">
            <Inbox className="h-6 w-6" aria-hidden="true" />
            <span className="text-sm">No tienes pendientes por atender.</span>
          </div>
        ) : null}

        {!cargando && !error && tareas.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(resumen) as TipoPendiente[])
                .filter((tipo) => resumen[tipo] > 0)
                .map((tipo) => (
                  <span
                    key={tipo}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {resumen[tipo]} {ETIQUETA_POR_TIPO[tipo]}
                  </span>
                ))}
            </div>

            <ul className="divide-y divide-slate-100">
              {tareas.map((tarea) => {
                const Icono = ICONO_POR_TIPO[tarea.tipo];

                return (
                  <li key={`${tarea.tipo}-${tarea.id}`}>
                    <Link
                      href={tarea.ruta}
                      className="group flex items-start gap-3 py-3 transition-colors hover:bg-slate-50"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900/5 text-slate-700">
                        <Icono className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium text-slate-900">
                            {tarea.titulo}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                            {tarea.estado}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {tarea.descripcion}
                        </span>
                        <span className="mt-1 block text-xs text-slate-400">
                          {tarea.obra}
                          {tarea.fecha
                            ? ` · ${formatearFecha(tarea.fecha)}`
                            : ""}
                        </span>
                      </span>
                      <ChevronRight
                        className="mt-2 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-500"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
