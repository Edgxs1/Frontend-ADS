"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { useObra } from "@/providers/obra-provider";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
import { DatosContractuales } from "@/components/contrato/DatosContractuales";

export function ContratoPageClient() {
  const router = useRouter();
  const { session, loading, loadingPerfil } = useSupabaseSession();
  const { obraActiva } = useObra();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading || (session && loadingPerfil)) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden="true" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!obraActiva) {
    return <SinObraSeleccionada />;
  }

  return <DatosContractuales idObra={obraActiva.id_obra} />;
}
