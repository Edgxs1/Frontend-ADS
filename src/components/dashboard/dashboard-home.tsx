"use client";

import Link from "next/link";
import { ArrowRight, Building2, Users } from "lucide-react";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { useObra } from "@/providers/obra-provider";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
import { BandejaPendientes } from "@/components/dashboard/bandeja-pendientes";
import { TableroObra } from "@/components/dashboard/tablero-obra";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DashboardHome() {
  const { usuario, rol } = useSupabaseSession();
  const { obraActiva } = useObra();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Resumen de Obra
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {obraActiva
              ? `Monitoreo de ${obraActiva.nombre}`
              : "Selecciona una obra activa desde la barra superior"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>Bienvenido{usuario?.correo ? `, ${usuario.correo}` : ""}</span>
          {rol ? (
            <>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-slate-700">{rol}</span>
            </>
          ) : null}
        </div>
      </header>

      <BandejaPendientes />

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Tablero de consulta de la obra
          </h2>
          <p className="text-sm text-slate-500">
            Indicadores de avance, curva de ejecución y estado de los recursos
            financieros. Información de solo lectura.
          </p>
        </div>

        {obraActiva ? (
          <TableroObra idObra={obraActiva.id_obra} />
        ) : (
          <SinObraSeleccionada />
        )}
      </section>

      {rol === "Administrador" ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Administración
            </h2>
            <p className="text-sm text-slate-500">
              Gestiona las cuentas de usuario y las obras del sistema.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Usuarios
                </CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/5 text-slate-900">
                  <Users className="h-4 w-4" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-slate-500">
                  Crea usuarios, asigna roles y activa o desactiva sus cuentas.
                </p>
                <Button asChild variant="outline" className="w-fit gap-2">
                  <Link href="/dashboard/usuarios">
                    Gestionar usuarios
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Obras
                </CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/5 text-slate-900">
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-slate-500">
                  Registra nuevas obras y asigna usuarios a su equipo de trabajo.
                </p>
                <Button asChild variant="outline" className="w-fit gap-2">
                  <Link href="/dashboard/obras">
                    Gestionar obras
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Accesos rápidos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard/reportes">
              Reportes Diarios
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard/bitacora">
              Bitácora Electrónica
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard/catalogos">
              Catálogos de Conceptos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard/contrato">
              Contratos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard/expediente">
              Expediente en Nube
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
