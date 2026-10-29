"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { eliminarNota, getNotas, sellarNota } from "@/services/bitacora";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { useObra } from "@/providers/obra-provider";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
import { formatearFechaHora } from "@/lib/format";
import { NotaFormulario } from "./NotaFormulario";
import { EstadoNotaBadge } from "./EstadoNotaBadge";
import type { NotaBitacora } from "@/types";

interface DatosCargados {
  idObra: string;
  notas: NotaBitacora[];
  error: string | null;
}

export function DatosBitacora() {
  const { obraActiva } = useObra();
  const { usuario, rol } = useSupabaseSession();
  const [datos, setDatos] = useState<DatosCargados | null>(null);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<NotaBitacora | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [ocupada, setOcupada] = useState<string | null>(null);
  const [firmandoId, setFirmandoId] = useState<string | null>(null);
  const [passwordFirma, setPasswordFirma] = useState("");
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const idObra = obraActiva?.id_obra ?? null;
  const idUsuario = usuario?.id_usuario ?? null;

  useEffect(() => {
    if (!idObra) {
      return;
    }

    const idSolicitada = idObra;
    let activo = true;

    getNotas(idSolicitada)
      .then((notas) => {
        if (activo) {
          setDatos({ idObra: idSolicitada, notas, error: null });
        }
      })
      .catch((err: unknown) => {
        if (activo) {
          setDatos({
            idObra: idSolicitada,
            notas: [],
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
  const notas = useMemo(() => datosValidos?.notas ?? [], [datosValidos]);
  const error = datosValidos?.error ?? null;

  const esAdmin = rol === "Administrador";
  const esSuperintendente = rol === "Superintendente";
  const esSupervisor = rol === "Supervisor";
  const esResidente = rol === "Residente";

  function actualizarNota(actualizada: NotaBitacora) {
    setDatos((prev) => {
      if (!prev || prev.idObra !== actualizada.id_obra) return prev;
      return {
        ...prev,
        notas: prev.notas.map((nota) =>
          nota.id_nota === actualizada.id_nota ? actualizada : nota,
        ),
      };
    });
  }

  const abrirFirmar = (idNota: string) => {
    setErrorAccion(null);
    setMensajeExito(null);
    setPasswordFirma("");
    setFirmandoId(idNota);
  };

  const confirmarFirmar = async () => {
    if (!firmandoId || !passwordFirma) {
      setErrorAccion("Ingresa tu contraseña");
      return;
    }
    setOcupada(firmandoId);
    setErrorAccion(null);
    setMensajeExito(null);
    try {
      const actualizada = await sellarNota(firmandoId, passwordFirma);
      actualizarNota(actualizada);
      setMensajeExito("Nota firmada correctamente");
      setFirmandoId(null);
      setPasswordFirma("");
    } catch (error) {
      setErrorAccion(
        error instanceof Error ? error.message : "No se pudo firmar la nota.",
      );
    } finally {
      setOcupada(null);
    }
  };

  async function manejarFirmar(nota: NotaBitacora) {
    if (!obraActiva) return;
    abrirFirmar(nota.id_nota);
  }

  async function manejarEliminar(nota: NotaBitacora) {
    if (!obraActiva) return;

    const confirmado = window.confirm(
      "¿Eliminar esta nota de la bitácora? Esta acción no puede deshacerse.",
    );

    if (!confirmado) return;

    setErrorAccion(null);
    setOcupada(nota.id_nota);

    try {
      await eliminarNota(obraActiva.id_obra, nota.id_nota);
      setDatos((prev) => {
        if (!prev || prev.idObra !== nota.id_obra) return prev;
        return {
          ...prev,
          notas: prev.notas.filter((item) => item.id_nota !== nota.id_nota),
        };
      });
    } catch (err: unknown) {
      setErrorAccion(
        err instanceof Error ? err.message : "Ocurrió un error inesperado.",
      );
    } finally {
      setOcupada(null);
    }
  }

  if (!obraActiva) {
    return <SinObraSeleccionada />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Bitácora electrónica
            </h1>
            <p className="text-sm text-slate-500">{obraActiva.nombre}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCreando(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Crear nota
        </button>
      </header>

      {errorAccion ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{errorAccion}</span>
        </div>
      ) : null}
      {mensajeExito ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{mensajeExito}</span>
        </div>
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

      {!cargando && !error && notas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">
            Aún no hay notas en la bitácora. Crea la primera anotación.
          </p>
        </div>
      ) : null}

      {!cargando && !error && notas.length > 0 ? (
        <ol className="relative space-y-4 border-l border-slate-200 pl-6">
          {notas.map((nota) => {
            const abierta = nota.estado === "Abierta";
            const esCreador = idUsuario !== null && nota.id_creador === idUsuario;
            const tieneAlgunaFirma =
              Boolean(nota.firma_superintendente) ||
              Boolean(nota.firma_supervisor) ||
              Boolean(nota.firma_residente);
            const tieneAlgunaFirmaNota =
              Boolean(nota.firma_superintendente) ||
              Boolean(nota.firma_supervisor) ||
              Boolean(nota.firma_residente);
            const puedeEditar = abierta && !tieneAlgunaFirmaNota && esCreador;
            const puedeFirmar =
              abierta &&
              ((esSuperintendente && !nota.firma_superintendente) ||
                (esSupervisor && !nota.firma_supervisor) ||
                (esResidente && !nota.firma_residente));
            const bloqueada = ocupada === nota.id_nota;
            const firmadaPorSuperintendente = Boolean(nota.firma_superintendente);
            const firmadaPorSupervisor = Boolean(nota.firma_supervisor);
            const firmadaPorResidente = Boolean(nota.firma_residente);

            return (
              <li key={nota.id_nota} className="relative">
                <span
                  className={`absolute -left-[31px] top-4 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-slate-50 ${
                    abierta ? "bg-amber-400" : "bg-emerald-500"
                  }`}
                  aria-hidden="true"
                />
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {nota.creador_correo ?? "Autor desconocido"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatearFechaHora(nota.created_at)}
                      </p>
                    </div>
                    <EstadoNotaBadge estado={nota.estado} />
                  </div>

                  <p className="mt-4 whitespace-pre-line text-sm text-slate-700">
                    {nota.texto}
                  </p>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Firmas
                    </p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex items-start gap-2">
                          {firmadaPorSuperintendente ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" aria-hidden="true" />
                          ) : (
                            <Clock className="mt-0.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-900">Superintendente</p>
                            <p className="text-xs text-slate-600">
                              {firmadaPorSuperintendente ? "Firmado" : "Pendiente de firma"}
                            </p>
                            {firmadaPorSuperintendente && nota.firma_superintendente ? (
                              <p className="mt-1 text-xs text-slate-500">
                                Hash: {String(nota.firma_superintendente).slice(0, 10)}...
                              </p>
                            ) : null}
                          </div>
                        </div>
                        {!firmadaPorSuperintendente && esSuperintendente ? (
                          <button
                            type="button"
                            onClick={() => abrirFirmar(nota.id_nota)}
                            className="self-start rounded-lg bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
                          >
                            Firmar Nota
                          </button>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex items-start gap-2">
                          {firmadaPorSupervisor ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" aria-hidden="true" />
                          ) : (
                            <Clock className="mt-0.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-900">Supervisor</p>
                            <p className="text-xs text-slate-600">
                              {firmadaPorSupervisor ? "Firmado" : "Pendiente de firma"}
                            </p>
                            {firmadaPorSupervisor && nota.firma_supervisor ? (
                              <p className="mt-1 text-xs text-slate-500">
                                Hash: {String(nota.firma_supervisor).slice(0, 10)}...
                              </p>
                            ) : null}
                          </div>
                        </div>
                        {!firmadaPorSupervisor && esSupervisor ? (
                          <button
                            type="button"
                            onClick={() => abrirFirmar(nota.id_nota)}
                            className="self-start rounded-lg bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
                          >
                            Firmar Nota
                          </button>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex items-start gap-2">
                          {firmadaPorResidente ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" aria-hidden="true" />
                          ) : (
                            <Clock className="mt-0.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-900">Residente</p>
                            <p className="text-xs text-slate-600">
                              {firmadaPorResidente ? "Firmado" : "Pendiente de firma"}
                            </p>
                            {firmadaPorResidente && nota.firma_residente ? (
                              <p className="mt-1 text-xs text-slate-500">
                                Hash: {String(nota.firma_residente).slice(0, 10)}...
                              </p>
                            ) : null}
                          </div>
                        </div>
                        {!firmadaPorResidente && esResidente ? (
                          <button
                            type="button"
                            onClick={() => abrirFirmar(nota.id_nota)}
                            className="self-start rounded-lg bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
                          >
                            Firmar Nota
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {(abierta && (puedeEditar || puedeFirmar)) ? (
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
                      {puedeEditar ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditando(nota)}
                            disabled={bloqueada}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => manejarEliminar(nota)}
                            disabled={bloqueada}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                          >
                            {bloqueada ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            )}
                            Eliminar
                          </button>
                        </>
                      ) : null}

                      {puedeFirmar ? (
                        <button
                          type="button"
                          onClick={() => manejarFirmar(nota)}
                          disabled={bloqueada}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {bloqueada ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <Lock className="h-4 w-4" aria-hidden="true" />
                          )}
                          Firmar nota
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                </article>
              </li>
            );
          })}
        </ol>
      ) : null}

      {creando ? (
        <NotaFormulario
          idObra={obraActiva.id_obra}
          onCerrar={() => setCreando(false)}
          onGuardada={(nueva) => {
            setDatos((prev) => {
              const base =
                prev && prev.idObra === nueva.id_obra ? prev.notas : [];
              return {
                idObra: nueva.id_obra,
                notas: [nueva, ...base],
                error: null,
              };
            });
          }}
        />
      ) : null}

      {editando ? (
        <NotaFormulario
          idObra={obraActiva.id_obra}
          nota={editando}
          onCerrar={() => setEditando(null)}
          onGuardada={actualizarNota}
        />
      ) : null}

      {firmandoId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Firmar nota"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-900">Firmar nota</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Al firmar este documento aceptas la responsabilidad legal del mismo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFirmandoId(null);
                  setPasswordFirma("");
                  setErrorAccion(null);
                }}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Contraseña</span>
                <input
                  type="password"
                  value={passwordFirma}
                  onChange={(e) => setPasswordFirma(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </label>
              {errorAccion ? (
                <p className="text-sm text-red-600">{errorAccion}</p>
              ) : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFirmandoId(null);
                    setPasswordFirma("");
                    setErrorAccion(null);
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarFirmar}
                  disabled={ocupada === firmandoId}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {ocupada === firmandoId ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  Firmar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
