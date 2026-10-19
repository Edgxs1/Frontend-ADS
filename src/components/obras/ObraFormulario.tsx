"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { crearObra } from "@/services/obra";
import type { Obra } from "@/types";

const esquemaObra = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Requerido")
    .max(200, "Máximo 200 caracteres"),
  tipo_edificacion: z
    .string()
    .trim()
    .max(150, "Máximo 150 caracteres")
    .optional(),
  num_habitaciones: z
    .number("Requerido")
    .int("Debe ser un número entero")
    .nonnegative("No puede ser negativo")
    .optional(),
});

type FormValues = z.infer<typeof esquemaObra>;

const VALORES_INICIALES: FormValues = {
  nombre: "",
  tipo_edificacion: "",
  num_habitaciones: undefined,
};

interface CampoProps extends React.InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string;
}

function Campo({ etiqueta, error, ...props }: CampoProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {etiqueta}
      </span>
      <input
        {...props}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
      />
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : null}
    </label>
  );
}

interface ObraFormularioProps {
  onCreada: (obra: Obra) => void;
}

export function ObraFormulario({ onCreada }: ObraFormularioProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(esquemaObra),
    defaultValues: VALORES_INICIALES,
  });

  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);
    setExito(false);

    try {
      const obra = await crearObra({
        nombre: valores.nombre,
        ...(valores.tipo_edificacion
          ? { tipo_edificacion: valores.tipo_edificacion }
          : {}),
        ...(valores.num_habitaciones != null
          ? { num_habitaciones: valores.num_habitaciones }
          : {}),
      });
      onCreada(obra);
      reset(VALORES_INICIALES);
      setExito(true);
    } catch (error) {
      setErrorServidor(
        error instanceof Error ? error.message : "Ocurrió un error inesperado.",
      );
    }
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">Registrar obra</h2>
      <p className="mt-1 text-sm text-slate-500">
        Captura los datos generales de la nueva obra.
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo
            etiqueta="Nombre de la obra"
            error={errors.nombre?.message}
            {...register("nombre")}
          />
          <Campo
            etiqueta="Tipo de edificación"
            error={errors.tipo_edificacion?.message}
            {...register("tipo_edificacion")}
          />
          <Campo
            etiqueta="Número de habitaciones"
            type="number"
            min="0"
            error={errors.num_habitaciones?.message}
            {...register("num_habitaciones", { valueAsNumber: true })}
          />
        </div>

        {errorServidor ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorServidor}
          </p>
        ) : null}

        {exito ? (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Obra registrada correctamente.
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
          Registrar obra
        </button>
      </form>
    </section>
  );
}
