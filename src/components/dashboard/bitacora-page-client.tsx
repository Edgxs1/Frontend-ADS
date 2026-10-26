"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { DatosBitacora } from "@/components/bitacora/DatosBitacora";

export function BitacoraPageClient() {
  const router = useRouter();
  const { session, loading, loadingPerfil } = useSupabaseSession();

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

  return <DatosBitacora />;
}
