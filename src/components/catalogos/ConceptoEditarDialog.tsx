"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X } from "lucide-react";
import { actualizarConcepto } from "@/services/catalogo";
import { obtenerPartidas } from "@/services/partida";
import { TIPOS_CONCEPTO } from "@/types";
import type { ConceptoConPartida, Partida } from "@/types";

const esquemaConcepto = z.object({
  id_partida: z.uuid("Selecciona una partida"),
  tipo: z.enum(TIPOS_CONCEPTO, "Selecciona un tipo"),
  clave: z.string().trim().min(1, "Requerido").max(100, "Máximo 100 caracteres"),
  descripcion: z
    .string()
    .trim()
    .min(3, "Mínimo 3 caracteres")
    .max(500, "Máximo 500 caracteres"),
  unidad_medida: z.string().trim().min(1, "Requerido").max(50, "Máximo 50 caracteres"),
  cantidad: z.number("Requerido").positive("Debe ser mayor a 0"),
  precio_unitario: z.number("Requerido").positive("Debe ser mayor a 0"),
});

type FormValues = z.infer<typeof esquemaConcepto>;

const ETIQUETAS_TIPO: Record<(typeof TIPOS_CONCEPTO)[number], string> = {
  Normal: "Normal",
  Adicional: "Adicional",
  Extraordinario: "Extraordinario",
};

interface ConceptoEditarDialogProps {
  concepto: ConceptoConPartida;
  onCerrar: () => void;
  onGuardada: (concepto: ConceptoConPartida) => void;
}

export function ConceptoEditarDialog({
  concepto,
  onCerrar,
  onGuardada,
}: ConceptoEditarDialogProps) {
  const [partidas, setPartidas] = useState<Partida[] | null>(null);
  const [errorPartidas, setErrorPartidas] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(esquemaConcepto),
    defaultValues: {
      id_partida: concepto.id_partida,
      tipo: concepto.tipo,
      clave: concepto.clave,
      descripcion: concepto.descripcion,
      unidad_medida: concepto.unidad_medida,
      cantidad: concepto.cantidad,
      precio_unitario: concepto.precio_unitario,
    },
  });

  useEffect(() => {
    reset({
      id_partida: concepto.id_partida,
      tipo: concepto.tipo,
      clave: concepto.clave,
      descripcion: concepto.descripcion,
      unidad_medida: concepto.unidad_medida,
      cantidad: concepto.cantidad,
      precio_unitario: concepto.precio_unitario,
    });
  }, [concepto, reset]);

  useEffect(() => {
    let activo = true;

    obtenerPartidas(concepto.id_obra)
      .then((data) => {
        if (activo) setPartidas(data);
      })
      .catch((err: unknown) => {
        if (activo) {
          setErrorPartidas(
            err instanceof Error ? err.message : "Ocurrió un error inesperado.",
          );
        }
      });

    return () => {
      activo = false;
    };
  }, [concepto.id_obra]);

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);

    try {
      const actualizado = await actualizarConcepto(
        concepto.id_obra,
        concepto.id_concepto,
        valores,
      );
      const partida = partidas?.find((p) => p.id_partida === valores.id_partida);

      onGuardada({ ...actualizado, partida_clave: partida?.clave ?? null });
    } catch (err) {
      setErrorServidor(
        err instanceof Error ? err.message : "Ocurrió un error inesperado.",
      );
    }
  });

  const cargandoPartidas = partidas === null && errorPartidas === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-concepto-titulo"
        className="my-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="editar-concepto-titulo"
              className="text-lg font-semibold text-slate-900"
            >
              Editar concepto
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              El importe total se recalcula con la cantidad y el precio unitario.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-5" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Partida
              </span>
              <select
                {...register("id_partida")}
                disabled={cargandoPartidas}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
              >
                <option value="">
                  {cargandoPartidas ? "Cargando partidas..." : "Selecciona una partida"}
                </option>
                {(partidas ?? []).map((partida) => (
                  <option key={partida.id_partida} value={partida.id_partida}>
                    {partida.clave} — {partida.descripcion}
                  </option>
                ))}
              </select>
              {errorPartidas ? (
                <span className="mt-1 block text-xs text-red-600">
                  {errorPartidas}
                </span>
              ) : null}
              {errors.id_partida ? (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.id_partida.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Tipo de concepto
              </span>
              <select
                {...register("tipo")}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              >
                {TIPOS_CONCEPTO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {ETIQUETAS_TIPO[tipo]}
                  </option>
                ))}
              </select>
              {errors.tipo ? (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.tipo.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Clave
              </span>
              <input
                {...register("clave")}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
              {errors.clave ? (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.clave.message}
                </span>
              ) : null}
            </label>

            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Descripción
              </span>
              <textarea
                {...register("descripcion")}
                rows={3}
                className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
              {errors.descripcion ? (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.descripcion.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Unidad de medida
              </span>
              <input
                {...register("unidad_medida")}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
              {errors.unidad_medida ? (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.unidad_medida.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Cantidad
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("cantidad", { valueAsNumber: true })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
              {errors.cantidad ? (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.cantidad.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Precio unitario (MXN)
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("precio_unitario", { valueAsNumber: true })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
              {errors.precio_unitario ? (
                <span className="mt-1 block text-xs text-red-600">
                  {errors.precio_unitario.message}
                </span>
              ) : null}
            </label>
          </div>

          {errorServidor ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorServidor}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
