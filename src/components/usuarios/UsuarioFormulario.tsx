"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { crearUsuario } from "@/services/usuario";
import { ROLES_SISTEMA } from "@/types";
import type { UsuarioAdmin } from "@/types";

const esquemaUsuario = z.object({
  email: z.email("Correo inválido"),
  id_rol: z.number("Selecciona un rol").int().min(1).max(5),
  password: z
    .string()
    .min(6, "Mínimo 6 caracteres")
    .max(72, "Máximo 72 caracteres"),
});

type FormValues = z.infer<typeof esquemaUsuario>;

const VALORES_INICIALES: FormValues = {
  email: "",
  id_rol: 0,
  password: "",
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

interface UsuarioFormularioProps {
  onCreado: (usuario: UsuarioAdmin) => void;
}

export function UsuarioFormulario({ onCreado }: UsuarioFormularioProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(esquemaUsuario),
    defaultValues: VALORES_INICIALES,
  });

  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);
    setExito(false);

    try {
      const usuario = await crearUsuario(valores);
      onCreado(usuario);
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
      <h2 className="font-semibold text-slate-900">Crear usuario</h2>
      <p className="mt-1 text-sm text-slate-500">
        Registra un usuario, asígnale un rol y una contraseña inicial.
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo
            etiqueta="Correo electrónico"
            type="email"
            autoComplete="off"
            error={errors.email?.message}
            {...register("email")}
          />

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Rol
            </span>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              defaultValue=""
              {...register("id_rol", { valueAsNumber: true })}
            >
              <option value="" disabled>
                Selecciona un rol
              </option>
              {ROLES_SISTEMA.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre}
                </option>
              ))}
            </select>
            {errors.id_rol?.message ? (
              <span className="mt-1 block text-xs text-red-600">
                {errors.id_rol.message}
              </span>
            ) : null}
          </label>

          <Campo
            etiqueta="Contraseña inicial"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
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
            Usuario creado correctamente.
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
          Crear usuario
        </button>
      </form>
    </section>
  );
}
