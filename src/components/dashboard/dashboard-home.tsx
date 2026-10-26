"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardList, FileSignature } from "lucide-react";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { useObra } from "@/providers/obra-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const METRICAS = [
  {
    titulo: "Reportes Pendientes",
    valor: "0",
    descripcion: "Reportes diarios en espera de revisión",
    icono: ClipboardList,
  },
  {
    titulo: "Estimaciones en Revisión",
    valor: "0",
    descripcion: "Estimaciones que requieren autorización",
    icono: FileSignature,
  },
  {
    titulo: "Notas de Bitácora Abiertas",
    valor: "0",
    descripcion: "Registros abiertos en la bitácora electrónica",
    icono: BookOpen,
  },
];

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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {METRICAS.map((metrica) => {
          const Icono = metrica.icono;

          return (
            <Card key={metrica.titulo}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    {metrica.titulo}
                  </CardTitle>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/5 text-slate-900">
                  <Icono className="h-4 w-4" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-3xl font-semibold tracking-tight text-slate-900">
                  {metrica.valor}
                </p>
                <p className="text-sm text-slate-500">{metrica.descripcion}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Estado General</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-slate-500">
            <p>
              Las métricas se irán poblando conforme se registren reportes,
              estimaciones y notas en la bitácora electrónica.
            </p>
            <p>
              Usa el selector de obra activa en la barra superior para cambiar
              entre los proyectos asignados a tu cuenta.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
