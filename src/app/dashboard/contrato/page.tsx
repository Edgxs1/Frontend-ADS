"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { SelectorObra } from "@/components/layout/SelectorObra";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
import { DatosContractuales } from "@/components/contrato/DatosContractuales";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { useObra } from "@/providers/obra-provider";

function Contenido() {
  const router = useRouter();
  const { session, rol, loading, loadingPerfil, signOut } = useSupabaseSession();
  const { obraActiva } = useObra();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading || (session && loadingPerfil)) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden="true" />
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Datos Contractuales</p>
              <p className="text-xs text-slate-500">{session.user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <SelectorObra />
            {rol ? (
              <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-700">
                {rol}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al panel
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Datos contractuales
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Consulta o registra la información del contrato de la obra.
        </p>

        <div className="mt-8">
          {obraActiva ? <DatosContractuales idObra={obraActiva.id_obra} /> : <SinObraSeleccionada />}
        </div>
      </section>
    </main>
  );
}

export default function ContratoPage() {
  return <Contenido />;
}
