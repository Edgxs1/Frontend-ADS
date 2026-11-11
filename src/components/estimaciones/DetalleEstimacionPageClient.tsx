"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Download,
  Loader2,
  Pencil,
  Printer,
  Send,
  ShieldCheck,
  Undo2,
  X,
} from "lucide-react";
import { useObra } from "@/providers/obra-provider";
import { useSupabaseSession } from "@/providers/supabase-provider";
import type { Rol } from "@/providers/supabase-provider";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
import { EstadoEstimacionBadge } from "@/components/estimaciones/estado-badge";
import { CaratulaEstimacion } from "@/components/estimaciones/CaratulaEstimacion";
import { Button } from "@/components/ui/button";
import { formatearFecha } from "@/lib/format";
import { cambiarEstadoEstimacion, getCaratulaOficial } from "@/services/estimacion";
import { getCatalogosPorObra } from "@/services/catalogo";
import { getContrato } from "@/services/contrato";
import { obtenerPartidas } from "@/services/partida";
import type { ContratoConContratista } from "@/types";
import type {
  CaratulaOficial,
  EstadoEstimacion,
  Estimacion,
  EstimacionConcepto,
  ResumenPartida,
} from "@/types/estimacion";

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
  contrato: ContratoConContratista | null;
  resumenPartidas: ResumenPartida[];
}

function agruparPorPartida(conceptos: EstimacionConcepto[]): ResumenPartida[] {
  const agrupadas = new Map<string, ResumenPartida>();

  for (const concepto of conceptos) {
    const id = concepto.id_partida ?? "sin-partida";
    const actual = agrupadas.get(id) ?? {
      id_partida: concepto.id_partida ?? null,
      clave: concepto.partida_clave ?? "Sin partida",
      descripcion:
        concepto.partida_descripcion ?? "Conceptos sin partida asignada",
      conceptos: 0,
      importe: 0,
    };

    actual.conceptos += 1;
    actual.importe += Number(concepto.importe ?? 0);
    agrupadas.set(id, actual);
  }

  return [...agrupadas.values()].sort((a, b) =>
    a.clave.localeCompare(b.clave, "es"),
  );
}

export function DetalleEstimacionPageClient() {
  const params = useParams<{ id_estimacion: string }>();
  const { obraActiva } = useObra();
  const { rol, usuario, session, supabase } = useSupabaseSession();
  const idEstimacion = params?.id_estimacion ?? "";

  const [datos, setDatos] = useState<DatosCargados | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accionError, setAccionError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [accionEnCurso, setAccionEnCurso] = useState<EstadoEstimacion | null>(
    null,
  );
  const [mostrarFirma, setMostrarFirma] = useState(false);
  const [passwordFirma, setPasswordFirma] = useState("");
  const [errorFirma, setErrorFirma] = useState<string | null>(null);

  const idObra = obraActiva?.id_obra ?? null;

  useEffect(() => {
    if (!idObra || !idEstimacion) return;

    let activo = true;
    const idSolicitada = idObra;

    getCaratulaOficial(idSolicitada, idEstimacion)
      .then(async (caratula) => {
        const [catalogos, partidas, contrato] = await Promise.all([
          getCatalogosPorObra(idSolicitada).catch(() => []),
          obtenerPartidas(idSolicitada).catch(() => []),
          getContrato(idSolicitada).catch(() => null),
        ]);
        const catalogoPorId = new Map(
          catalogos.map((concepto) => [concepto.id_concepto, concepto]),
        );
        const partidaPorId = new Map(
          partidas.map((partida) => [partida.id_partida, partida]),
        );

        const conceptos = caratula.conceptos.map((concepto) => {
          const catalogo = catalogoPorId.get(concepto.id_concepto);
          const partida = catalogo
            ? partidaPorId.get(catalogo.id_partida)
            : undefined;

          return {
            ...concepto,
            clave: concepto.clave ?? catalogo?.clave ?? null,
            descripcion: concepto.descripcion ?? catalogo?.descripcion ?? null,
            unidad_medida:
              concepto.unidad_medida ?? catalogo?.unidad_medida ?? null,
            id_partida: catalogo?.id_partida ?? null,
            partida_clave: partida?.clave ?? catalogo?.partida_clave ?? null,
            partida_descripcion: partida?.descripcion ?? null,
          };
        });

        if (activo) {
          setDatos({
            idObra: idSolicitada,
            caratula: { ...caratula, conceptos },
            contrato,
            resumenPartidas: agruparPorPartida(conceptos),
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

  const actualizarEstimacion = useCallback((actualizada: Estimacion) => {
    setDatos((prev) =>
      prev
        ? {
            ...prev,
            caratula: { ...prev.caratula, estimacion: actualizada },
          }
        : prev,
    );
  }, []);

  const cambiarEstado = useCallback(
    async (estado: EstadoEstimacion) => {
      setAccionError(null);
      setMensajeExito(null);
      setAccionEnCurso(estado);

      try {
        const actualizada = await cambiarEstadoEstimacion(
          idEstimacion,
          estado,
        );
        actualizarEstimacion(actualizada);
        setMensajeExito(`La estimación cambió a "${estado}" correctamente.`);
      } catch (err) {
        setAccionError(
          err instanceof Error ? err.message : "Ocurrió un error inesperado.",
        );
      } finally {
        setAccionEnCurso(null);
      }
    },
    [idEstimacion, actualizarEstimacion],
  );

  const confirmarAutorizacion = useCallback(async () => {
    if (!passwordFirma) {
      setErrorFirma("Ingresa tu contraseña para firmar.");
      return;
    }

    setErrorFirma(null);
    setAccionError(null);
    setMensajeExito(null);
    setAccionEnCurso("Aprobada");

    try {
      const email = usuario?.correo ?? session?.user?.email;

      if (!email) {
        throw new Error("No se pudo identificar el correo del usuario.");
      }

      const { error: errorAuth } = await supabase.auth.signInWithPassword({
        email,
        password: passwordFirma,
      });

      if (errorAuth) {
        throw new Error("Contraseña incorrecta. Intenta de nuevo.");
      }

      const actualizada = await cambiarEstadoEstimacion(
        idEstimacion,
        "Aprobada",
        passwordFirma,
      );

      actualizarEstimacion(actualizada);
      setMensajeExito(
        "Estimación autorizada y firmada criptográficamente correctamente.",
      );
      setMostrarFirma(false);
      setPasswordFirma("");
    } catch (err) {
      setErrorFirma(
        err instanceof Error
          ? err.message
          : "No se pudo autorizar la estimación.",
      );
    } finally {
      setAccionEnCurso(null);
    }
  }, [
    passwordFirma,
    usuario,
    session,
    supabase,
    idEstimacion,
    actualizarEstimacion,
  ]);

  const devolver = useCallback(async () => {
    const confirmado = window.confirm(
      "¿Devolver esta estimación al Superintendente? Podrá corregirla y enviarla de nuevo.",
    );

    if (!confirmado) return;

    await cambiarEstado("Devuelta");
  }, [cambiarEstado]);

  const abrirFirma = useCallback(() => {
    setErrorFirma(null);
    setPasswordFirma("");
    setMostrarFirma(true);
  }, []);

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
    <div className="flex flex-col gap-6 print:gap-0">
      <Link
        href="/dashboard/estimaciones"
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 print:hidden"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a estimaciones
      </Link>

      {accionError ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 print:hidden">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{accionError}</span>
        </div>
      ) : null}

      {mensajeExito ? (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 print:hidden">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{mensajeExito}</span>
        </div>
      ) : null}

      {cargando ? (
        <div className="flex min-h-[40dvh] items-center justify-center print:hidden">
          <Loader2 className="h-7 w-7 animate-spin text-slate-400" aria-hidden="true" />
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 print:hidden">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {datosValidos ? (
        <ContenidoDetalle
          caratula={datosValidos.caratula}
          nombreObra={obraActiva.nombre}
          contrato={datosValidos.contrato}
          resumenPartidas={datosValidos.resumenPartidas}
          rol={rol}
          accionEnCurso={accionEnCurso}
          onCambiarEstado={cambiarEstado}
          onAbrirFirma={abrirFirma}
          onDevolver={devolver}
        />
      ) : null}

      {mostrarFirma ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 print:hidden">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Autorizar y firmar estimación"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Autorizar y firmar
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Al firmar esta estimación aceptas la responsabilidad legal del
                  documento. Se generarán las tres firmas criptográficas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMostrarFirma(false);
                  setPasswordFirma("");
                  setErrorFirma(null);
                }}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Contraseña
                </span>
                <input
                  type="password"
                  value={passwordFirma}
                  onChange={(event) => setPasswordFirma(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  autoFocus
                />
              </label>

              {errorFirma ? (
                <p className="text-sm text-red-600">{errorFirma}</p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMostrarFirma(false);
                    setPasswordFirma("");
                    setErrorFirma(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={confirmarAutorizacion}
                  disabled={accionEnCurso === "Aprobada"}
                  className="gap-2"
                >
                  {accionEnCurso === "Aprobada" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  )}
                  Firmar y autorizar
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface ContenidoDetalleProps {
  caratula: CaratulaOficial;
  nombreObra: string;
  contrato: ContratoConContratista | null;
  resumenPartidas: ResumenPartida[];
  rol: Rol | null;
  accionEnCurso: EstadoEstimacion | null;
  onCambiarEstado: (estado: EstadoEstimacion) => void;
  onAbrirFirma: () => void;
  onDevolver: () => void;
}

function ContenidoDetalle({
  caratula,
  nombreObra,
  contrato,
  resumenPartidas,
  rol,
  accionEnCurso,
  onCambiarEstado,
  onAbrirFirma,
  onDevolver,
}: ContenidoDetalleProps) {
  const { estimacion } = caratula;
  const tieneFirmas = Boolean(
    estimacion.firma_superintendente &&
      estimacion.firma_supervisor &&
      estimacion.firma_residente,
  );

  const esSuperintendente = rol === "Superintendente";
  const esSupervisor = rol === "Supervisor";
  const esResidente = rol === "Residente";
  const bloqueado = accionEnCurso !== null;

  const estimacionEditable =
    estimacion.estado === "Creada" || estimacion.estado === "Devuelta";
  const puedePresentar = esSuperintendente && estimacionEditable;
  const puedeEditar = esSuperintendente && estimacionEditable;
  const puedeCompletarRevision =
    esSupervisor && estimacion.estado === "Por revisar";
  const puedeDevolverSupervisor =
    esSupervisor && estimacion.estado === "Por revisar";
  const puedeAutorizar =
    esResidente && estimacion.estado === "Revisada";
  const puedeDevolverResidente =
    esResidente && estimacion.estado === "Revisada";

  return (
    <>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:hidden">
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

          <BotonDescargarCaratula
            caratula={caratula}
            nombreObra={nombreObra}
            contrato={contrato}
            resumenPartidas={resumenPartidas}
          />

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Imprimir carátula
          </Button>

          <div className="flex flex-wrap justify-end gap-2">
            {puedeEditar ? (
              <Button asChild variant="outline" className="gap-2">
                <Link href={`/dashboard/estimaciones/${estimacion.id_estimacion}/editar`}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Editar
                </Link>
              </Button>
            ) : null}

            {puedePresentar ? (
              <Button
                type="button"
                className="gap-2"
                disabled={bloqueado}
                onClick={() => onCambiarEstado("Por revisar")}
              >
                {accionEnCurso === "Por revisar" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                Presentar Estimación
              </Button>
            ) : null}

            {puedeCompletarRevision ? (
              <Button
                type="button"
                className="gap-2"
                disabled={bloqueado}
                onClick={() => onCambiarEstado("Revisada")}
              >
                {accionEnCurso === "Revisada" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
                Marcar como Revisada
              </Button>
            ) : null}

            {puedeAutorizar ? (
              <Button
                type="button"
                className="gap-2"
                disabled={bloqueado}
                onClick={onAbrirFirma}
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Autorizar y Firmar
              </Button>
            ) : null}

            {puedeDevolverSupervisor || puedeDevolverResidente ? (
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                disabled={bloqueado}
                onClick={onDevolver}
              >
                {accionEnCurso === "Devuelta" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Undo2 className="h-4 w-4" aria-hidden="true" />
                )}
                Devolver
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <CaratulaEstimacion
        caratula={caratula}
        nombreObra={nombreObra}
        contrato={contrato}
        resumenPartidas={resumenPartidas}
      />
    </>
  );
}
