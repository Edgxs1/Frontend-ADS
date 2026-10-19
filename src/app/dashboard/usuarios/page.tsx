"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { SelectorObra } from "@/components/layout/SelectorObra";
import { DatosUsuarios } from "@/components/usuarios/DatosUsuarios";

export default function UsuariosPage() {
  const router = useRouter();
  const { session, rol, loading, loadingPerfil, signOut } = useSupabaseSession();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  useEffect(() => {
    if (!loading && !loadingPerfil && session && rol && rol !== "Administrador") {
      router.replace("/dashboard");
    }
  }, [loading, loadingPerfil, session, rol, router]);

  if (loading || (session && loadingPerfil)) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden="true" />
      </main>
    );
  }

  if (!session || rol !== "Administrador") {
    return null;
  }

  return (
    <main className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Send className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Usuarios</p>
              <p className="text-xs text-slate-500">{session.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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

        <DatosUsuarios />
      </section>
    </main>
  );
}
