"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X } from "lucide-react";
import { crearReporte } from "@/services/reporte";
import type { Reporte } from "@/types";

const esquemaReporte = z.object({
  condicionantes: z
    .string()
    .trim()
    .min(5, "Mínimo 5 caracteres")
    .max(2000, "Máximo 2000 caracteres"),
  avance_general: z
    .string()
    .trim()
    .min(5, "Mínimo 5 caracteres")
    .max(2000, "Máximo 2000 caracteres"),
});

type FormValues = z.infer<typeof esquemaReporte>;

const VALORES_INICIALES: FormValues = {
  condicionantes: "",
  avance_general: "",
};

interface ReporteFormularioProps {
  idObra: string;
  onCreado: (reporte: Reporte) => void;
  onCerrar: () => void;
}

export function ReporteFormulario({
  idObra,
  onCreado,
  onCerrar,
}: ReporteFormularioProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(esquemaReporte),
    defaultValues: VALORES_INICIALES,
  });

  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);

    try {
      const reporte = await crearReporte(idObra, valores);
      onCreado(reporte);
      onCerrar();
    } catch (error) {
      setErrorServidor(
        error instanceof Error ? error.message : "Ocurrió un error inesperado.",
      );
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Crear reporte diario"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-900">Crear reporte diario</h2>
            <p className="mt-1 text-sm text-slate-500">
              Registra el avance y las condicionantes de la jornada.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Avance general
            </span>
            <textarea
              rows={3}
              {...register("avance_general")}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
            {errors.avance_general ? (
              <span className="mt-1 block text-xs text-red-600">
                {errors.avance_general.message}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Condicionantes
            </span>
            <textarea
              rows={3}
              {...register("condicionantes")}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
            {errors.condicionantes ? (
              <span className="mt-1 block text-xs text-red-600">
                {errors.condicionantes.message}
              </span>
            ) : null}
          </label>

          {errorServidor ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorServidor}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
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
              Crear reporte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
