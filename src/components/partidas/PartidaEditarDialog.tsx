"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X } from "lucide-react";
import { actualizarPartida } from "@/services/partida";
import type { Partida } from "@/types";

const esquemaPartida = z.object({
  clave: z.string().trim().min(1, "Requerido").max(50, "Máximo 50 caracteres"),
  descripcion: z
    .string()
    .trim()
    .min(1, "Requerido")
    .max(300, "Máximo 300 caracteres"),
});

type FormValues = z.infer<typeof esquemaPartida>;

interface PartidaEditarDialogProps {
  partida: Partida;
  onCerrar: () => void;
  onGuardada: (partida: Partida) => void;
}

export function PartidaEditarDialog({
  partida,
  onCerrar,
  onGuardada,
}: PartidaEditarDialogProps) {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(esquemaPartida),
    defaultValues: { clave: partida.clave, descripcion: partida.descripcion },
  });

  useEffect(() => {
    reset({ clave: partida.clave, descripcion: partida.descripcion });
  }, [partida, reset]);

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);

    try {
      const actualizada = await actualizarPartida(
        partida.id_obra,
        partida.id_partida,
        valores,
      );
      onGuardada(actualizada);
    } catch (err) {
      setErrorServidor(
        err instanceof Error ? err.message : "Ocurrió un error inesperado.",
      );
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-partida-titulo"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="editar-partida-titulo"
              className="text-lg font-semibold text-slate-900"
            >
              Editar partida
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Actualiza la clave y descripción de la partida.
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

        <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
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

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Descripción
            </span>
            <input
              {...register("descripcion")}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
            {errors.descripcion ? (
              <span className="mt-1 block text-xs text-red-600">
                {errors.descripcion.message}
              </span>
            ) : null}
          </label>

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
