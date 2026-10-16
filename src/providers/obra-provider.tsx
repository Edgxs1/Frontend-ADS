"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";
import type { Obra } from "@/types/obra";
import { useSupabaseSession } from "@/providers/supabase-provider";

interface ObraActiva {
  id_obra: string;
  nombre: string;
}

interface ObraContextValue {
  obras: Obra[];
  obraActiva: ObraActiva | null;
  loadingObras: boolean;
  errorObras: string | null;
  seleccionarObra: (obra: ObraActiva) => void;
  refrescarObras: () => Promise<void>;
}

const ObraContext = createContext<ObraContextValue | undefined>(undefined);

export function ObraProvider({ children }: { children: ReactNode }) {
  const { session, loading, accessToken } = useSupabaseSession();
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraActiva, setObraActiva] = useState<ObraActiva | null>(null);
  const [loadingObras, setLoadingObras] = useState(false);
  const [errorObras, setErrorObras] = useState<string | null>(null);

  const refrescarObras = useCallback(async () => {
    if (!accessToken) {
      setObras([]);
      setErrorObras(null);
      return;
    }

    setLoadingObras(true);
    setErrorObras(null);

    try {
      const response = await apiFetch("/api/v1/obras/asignadas");
      if (!response.ok) {
        throw new Error("No se pudieron obtener las obras asignadas.");
      }

      const body = (await response.json()) as { data: Obra[] };
      const datos = body.data ?? [];
      setObras(datos);

      if (datos.length > 0) {
        const actual = obraActiva;
        const existe = actual ? datos.some((o) => o.id_obra === actual.id_obra) : false;

        if (!existe) {
          const primera = datos[0];
          setObraActiva({ id_obra: primera.id_obra, nombre: primera.nombre });
        }
      } else {
        setObraActiva(null);
      }
    } catch (err) {
      setErrorObras(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      setObras([]);
    } finally {
      setLoadingObras(false);
    }
  }, [accessToken, obraActiva]);

  useEffect(() => {
    if (!loading && session && accessToken) {
      void refrescarObras();
    }

    if (!session) {
      setObras([]);
      setObraActiva(null);
      setErrorObras(null);
    }
  }, [loading, session, accessToken, refrescarObras]);

  const seleccionarObra = useCallback((obra: ObraActiva) => {
    setObraActiva(obra);
  }, []);

  const value = useMemo<ObraContextValue>(
    () => ({
      obras,
      obraActiva,
      loadingObras,
      errorObras,
      seleccionarObra,
      refrescarObras,
    }),
    [obras, obraActiva, loadingObras, errorObras, seleccionarObra, refrescarObras],
  );

  return <ObraContext.Provider value={value}>{children}</ObraContext.Provider>;
}

export function useObra(): ObraContextValue {
  const ctx = useContext(ObraContext);

  if (!ctx) {
    throw new Error("useObra debe usarse dentro de <ObraProvider>");
  }

  return ctx;
}
