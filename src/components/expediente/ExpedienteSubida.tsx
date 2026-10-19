"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { subirArchivo } from "@/services/archivo";
import type { ArchivoRepositorio } from "@/types";

const TIPOS = ["Plano", "Acta", "Garantía", "Estudio", "Dictamen", "Otro"] as const;

const esquemaArchivo = z.object({
  tipo_documento: z.enum(TIPOS, "Selecciona el tipo de documento"),
  archivo: z
    .custom<FileList>(
      (valor) =>
        typeof FileList !== "undefined" &&
        valor instanceof FileList &&
        valor.length > 0,
      "Selecciona un archivo",
    )
    .refine(
      (files) =>
        !(files instanceof FileList) || (files[0]?.size ?? 0) <= 50 * 1024 * 1024,
      "El archivo no puede superar 50 MB",
    ),
});

type FormValues = z.infer<typeof esquemaArchivo>;

interface ExpedienteSubidaProps {
  idObra: string;
  onSubido: (archivo: ArchivoRepositorio) => void;
}

export function ExpedienteSubida({
  idObra,
  onSubido,
}: ExpedienteSubidaProps) {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(esquemaArchivo),
  });

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);
    setExito(false);

    try {
      const archivo = await subirArchivo(idObra, {
        tipo_documento: valores.tipo_documento,
        archivo: valores.archivo[0],
      });

      reset();
      setExito(true);
      onSubido(archivo);
    } catch (err) {
      setErrorServidor(
        err instanceof Error ? err.message : "Ocurrió un error inesperado.",
      );
    }
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">Subir archivo</h2>
      <p className="mt-1 text-sm text-slate-500">
        Selecciona un archivo y su tipo para añadirlo al expediente de la obra.
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Tipo de documento
            </span>
            <select
              {...register("tipo_documento")}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="">Selecciona...</option>
              {TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
            {errors.tipo_documento ? (
              <span className="mt-1 block text-xs text-red-600">
                {errors.tipo_documento.message}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Archivo
            </span>
            <input
              type="file"
              {...register("archivo")}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
            {errors.archivo ? (
              <span className="mt-1 block text-xs text-red-600">
                {errors.archivo.message}
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
            Archivo subido correctamente.
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
          Subir archivo
        </button>
      </form>
    </section>
  );
}
