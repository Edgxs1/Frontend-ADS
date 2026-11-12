"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Images,
  Loader2,
  Lock,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useObra } from "@/providers/obra-provider";
import { useSupabaseSession } from "@/providers/supabase-provider";
import {
  generarCompendio,
  getCompendios,
  getFotosReportesPeriodo,
} from "@/services/compendio";
import { formatearFecha, formatearFechaHora } from "@/lib/format";
import type { CompendioMensual, FotoCompendio } from "@/types";

const MAX_FOTOS = 12;

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const FECHA_ACTUAL = new Date();
const MES_ACTUAL = FECHA_ACTUAL.getMonth() + 1;
const ANIO_ACTUAL = FECHA_ACTUAL.getFullYear();
const ANIOS = Array.from({ length: 8 }, (_, indice) => ANIO_ACTUAL - indice);

function nombreMes(mes: number): string {
  return MESES[mes - 1] ?? String(mes);
}

export function CompendiosMensualesPageClient() {
  const params = useParams<{ id: string | string[] }>();
  const idObraParam = params?.id;
  const idObra = Array.isArray(idObraParam) ? idObraParam[0] : idObraParam;
  const { obraActiva } = useObra();
  const { rol } = useSupabaseSession();

  const [mes, setMes] = useState(MES_ACTUAL);
  const [anio, setAnio] = useState(ANIO_ACTUAL);
  const [fotos, setFotos] = useState<FotoCompendio[]>([]);
  const [consultado, setConsultado] = useState(false);
  const [compendios, setCompendios] = useState<CompendioMensual[]>([]);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [compendioExpandido, setCompendioExpandido] = useState<string | null>(null);
  const [cargandoFotos, setCargandoFotos] = useState(false);
  const [cargandoCompendios, setCargandoCompendios] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const puedeGenerar = rol === "Supervisor";
  const nombreObra =
    obraActiva && obraActiva.id_obra === idObra
      ? obraActiva.nombre
      : "Obra seleccionada";
  const compendioDelPeriodo =
    compendios.find((item) => item.mes === mes && item.anio === anio) ?? null;

  const cargarFotos = useCallback(
    async (mesSeleccionado: number, anioSeleccionado: number) => {
      if (!idObra) {
        return;
      }

      setCargandoFotos(true);
      setError(null);

      try {
        const [fotosData, compendiosData] = await Promise.all([
          getFotosReportesPeriodo(idObra, mesSeleccionado, anioSeleccionado),
          getCompendios(idObra),
        ]);

        const guardado = compendiosData.find(
          (item) => item.mes === mesSeleccionado && item.anio === anioSeleccionado,
        );
        const idsDisponibles = new Set(fotosData.map((foto) => foto.id_foto));

        setFotos(fotosData);
        setConsultado(true);
        setCompendios(compendiosData);
        setCargandoCompendios(false);
        setSeleccion(
          guardado?.fotografias
            .map((foto) => foto.id_foto)
            .filter((idFoto) => idsDisponibles.has(idFoto)) ?? [],
        );
      } catch (err) {
        setFotos([]);
        setConsultado(true);
        setSeleccion([]);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron obtener las fotografías del periodo.",
        );
      } finally {
        setCargandoFotos(false);
      }
    },
    [idObra],
  );

  useEffect(() => {
    if (!idObra) {
      return;
    }

    let activo = true;

    getCompendios(idObra)
      .then((lista) => {
        if (activo) {
          setCompendios(lista);
          setCargandoCompendios(false);
        }
      })
      .catch((err: unknown) => {
        if (activo) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron obtener los compendios mensuales.",
          );
          setCargandoCompendios(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [idObra]);

  const alternarFoto = (idFoto: string) => {
    setSeleccion((prev) => {
      if (prev.includes(idFoto)) {
        return prev.filter((id) => id !== idFoto);
      }

      if (prev.length >= MAX_FOTOS) {
        toast.warning(`Máximo ${MAX_FOTOS} fotografías por compendio.`);
        return prev;
      }

      return [...prev, idFoto];
    });
  };

  const handleMesChange = (nuevoMes: number) => {
    setMes(nuevoMes);
    setFotos([]);
    setConsultado(false);
    setSeleccion([]);
    setCompendioExpandido(null);
  };

  const handleAnioChange = (nuevoAnio: number) => {
    setAnio(nuevoAnio);
    setFotos([]);
    setConsultado(false);
    setSeleccion([]);
    setCompendioExpandido(null);
  };

  const handleBuscar = () => {
    void cargarFotos(mes, anio);
  };

  const handleGenerar = async () => {
    if (!idObra || seleccion.length === 0) {
      toast.warning("Selecciona al menos una fotografía.");
      return;
    }

    setGenerando(true);
    setError(null);

    try {
      const compendio = await generarCompendio(idObra, {
        mes,
        anio,
        fotografias: seleccion.map((idFoto) => ({ id_foto: idFoto })),
      });

      setCompendios((prev) => {
        const restantes = prev.filter(
          (item) => !(item.mes === mes && item.anio === anio),
        );
        return [compendio, ...restantes].sort(
          (a, b) => b.anio - a.anio || b.mes - a.mes,
        );
      });
      setSeleccion(compendio.fotografias.map((foto) => foto.id_foto));
      toast.success("Compendio mensual guardado correctamente.");
    } catch (err) {
      const mensaje =
        err instanceof Error
          ? err.message
          : "No se pudo generar el compendio mensual.";
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setGenerando(false);
    }
  };

  if (!idObra) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        No se encontró la obra solicitada.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
            <Images className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Compendios mensuales
            </h1>
            <p className="text-sm text-slate-500">{nombreObra}</p>
          </div>
        </div>

        {!puedeGenerar ? (
          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">
            <Lock className="h-4 w-4" aria-hidden="true" />
            Vista de solo lectura
          </span>
        ) : null}
      </header>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {puedeGenerar ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-40 flex-1">
              <label
                htmlFor="compendio-mes"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Mes
              </label>
              <select
                id="compendio-mes"
                value={mes}
                onChange={(event) => handleMesChange(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              >
                {MESES.map((nombre, indice) => (
                  <option key={nombre} value={indice + 1}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-32 flex-1">
              <label
                htmlFor="compendio-anio"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Año
              </label>
              <select
                id="compendio-anio"
                value={anio}
                onChange={(event) => handleAnioChange(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              >
                {ANIOS.map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleBuscar}
              disabled={cargandoFotos}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {cargandoFotos ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4" aria-hidden="true" />
              )}
              Buscar Fotografías
            </button>
          </div>

          {compendioDelPeriodo ? (
            <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              Este periodo ya tiene un compendio generado. Si guardas de nuevo, se
              reemplazará la selección anterior.
            </p>
          ) : null}
        </section>
      ) : null}

      {puedeGenerar ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">
                Fotografías de {nombreMes(mes)} {anio}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {consultado
                  ? `${fotos.length} foto(s) disponibles en los reportes diarios.`
                  : "Selecciona un mes y presiona Buscar Fotografías."}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {seleccion.length} / {MAX_FOTOS} seleccionadas
            </span>
          </div>

          {cargandoFotos ? (
            <div className="mt-6 flex items-center justify-center rounded-xl border border-dashed border-slate-300 py-12">
              <Loader2
                className="h-6 w-6 animate-spin text-slate-400"
                aria-hidden="true"
              />
            </div>
          ) : null}

          {!cargandoFotos && consultado && fotos.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-12 text-slate-400">
              <CalendarDays className="h-6 w-6" aria-hidden="true" />
              <span className="text-sm">
                No hay fotografías de reportes diarios en este periodo.
              </span>
            </div>
          ) : null}

          {!cargandoFotos && fotos.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {fotos.map((foto) => {
                const indice = seleccion.indexOf(foto.id_foto);
                const seleccionada = indice >= 0;

                return (
                  <button
                    key={foto.id_foto}
                    type="button"
                    onClick={() => alternarFoto(foto.id_foto)}
                    aria-pressed={seleccionada}
                    className={`group relative overflow-hidden rounded-xl border-2 bg-slate-50 text-left transition ${
                      seleccionada
                        ? "border-emerald-500 ring-2 ring-emerald-500/25"
                        : "border-transparent hover:border-slate-300"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={foto.url_foto}
                      alt="Evidencia fotográfica del reporte"
                      className="h-36 w-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 text-xs text-white">
                      {formatearFecha(foto.fecha_reporte)}
                    </span>
                    {seleccionada ? (
                      <span className="absolute right-2 top-2 inline-flex h-6 min-w-6 items-center justify-center gap-0.5 rounded-full bg-emerald-600 px-1.5 text-xs font-semibold text-white">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        {indice + 1}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Haz clic sobre las fotografías para seleccionarlas o quitarlas.
            </p>
            <button
              type="button"
              onClick={handleGenerar}
              disabled={generando || seleccion.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {generando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Images className="h-4 w-4" aria-hidden="true" />
              )}
              Generar Compendio
            </button>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-slate-900">Compendios generados</h2>
          <p className="mt-1 text-sm text-slate-500">
            {puedeGenerar
              ? "Historial de compendios mensuales de la obra."
              : "Consulta de los compendios mensuales generados por el supervisor."}
          </p>
        </div>

        {cargandoCompendios ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-12">
            <Loader2
              className="h-6 w-6 animate-spin text-slate-400"
              aria-hidden="true"
            />
          </div>
        ) : compendios.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            Aún no se han generado compendios mensuales para esta obra.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {compendios.map((compendio) => {
              const abierto = compendioExpandido === compendio.id_compendio;

              return (
                <article
                  key={compendio.id_compendio}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setCompendioExpandido((prev) =>
                        prev === compendio.id_compendio
                          ? null
                          : compendio.id_compendio,
                      )
                    }
                    aria-expanded={abierto}
                    className="flex w-full items-start justify-between gap-3 text-left"
                  >
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Compendio - {nombreMes(compendio.mes)} {compendio.anio}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {compendio.fotografias.length} fotografía(s)
                        {compendio.supervisor_correo
                          ? ` · ${compendio.supervisor_correo}`
                          : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Actualizado {formatearFechaHora(compendio.updated_at)}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                      {abierto ? "Ocultar" : "Ver fotografías"}
                      <ChevronDown
                        className={`h-4 w-4 transition ${abierto ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </span>
                  </button>

                  {abierto ? (
                    compendio.fotografias.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-500">
                        Este compendio no tiene fotografías seleccionadas.
                      </p>
                    ) : (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {compendio.fotografias.map((foto) => (
                          <a
                            key={foto.id_foto}
                            href={foto.url_foto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                            title={
                              foto.fecha_reporte
                                ? `Reporte del ${formatearFecha(foto.fecha_reporte)}`
                                : "Ver fotografía"
                            }
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={foto.url_foto}
                              alt="Fotografía del compendio"
                              className="h-36 w-full object-cover transition group-hover:scale-105 sm:h-44"
                              loading="lazy"
                            />
                            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 text-[11px] text-white">
                              {formatearFecha(foto.fecha_reporte)}
                            </span>
                          </a>
                        ))}
                      </div>
                    )
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
