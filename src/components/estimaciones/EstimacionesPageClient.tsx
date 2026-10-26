"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calculator,
  Check,
  Eye,
  Loader2,
  Plus,
  Send,
  X,
} from "lucide-react";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { useObra } from "@/providers/obra-provider";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
import { EstadoEstimacionBadge } from "@/components/estimaciones/estado-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatearFecha } from "@/lib/format";
import {
  autorizarEstimacion,
  enviarAResidente,
  enviarRevision,
  getEstimaciones,
  rechazarEstimacion,
} from "@/services/estimacion";
import type { Estimacion } from "@/types/estimacion";

interface DatosCargados {
  idObra: string;
  estimaciones: Estimacion[];
}

type Accion = "enviar" | "enviar_residente" | "autorizar" | "rechazar";

export function EstimacionesPageClient() {
  const { rol } = useSupabaseSession();
  const { obraActiva } = useObra();
  const [datos, setDatos] = useState<DatosCargados | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accionError, setAccionError] = useState<string | null>(null);
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);

  const idObra = obraActiva?.id_obra ?? null;

  useEffect(() => {
    if (!idObra) {
      return;
    }

    let activo = true;
    const idSolicitada = idObra;

    getEstimaciones(idSolicitada)
      .then((estimaciones) => {
        if (activo) setDatos({ idObra: idSolicitada, estimaciones });
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
  }, [idObra]);

  const datosValidos = useMemo(
    () => (datos && idObra && datos.idObra === idObra ? datos : null),
    [datos, idObra],
  );

  const estimaciones = useMemo(
    () => datosValidos?.estimaciones ?? [],
    [datosValidos],
  );

  const cargando = idObra !== null && datosValidos === null && error === null;

  const puedeCrear = rol === "Superintendente";
  const puedeEnviarSupervisor = rol === "Superintendente";
  const puedeEnviarResidente = rol === "Supervisor";
  const puedeRevisar = rol === "Residente";

  const ejecutarAccion = async (
    estimacion: Estimacion,
    accion: Accion,
  ) => {
    if (!idObra) return;

    setAccionError(null);
    setAccionEnCurso(`${estimacion.id_estimacion}:${accion}`);

    try {
      const actualizada =
        accion === "enviar"
          ? await enviarRevision(idObra, estimacion.id_estimacion)
          : accion === "enviar_residente"
            ? await enviarAResidente(idObra, estimacion.id_estimacion)
            : accion === "autorizar"
              ? await autorizarEstimacion(idObra, estimacion.id_estimacion)
              : await rechazarEstimacion(idObra, estimacion.id_estimacion);

      setDatos((prev) =>
        prev
          ? {
              ...prev,
              estimaciones: prev.estimaciones.map((item) =>
                item.id_estimacion === actualizada.id_estimacion
                  ? { ...item, ...actualizada }
                  : item,
              ),
            }
          : prev,
      );
    } catch (err) {
      setAccionError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado.",
      );
    } finally {
      setAccionEnCurso(null);
    }
  };

  if (!obraActiva) {
    return <SinObraSeleccionada />;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
            <Calculator className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Estimaciones
            </h1>
            <p className="text-sm text-slate-500">{obraActiva.nombre}</p>
          </div>
        </div>

        {puedeCrear ? (
          <Button asChild className="gap-2">
            <Link href="/dashboard/estimaciones/nueva">
              <Plus className="h-4 w-4" />
              Nueva Estimación
            </Link>
          </Button>
        ) : null}
      </header>

      {accionError ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{accionError}</span>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b border-slate-100 px-6 py-4">
          <CardTitle className="text-base">Listado de estimaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {cargando ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden="true" />
            </div>
          ) : estimaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <Calculator className="h-8 w-8 text-slate-300" aria-hidden="true" />
              <p className="text-sm font-medium text-slate-700">
                Aún no hay estimaciones
              </p>
              <p className="max-w-sm text-sm text-slate-500">
                {puedeCrear
                  ? "Crea la primera estimación para esta obra."
                  : "Cuando el Superintendente registre una estimación aparecerá aquí."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimaciones.map((estimacion) => {
                  const id = estimacion.id_estimacion;
                  const ocupada = accionEnCurso?.startsWith(`${id}:`) ?? false;

                  return (
                    <TableRow key={id}>
                      <TableCell className="font-medium text-slate-900">
                        {estimacion.folio}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-600">
                        {formatearFecha(estimacion.periodo_inicio)} —{" "}
                        {formatearFecha(estimacion.periodo_fin)}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {estimacion.tipo}
                      </TableCell>
                      <TableCell>
                        <EstadoEstimacionBadge estado={estimacion.estado} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button asChild variant="outline" size="sm" className="gap-1.5">
                            <Link href={`/dashboard/estimaciones/${id}`}>
                              <Eye className="h-3.5 w-3.5" />
                              Ver Detalle
                            </Link>
                          </Button>

                          {puedeEnviarSupervisor &&
                          estimacion.estado === "Borrador" ? (
                            <Button
                              size="sm"
                              className="gap-1.5"
                              disabled={ocupada}
                              onClick={() => ejecutarAccion(estimacion, "enviar")}
                            >
                              {accionEnCurso === `${id}:enviar` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5" />
                              )}
                              Enviar a Supervisor
                            </Button>
                          ) : null}

                          {puedeEnviarResidente &&
                          estimacion.estado === "Revision Supervisor" ? (
                            <Button
                              size="sm"
                              className="gap-1.5"
                              disabled={ocupada}
                              onClick={() =>
                                ejecutarAccion(estimacion, "enviar_residente")
                              }
                            >
                              {accionEnCurso === `${id}:enviar_residente` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5" />
                              )}
                              Enviar a Residente
                            </Button>
                          ) : null}

                          {puedeRevisar &&
                          estimacion.estado === "Revision Residente" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                disabled={ocupada}
                                onClick={() => ejecutarAccion(estimacion, "autorizar")}
                              >
                                {accionEnCurso === `${id}:autorizar` ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                Autorizar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                disabled={ocupada}
                                onClick={() => ejecutarAccion(estimacion, "rechazar")}
                              >
                                {accionEnCurso === `${id}:rechazar` ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <X className="h-3.5 w-3.5" />
                                )}
                                Rechazar
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
