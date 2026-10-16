"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { registrarContrato } from "@/services/contrato";
import type { ContratoConContratista, RegistrarContratoInput } from "@/types";

const esquemaContrato = z.object({
  numero_contrato: z.string().trim().min(1, "Requerido").max(100, "Máximo 100 caracteres"),
  fecha_contrato: z.iso.date("Fecha inválida"),
  lugar_obra: z.string().trim().min(1, "Requerido").max(200, "Máximo 200 caracteres"),
  periodo_ejecucion_inicio: z.iso.date("Fecha inválida"),
  periodo_ejecucion_fin: z.iso.date("Fecha inválida"),
  importe_contrato: z.number("Requerido").positive("Debe ser mayor a 0"),
  contratista: z.object({
    razon_social: z.string().trim().min(1, "Requerido").max(200, "Máximo 200 caracteres"),
    rfc: z.string().trim().min(1, "Requerido").max(13, "Máximo 13 caracteres"),
    registro_iva: z.string().trim().min(1, "Requerido").max(50, "Máximo 50 caracteres"),
    registro_cmic: z.string().trim().min(1, "Requerido").max(50, "Máximo 50 caracteres"),
    registro_gacm: z.string().trim().min(1, "Requerido").max(50, "Máximo 50 caracteres"),
    representante_legal: z.string().trim().min(1, "Requerido").max(200, "Máximo 200 caracteres"),
    cargo_representante: z.string().trim().min(1, "Requerido").max(150, "Máximo 150 caracteres"),
    telefono_representante: z.string().trim().min(1, "Requerido").max(30, "Máximo 30 caracteres"),
  }),
}).refine(
  (valores) => valores.periodo_ejecucion_fin >= valores.periodo_ejecucion_inicio,
  {
    message: "La fecha fin no puede ser anterior a la fecha de inicio",
    path: ["periodo_ejecucion_fin"],
  },
);

type FormValues = z.infer<typeof esquemaContrato>;

const VALORES_INICIALES: FormValues = {
  numero_contrato: "",
  fecha_contrato: "",
  lugar_obra: "",
  periodo_ejecucion_inicio: "",
  periodo_ejecucion_fin: "",
  importe_contrato: 0,
  contratista: {
    razon_social: "",
    rfc: "",
    registro_iva: "",
    registro_cmic: "",
    registro_gacm: "",
    representante_legal: "",
    cargo_representante: "",
    telefono_representante: "",
  },
};

interface CampoProps extends React.InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string;
}

function Campo({ etiqueta, error, ...props }: CampoProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{etiqueta}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

interface ContratoFormularioProps {
  idObra: string;
  onRegistrado: (contrato: ContratoConContratista) => void;
}

export function ContratoFormulario({ idObra, onRegistrado }: ContratoFormularioProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(esquemaContrato),
    defaultValues: VALORES_INICIALES,
  });

  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);
    setExito(false);

    try {
      const contrato = await registrarContrato(idObra, valores as RegistrarContratoInput);
      onRegistrado(contrato);
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
      <h2 className="font-semibold text-slate-900">Registrar contrato</h2>
      <p className="mt-1 text-sm text-slate-500">
        Completa los datos del contrato y del contratista.
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-6" noValidate>
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-slate-900">Datos del contrato</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Campo
              etiqueta="Número de contrato"
              error={errors.numero_contrato?.message}
              {...register("numero_contrato")}
            />
            <Campo
              etiqueta="Fecha del contrato"
              type="date"
              error={errors.fecha_contrato?.message}
              {...register("fecha_contrato")}
            />
            <Campo
              etiqueta="Lugar de la obra"
              error={errors.lugar_obra?.message}
              {...register("lugar_obra")}
            />
            <Campo
              etiqueta="Inicio de ejecución"
              type="date"
              error={errors.periodo_ejecucion_inicio?.message}
              {...register("periodo_ejecucion_inicio")}
            />
            <Campo
              etiqueta="Fin de ejecución"
              type="date"
              error={errors.periodo_ejecucion_fin?.message}
              {...register("periodo_ejecucion_fin")}
            />
            <Campo
              etiqueta="Importe del contrato (MXN)"
              type="number"
              step="0.01"
              min="0"
              error={errors.importe_contrato?.message}
              {...register("importe_contrato", { valueAsNumber: true })}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-slate-900">Datos del contratista</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Campo
              etiqueta="Razón social"
              error={errors.contratista?.razon_social?.message}
              {...register("contratista.razon_social")}
            />
            <Campo
              etiqueta="RFC"
              error={errors.contratista?.rfc?.message}
              {...register("contratista.rfc")}
            />
            <Campo
              etiqueta="Registro IVA"
              error={errors.contratista?.registro_iva?.message}
              {...register("contratista.registro_iva")}
            />
            <Campo
              etiqueta="Registro CMIC"
              error={errors.contratista?.registro_cmic?.message}
              {...register("contratista.registro_cmic")}
            />
            <Campo
              etiqueta="Registro GACM"
              error={errors.contratista?.registro_gacm?.message}
              {...register("contratista.registro_gacm")}
            />
            <Campo
              etiqueta="Representante legal"
              error={errors.contratista?.representante_legal?.message}
              {...register("contratista.representante_legal")}
            />
            <Campo
              etiqueta="Cargo del representante"
              error={errors.contratista?.cargo_representante?.message}
              {...register("contratista.cargo_representante")}
            />
            <Campo
              etiqueta="Teléfono del representante"
              error={errors.contratista?.telefono_representante?.message}
              {...register("contratista.telefono_representante")}
            />
          </div>
        </fieldset>

        {errorServidor ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorServidor}
          </p>
        ) : null}

        {exito ? (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Contrato registrado correctamente.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Registrar contrato
        </button>
      </form>
    </section>
  );
}
