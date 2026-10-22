"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X } from "lucide-react";
import { crearNota, editarNota } from "@/services/bitacora";
import type { NotaBitacora } from "@/types";

const esquemaNota = z.object({
  texto: z
    .string()
    .trim()
    .min(5, "Mínimo 5 caracteres")
    .max(2000, "Máximo 2000 caracteres"),
});

type FormValues = z.infer<typeof esquemaNota>;

interface NotaFormularioProps {
  idObra: string;
  nota?: NotaBitacora;
  onGuardada: (nota: NotaBitacora) => void;
  onCerrar: () => void;
}

export function NotaFormulario({
  idObra,
  nota,
  onGuardada,
  onCerrar,
}: NotaFormularioProps) {
  const editando = Boolean(nota);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(esquemaNota),
    defaultValues: { texto: nota?.texto ?? "" },
  });

  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);

    try {
      const resultado = nota
        ? await editarNota(idObra, nota.id_nota, valores)
        : await crearNota(idObra, valores);

      onGuardada(resultado);
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
        aria-label={editando ? "Editar nota de bitácora" : "Crear nota de bitácora"}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              {editando ? "Editar nota" : "Nueva nota de bitácora"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {editando
                ? "Modifica el contenido de la nota mientras siga Abierta."
                : "Registra una anotación para la bitácora electrónica de la obra."}
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
              Texto
            </span>
            <textarea
              rows={5}
              {...register("texto")}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
            {errors.texto ? (
              <span className="mt-1 block text-xs text-red-600">
                {errors.texto.message}
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
              {editando ? "Guardar cambios" : "Crear nota"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
