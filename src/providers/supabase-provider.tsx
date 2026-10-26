"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  rfc: string | null;
  telefono: string | null;
  cedula_profesional: string | null;
  activo: boolean;
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
  const usuarioRef = useRef<PerfilUsuario | null>(null);

  const cargarPerfil = useCallback(async (mostrarLoader = true) => {
    if (mostrarLoader && usuarioRef.current === null) {
      setLoadingPerfil(true);
    }

    try {
      const response = await apiFetch("/api/v1/usuarios/me");

      if (!response.ok) {
        usuarioRef.current = null;
        setUsuario(null);
        return;
      }

      const body = await response.json().catch(() => null);
      const perfil = (body?.data as PerfilUsuario) ?? null;
      usuarioRef.current = perfil;
      setUsuario(perfil);
    } catch {
      usuarioRef.current = null;
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

    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "SIGNED_IN") {
        const esMismoUsuario =
          newSession?.user.id != null &&
          newSession.user.id === usuarioRef.current?.id_usuario;

        setSession(newSession);
        setLoading(false);

        if (newSession && !esMismoUsuario) {
          void cargarPerfil();
        }
        return;
      }

      if (event === "SIGNED_OUT") {
        usuarioRef.current = null;
        setSession(null);
        setUsuario(null);
        setLoading(false);
        return;
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [cargarPerfil]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const intervalo = setInterval(() => {
      void cargarPerfil(false);
    }, 20000);

    const alRecuperarFoco = () => {
      if (document.visibilityState === "visible") {
        void cargarPerfil(false);
      }
    };

    window.addEventListener("focus", alRecuperarFoco);
    document.addEventListener("visibilitychange", alRecuperarFoco);

    return () => {
      clearInterval(intervalo);
      window.removeEventListener("focus", alRecuperarFoco);
      document.removeEventListener("visibilitychange", alRecuperarFoco);
    };
  }, [session, cargarPerfil]);

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
