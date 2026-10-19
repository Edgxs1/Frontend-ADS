"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useSupabaseSession } from "@/providers/supabase-provider";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { session, loading, signOut } = useSupabaseSession();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [mensajeError, setMensajeError] = useState("");

  const formValido = password.length >= 6 && password === confirmar;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnviando(true);
    setMensajeError("");

    try {
      const response = await apiFetch("/api/v1/auth/update-password", {
        method: "POST",
        body: JSON.stringify({ password }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setMensajeError(body?.error?.message ?? "No se pudo actualizar la contraseña.");
        return;
      }

      setExito(true);
      await signOut();
      setTimeout(() => router.replace("/login"), 1500);
    } catch {
      setMensajeError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Nueva contraseña
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Define tu nueva contraseña de acceso
          </p>
        </header>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            </div>
          ) : !session ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <AlertCircle className="h-12 w-12 text-red-500" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-slate-900">
                Enlace inválido o expirado
              </h2>
              <p className="text-sm text-slate-500">
                Solicita un nuevo enlace de recuperación para continuar.
              </p>
            </div>
          ) : exito ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-slate-900">
                Contraseña actualizada
              </h2>
              <p className="text-sm text-slate-500">
                Redirigiendo para iniciar sesión...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    type={mostrarPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    disabled={enviando}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-11 text-base text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((valor) => !valor)}
                    aria-label={
                      mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:text-slate-600"
                  >
                    {mostrarPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="confirmar" className="text-sm font-medium text-slate-700">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="confirmar"
                    type={mostrarPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmar}
                    onChange={(event) => setConfirmar(event.target.value)}
                    placeholder="Repite la contraseña"
                    disabled={enviando}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-base text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
                  />
                </div>
                {confirmar && password !== confirmar ? (
                  <p className="text-xs text-red-600">Las contraseñas no coinciden.</p>
                ) : null}
              </div>

              {mensajeError ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{mensajeError}</span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={enviando || !formValido}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-base font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enviando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Guardando...
                  </>
                ) : (
                  "Actualizar contraseña"
                )}
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-4 flex items-center justify-center text-sm font-medium text-slate-600 underline-offset-4 hover:underline"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
