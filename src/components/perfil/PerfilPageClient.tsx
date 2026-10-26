"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { FormularioInformacionPersonal } from "@/components/perfil/FormularioInformacionPersonal";
import { FormularioSeguridad } from "@/components/perfil/FormularioSeguridad";

export function PerfilPageClient() {
  const { usuario } = useSupabaseSession();

  if (!usuario) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard"
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al panel
      </Link>

      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Configuración de perfil
          </h1>
          <p className="text-sm text-slate-500">
            {usuario.correo}
            {usuario.rol ? ` · ${usuario.rol}` : ""}
          </p>
        </div>
      </header>

      <Tabs defaultValue="informacion" className="w-full">
        <TabsList>
          <TabsTrigger value="informacion">
            <UserRound className="h-4 w-4" aria-hidden="true" />
            Información Personal
          </TabsTrigger>
          <TabsTrigger value="seguridad">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="informacion">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información personal</CardTitle>
              <CardDescription>
                Actualiza tus datos fiscales y de contacto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormularioInformacionPersonal />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguridad">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cambio de contraseña</CardTitle>
              <CardDescription>
                Usa una contraseña segura de al menos 8 caracteres.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormularioSeguridad />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
