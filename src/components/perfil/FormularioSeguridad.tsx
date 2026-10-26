"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabaseSession } from "@/providers/supabase-provider";

const contrasenaSchema = z
  .object({
    nueva_contrasena: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "La contraseña es demasiado larga"),
    confirmar_contrasena: z.string().min(8, "Confirma la contraseña"),
  })
  .refine((data) => data.nueva_contrasena === data.confirmar_contrasena, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar_contrasena"],
  });

type ContrasenaFormValues = z.infer<typeof contrasenaSchema>;

export function FormularioSeguridad() {
  const { supabase, session, signOut } = useSupabaseSession();
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContrasenaFormValues>({
    resolver: zodResolver(contrasenaSchema),
    defaultValues: {
      nueva_contrasena: "",
      confirmar_contrasena: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!session) {
      toast.error("Sesión expirada. Vuelve a iniciar sesión.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: values.nueva_contrasena,
    });

    if (error) {
      const mensaje = /session|jwt|expired/i.test(error.message)
        ? "Sesión expirada. Vuelve a iniciar sesión."
        : error.message;

      toast.error(mensaje);

      if (/session|jwt|expired/i.test(error.message)) {
        await signOut();
      }
      return;
    }

    toast.success("Contraseña actualizada correctamente");
    reset();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-5">
        <div>
          <Label htmlFor="nueva_contrasena">Nueva contraseña</Label>
          <div className="relative">
            <Input
              id="nueva_contrasena"
              type={mostrarNueva ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              disabled={isSubmitting}
              className="pr-10"
              {...register("nueva_contrasena")}
            />
            <button
              type="button"
              onClick={() => setMostrarNueva((valor) => !valor)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-700"
              aria-label={mostrarNueva ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {mostrarNueva ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.nueva_contrasena ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.nueva_contrasena.message}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="confirmar_contrasena">Confirmar contraseña</Label>
          <div className="relative">
            <Input
              id="confirmar_contrasena"
              type={mostrarConfirmacion ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repite la nueva contraseña"
              disabled={isSubmitting}
              className="pr-10"
              {...register("confirmar_contrasena")}
            />
            <button
              type="button"
              onClick={() => setMostrarConfirmacion((valor) => !valor)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-700"
              aria-label={
                mostrarConfirmacion
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"
              }
            >
              {mostrarConfirmacion ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.confirmar_contrasena ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.confirmar_contrasena.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <KeyRound aria-hidden="true" />
          )}
          {isSubmitting ? "Actualizando…" : "Actualizar contraseña"}
        </Button>
      </div>
    </form>
  );
}
