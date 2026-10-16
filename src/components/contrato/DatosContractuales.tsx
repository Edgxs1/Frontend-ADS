"use client";

import { useEffect, useState } from "react";
import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { getContrato } from "@/services/contrato";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { ContratoDetalle } from "./ContratoDetalle";
import { ContratoFormulario } from "./ContratoFormulario";
import type { ContratoConContratista } from "@/types";

export function DatosContractuales({ idObra }: { idObra: string }) {
  const { rol } = useSupabaseSession();
  const [contrato, setContrato] = useState<ContratoConContratista | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    getContrato(idObra)
      .then((data) => {
        if (activo) setContrato(data);
      })
      .catch((err: unknown) => {
        if (activo) {
          setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [idObra]);

  const esAdministrador = rol === "Administrador";

  if (cargando) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {contrato ? <ContratoDetalle contrato={contrato} /> : null}

      {!contrato && !error && !esAdministrador ? (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          <FileText className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>Esta obra aún no tiene un contrato registrado.</span>
        </div>
      ) : null}

      {esAdministrador ? (
        <ContratoFormulario
          idObra={idObra}
          onRegistrado={(nuevo) => {
            setContrato(nuevo);
            setError(null);
          }}
        />
      ) : null}
    </div>
  );
}
