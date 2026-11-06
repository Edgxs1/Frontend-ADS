"use client";

import { HardHat, Loader2 } from "lucide-react";
import { useObra } from "@/providers/obra-provider";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
import { RecursosCatalogo } from "./RecursosCatalogo";

export function DatosRecursos() {
  const { obraActiva, loadingObras } = useObra();

  if (loadingObras) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <Loader2
          className="h-6 w-6 animate-spin text-slate-400"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!obraActiva) {
    return (
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
            <HardHat className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Recursos
            </h1>
            <p className="text-sm text-slate-500">
              Catálogo de Personal, Maquinaria y Equipo.
            </p>
          </div>
        </header>

        <SinObraSeleccionada />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
          <HardHat className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Recursos
          </h1>
          <p className="text-sm text-slate-500">{obraActiva.nombre}</p>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Catálogo de Recursos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Administra el catálogo de Personal, Maquinaria y Equipo para esta
            obra.
          </p>
        </div>
        <div className="p-5">
          <RecursosCatalogo
            key={obraActiva.id_obra}
            idObra={obraActiva.id_obra}
          />
        </div>
      </section>
    </div>
  );
}
