"use client";

import { Suspense } from "react";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { session, usuario, loading, loadingPerfil, signOut } =
    useSupabaseSession();
  const cuentaDesactivada = useRef(false);

  useEffect(() => {
    if (loadingPerfil || !usuario) {
      return;
    }

    if (usuario.activo === false && !cuentaDesactivada.current) {
      cuentaDesactivada.current = true;
      void signOut();
    }
  }, [usuario, loadingPerfil, signOut]);

  useEffect(() => {
    if (!loading && !session) {
      router.replace(
        cuentaDesactivada.current ? "/login?motivo=desactivada" : "/login",
      );
    }
  }, [loading, session, router]);

  if (loading || (session && loadingPerfil) || (usuario?.activo === false)) {
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
    <div className="min-h-dvh bg-slate-50">
      <div className="flex min-h-dvh">
        <AppSidebar className="hidden w-72 lg:flex" />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <Suspense
                fallback={
                  <div className="flex min-h-[40dvh] items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-slate-400" aria-hidden="true" />
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

