"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { crearPartida } from "@/services/partida";
import type { Partida } from "@/types";
import { useSupabaseSession } from "@/providers/supabase-provider";

const esquemaPartida = z.object({
  clave: z.string().trim().min(1, "Requerido").max(50, "Máximo 50 caracteres"),
  descripcion: z
    .string()
    .trim()
    .min(1, "Requerido")
    .max(300, "Máximo 300 caracteres"),
});

type FormValues = z.infer<typeof esquemaPartida>;

interface PartidaFormularioProps {
  idObra: string;
  onCreada: (partida: Partida) => void;
}

export function PartidaFormulario({ idObra, onCreada }: PartidaFormularioProps) {
  const { rol } = useSupabaseSession();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(esquemaPartida),
    defaultValues: { clave: "", descripcion: "" },
  });

  const puedeCrear = rol === "Administrador" || rol === "Superintendente";

  if (!puedeCrear) {
    return null;
  }

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);
    setExito(false);

    try {
      const partida = await crearPartida(idObra, valores);
      onCreada(partida);
      reset();
      setExito(true);
    } catch (err) {
      setErrorServidor(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">Crear partida</h2>
      <p className="mt-1 text-sm text-slate-500">
        Registra una nueva partida para la obra seleccionada.
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <label className="block sm:col-span-2">
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
        </div>

        {errorServidor ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorServidor}
          </p>
        ) : null}

        {exito ? (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Partida creada correctamente.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          Crear partida
        </button>
      </form>
    </section>
  );
}
