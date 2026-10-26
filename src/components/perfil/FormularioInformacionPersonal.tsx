"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { actualizarPerfil } from "@/services/usuario";

const RFC_REGEX =
  /^([A-ZÑ&]{3,4})\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z0-9]{3}$/i;

const perfilSchema = z.object({
  rfc: z
    .string()
    .trim()
    .min(12, "El RFC debe tener 12 o 13 caracteres")
    .max(13, "El RFC debe tener 12 o 13 caracteres")
    .regex(RFC_REGEX, "El RFC no tiene un formato válido"),
  telefono: z
    .string()
    .trim()
    .max(20, "El teléfono es demasiado largo")
    .regex(/^[0-9+()\s-]*$/, "El teléfono contiene caracteres inválidos"),
  cedula_profesional: z
    .string()
    .trim()
    .max(30, "La cédula profesional es demasiado larga")
    .regex(
      /^[A-Za-z0-9-]*$/,
      "La cédula profesional contiene caracteres inválidos",
    ),
});

type PerfilFormValues = z.infer<typeof perfilSchema>;

export function FormularioInformacionPersonal() {
  const { usuario, refrescarPerfil } = useSupabaseSession();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      rfc: usuario?.rfc ?? "",
      telefono: usuario?.telefono ?? "",
      cedula_profesional: usuario?.cedula_profesional ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await actualizarPerfil({
        rfc: values.rfc.toUpperCase(),
        telefono: values.telefono || undefined,
        cedula_profesional: values.cedula_profesional || undefined,
      });
      await refrescarPerfil();
      toast.success("Información personal actualizada");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la información personal.",
      );
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="rfc">RFC</Label>
          <Input
            id="rfc"
            placeholder="XAXX010101000"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={isSubmitting}
            {...register("rfc")}
          />
          <p className="mt-1 text-xs text-slate-500">
            12 caracteres para persona moral o 13 para persona física.
          </p>
          {errors.rfc ? (
            <p className="mt-1 text-xs text-red-600">{errors.rfc.message}</p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            placeholder="555 123 4567"
            inputMode="tel"
            disabled={isSubmitting}
            {...register("telefono")}
          />
          {errors.telefono ? (
            <p className="mt-1 text-xs text-red-600">{errors.telefono.message}</p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="cedula_profesional">Cédula profesional</Label>
          <Input
            id="cedula_profesional"
            placeholder="12345678"
            disabled={isSubmitting}
            {...register("cedula_profesional")}
          />
          {errors.cedula_profesional ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.cedula_profesional.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {isSubmitting ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
