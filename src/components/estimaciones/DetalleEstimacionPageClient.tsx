"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Download, Loader2, ShieldCheck } from "lucide-react";
import { useObra } from "@/providers/obra-provider";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
import { EstadoEstimacionBadge } from "@/components/estimaciones/estado-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatearFecha, formatearMoneda } from "@/lib/format";
import { getCaratulaOficial } from "@/services/estimacion";
import { getCatalogosPorObra } from "@/services/catalogo";
import type { CaratulaOficial } from "@/types/estimacion";

const BotonDescargarCaratula = dynamic(
  () =>
    import("@/components/estimaciones/BotonDescargarCaratula").then(
      (modulo) => modulo.BotonDescargarCaratula,
    ),
  {
    ssr: false,
    loading: () => (
      <Button type="button" disabled>
        <Download aria-hidden="true" />
        Preparando PDF…
      </Button>
    ),
  },
);

interface DatosCargados {
  idObra: string;
  caratula: CaratulaOficial;
}

export function DetalleEstimacionPageClient() {
  const params = useParams<{ id_estimacion: string }>();
  const { obraActiva } = useObra();
  const idEstimacion = params?.id_estimacion ?? "";

  const [datos, setDatos] = useState<DatosCargados | null>(null);
  const [error, setError] = useState<string | null>(null);

  const idObra = obraActiva?.id_obra ?? null;

  useEffect(() => {
    if (!idObra || !idEstimacion) return;

    let activo = true;
    const idSolicitada = idObra;

    getCaratulaOficial(idSolicitada, idEstimacion)
      .then(async (caratula) => {
        const catalogos = await getCatalogosPorObra(idSolicitada).catch(
          () => [],
        );
        const catalogoPorId = new Map(
          catalogos.map((concepto) => [concepto.id_concepto, concepto]),
        );

        const conceptos = caratula.conceptos.map((concepto) => {
          const catalogo = catalogoPorId.get(concepto.id_concepto);
          return {
            ...concepto,
            clave: catalogo?.clave ?? null,
            descripcion: catalogo?.descripcion ?? null,
            unidad_medida: catalogo?.unidad_medida ?? null,
          };
        });

        if (activo) {
          setDatos({
            idObra: idSolicitada,
            caratula: { ...caratula, conceptos },
          });
        }
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

  const cargando = Boolean(idObra && idEstimacion) && datosValidos === null && !error;

  if (!obraActiva) {
    return <SinObraSeleccionada />;
  }

  if (!idEstimacion) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
        Estimación no válida.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/estimaciones"
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a estimaciones
      </Link>

      {cargando ? (
        <div className="flex min-h-[40dvh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-slate-400" aria-hidden="true" />
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {datosValidos ? (
        <ContenidoDetalle
          caratula={datosValidos.caratula}
          nombreObra={obraActiva.nombre}
        />
      ) : null}
    </div>
  );
}

function ContenidoDetalle({
  caratula,
  nombreObra,
}: {
  caratula: CaratulaOficial;
  nombreObra: string;
}) {
  const { estimacion, conceptos, caratula: financiero } = caratula;
  const tieneFirmas = Boolean(
    estimacion.firma_superintendente &&
      estimacion.firma_supervisor &&
      estimacion.firma_residente,
  );

  return (
    <>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Estimación {estimacion.folio}
            </h1>
            <EstadoEstimacionBadge estado={estimacion.estado} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {estimacion.tipo} · {formatearFecha(estimacion.periodo_inicio)} —{" "}
            {formatearFecha(estimacion.periodo_fin)}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {tieneFirmas ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Firmada criptográficamente
            </div>
          ) : null}
          {estimacion.estado === "Autorizada" && tieneFirmas ? (
            <BotonDescargarCaratula
              caratula={caratula}
              nombreObra={nombreObra}
            />
          ) : null}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Conceptos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clave</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">P. Unitario</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conceptos.map((concepto, index) => (
                  <TableRow key={concepto.id_detalle ?? `${concepto.id_concepto}-${index}`}>
                    <TableCell className="font-medium text-slate-900">
                      {concepto.clave ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate text-slate-600">
                      {concepto.descripcion ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {concepto.cantidad_de_esta_estimacion ?? "—"}
                      {concepto.unidad_medida ? ` ${concepto.unidad_medida}` : ""}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {formatearMoneda(concepto.precio_unitario_snapshot)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-900">
                      {formatearMoneda(concepto.importe)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen financiero</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Fila etiqueta="Subtotal" valor={financiero.subtotal} />
            <Fila etiqueta="IVA (16%)" valor={financiero.iva} />
            <Fila
              etiqueta="Retención inspección (0.5%)"
              valor={financiero.retencion_inspeccion}
            />
            <Fila
              etiqueta="Amortización anticipo"
              valor={financiero.amortizacion_anticipo}
            />
            <Fila
              etiqueta="Retención atraso"
              valor={financiero.retencion_atraso_programa}
            />
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="font-medium text-slate-900">Neto a recibir</span>
              <span className="text-lg font-semibold text-slate-900">
                {formatearMoneda(financiero.neto_a_recibir)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {tieneFirmas ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Firmas digitales</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-xs">
            <Firma etiqueta="Superintendente" hash={estimacion.firma_superintendente} />
            <Firma etiqueta="Supervisor" hash={estimacion.firma_supervisor} />
            <Firma etiqueta="Residente" hash={estimacion.firma_residente} />
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{etiqueta}</span>
      <span className="font-medium text-slate-900">{formatearMoneda(valor)}</span>
    </div>
  );
}

function Firma({ etiqueta, hash }: { etiqueta: string; hash: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium text-slate-700">{etiqueta}</span>
      <code className="break-all rounded bg-slate-50 px-2 py-1 text-[11px] text-slate-500">
        {hash}
      </code>
    </div>
  );
}
