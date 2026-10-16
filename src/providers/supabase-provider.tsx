"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export type Rol =
  | "Administrador"
  | "Superintendente"
  | "Supervisor"
  | "Residente"
  | "Directivo";

export interface PerfilUsuario {
  id_usuario: string;
  correo: string;
  id_rol: number;
  rol: Rol | null;
}

interface SupabaseContextValue {
  supabase: SupabaseClient;
  session: Session | null;
  accessToken: string | null;
  usuario: PerfilUsuario | null;
  rol: Rol | null;
  loading: boolean;
  loadingPerfil: boolean;
  signOut: () => Promise<void>;
  refrescarPerfil: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<PerfilUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPerfil, setLoadingPerfil] = useState(false);

  const cargarPerfil = useCallback(async () => {
    setLoadingPerfil(true);

    try {
      const response = await apiFetch("/api/v1/usuarios/me");

      if (!response.ok) {
        setUsuario(null);
        return;
      }

      const body = await response.json().catch(() => null);
      setUsuario((body?.data as PerfilUsuario) ?? null);
    } catch {
      setUsuario(null);
    } finally {
      setLoadingPerfil(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setLoading(false);
        if (data.session) {
          void cargarPerfil();
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);

      if (newSession) {
        void cargarPerfil();
      } else {
        setUsuario(null);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [cargarPerfil]);

  const value = useMemo<SupabaseContextValue>(
    () => ({
      supabase,
      session,
      accessToken: session?.access_token ?? null,
      usuario,
      rol: usuario?.rol ?? null,
      loading,
      loadingPerfil,
      signOut: async () => {
        await supabase.auth.signOut();
      },
      refrescarPerfil: cargarPerfil,
    }),
    [session, usuario, loading, loadingPerfil, cargarPerfil],
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabaseSession(): SupabaseContextValue {
  const context = useContext(SupabaseContext);

  if (!context) {
    throw new Error("useSupabaseSession debe usarse dentro de <SupabaseProvider>");
  }

  return context;
}
