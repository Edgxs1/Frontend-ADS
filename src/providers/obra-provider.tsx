"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { apiFetch } from "@/lib/api";
import type { Obra } from "@/types/obra";
import { useSupabaseSession } from "@/providers/supabase-provider";

interface ObraActiva {
  id_obra: string;
  nombre: string;
}

interface DatosObras {
  idUsuario: string;
  obras: Obra[];
  error: string | null;
}

interface ObraContextValue {
  obras: Obra[];
  obraActiva: ObraActiva | null;
  loadingObras: boolean;
  errorObras: string | null;
  seleccionarObra: (idObra: string) => void;
}

const ObraContext = createContext<ObraContextValue | undefined>(undefined);

async function obtenerObrasAsignadas(): Promise<Obra[]> {
  const response = await apiFetch("/api/v1/obras/asignadas");

  if (!response.ok) {
    throw new Error("No se pudieron obtener las obras asignadas.");
  }

  const body = (await response.json()) as { data?: Obra[] };
  return body.data ?? [];
}

export function ObraProvider({ children }: { children: ReactNode }) {
  const { session, loading } = useSupabaseSession();
  const idUsuario = session?.user.id ?? null;
  const [datos, setDatos] = useState<DatosObras | null>(null);
  const [seleccionId, setSeleccionId] = useState<string | null>(null);

  useEffect(() => {
    if (!idUsuario) {
      return;
    }

    let activo = true;

    obtenerObrasAsignadas()
      .then((obras) => {
        if (activo) setDatos({ idUsuario, obras, error: null });
      })
      .catch((err: unknown) => {
        if (activo) {
          setDatos({
            idUsuario,
            obras: [],
            error:
              err instanceof Error ? err.message : "Ocurrió un error inesperado.",
          });
        }
      });

    return () => {
      activo = false;
    };
  }, [idUsuario]);

  const datosValidos = useMemo(
    () => (datos && idUsuario && datos.idUsuario === idUsuario ? datos : null),
    [datos, idUsuario],
  );

  const obras = useMemo(() => datosValidos?.obras ?? [], [datosValidos]);
  const errorObras = datosValidos?.error ?? null;
  const loadingObras = loading || (idUsuario !== null && datosValidos === null);

  const obraActiva = useMemo<ObraActiva | null>(() => {
    if (obras.length === 0) {
      return null;
    }

    const elegida =
      obras.find((obra) => obra.id_obra === seleccionId) ?? obras[0];

    return { id_obra: elegida.id_obra, nombre: elegida.nombre };
  }, [obras, seleccionId]);

  const seleccionarObra = useCallback((idObra: string) => {
    setSeleccionId(idObra);
  }, []);

  const value = useMemo<ObraContextValue>(
    () => ({
      obras,
      obraActiva,
      loadingObras,
      errorObras,
      seleccionarObra,
    }),
    [obras, obraActiva, loadingObras, errorObras, seleccionarObra],
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
