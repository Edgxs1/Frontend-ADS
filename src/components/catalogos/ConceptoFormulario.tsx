"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { crearConcepto } from "@/services/catalogo";
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

const VALORES_INICIALES: FormValues = {
  id_partida: "",
  tipo: "Normal",
  clave: "",
  descripcion: "",
  unidad_medida: "",
  cantidad: 0,
  precio_unitario: 0,
};

const ETIQUETAS_TIPO: Record<(typeof TIPOS_CONCEPTO)[number], string> = {
  Normal: "Normal",
  Adicional: "Adicional",
  Extraordinario: "Extraordinario",
};

interface ConceptoFormularioProps {
  idObra: string;
  onCreada: (concepto: ConceptoConPartida) => void;
}

export function ConceptoFormulario({ idObra, onCreada }: ConceptoFormularioProps) {
  const [partidas, setPartidas] = useState<Partida[] | null>(null);
  const [errorPartidas, setErrorPartidas] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(esquemaConcepto),
    defaultValues: VALORES_INICIALES,
  });

  useEffect(() => {
    let activo = true;

    obtenerPartidas(idObra)
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
  }, [idObra]);

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);
    setExito(false);

    try {
      const creado = await crearConcepto(idObra, valores);
      const partida = partidas?.find((p) => p.id_partida === valores.id_partida);

      reset(VALORES_INICIALES);
      setExito(true);
      onCreada({ ...creado, partida_clave: partida?.clave ?? null });
    } catch (err) {
      setErrorServidor(
        err instanceof Error ? err.message : "Ocurrió un error inesperado.",
      );
    }
  });

  const cargandoPartidas = partidas === null && errorPartidas === null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">Crear concepto</h2>
      <p className="mt-1 text-sm text-slate-500">
        El importe total se calcula automáticamente a partir de la cantidad y el
        precio unitario.
      </p>

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
              <span className="mt-1 block text-xs text-red-600">{errorPartidas}</span>
            ) : (
              !cargandoPartidas && (partidas ?? []).length === 0 ? (
                <span className="mt-1 block text-xs text-amber-600">
                  Esta obra aún no tiene partidas registradas.
                </span>
              ) : null
            )}
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
            <span className="mb-1 block text-sm font-medium text-slate-700">Clave</span>
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

        {exito ? (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Concepto creado correctamente.
          </p>
        ) : null}

        {cargandoPartidas ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando partidas...
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          Crear concepto
        </button>
      </form>
    </section>
  );
}
