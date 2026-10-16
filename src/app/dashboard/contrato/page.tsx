"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Search, Send } from "lucide-react";
import { SelectorObra } from "@/components/layout/SelectorObra";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

function Contenido() {
  const router = useRouter();
  const params = useSearchParams();
  const { session, rol, loading, loadingPerfil, signOut } = useSupabaseSession();

  const idInicial = params.get("id_obra") ?? "";
  const [entrada, setEntrada] = useState(idInicial);
  const [idObra, setIdObra] = useState(idInicial);
  const [errorId, setErrorId] = useState<string | null>(null);

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

  const consultar = (evento: React.FormEvent) => {
    evento.preventDefault();
    const valor = entrada.trim();

    if (!UUID_REGEX.test(valor)) {
      setErrorId("Ingresa un identificador de obra (UUID) válido.");
      return;
    }

    setErrorId(null);
    setIdObra(valor);
  };

  return (
    <main className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Send className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Datos Contractuales</p>
              <p className="text-xs text-slate-500">{session.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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

        <form onSubmit={consultar} className="mt-6 flex flex-wrap items-end gap-3">
          <label className="block grow">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Identificador de la obra (UUID)
            </span>
            <input
              value={entrada}
              onChange={(evento) => setEntrada(evento.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
            {errorId ? (
              <span className="mt-1 block text-xs text-red-600">{errorId}</span>
            ) : null}
          </label>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Consultar
          </button>
        </form>

        {idObra ? (
          <div className="mt-8">
            <DatosContractuales key={idObra} idObra={idObra} />
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default function ContratoPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden="true" />
        </main>
      }
    >
      <Contenido />
    </Suspense>
  );
}
