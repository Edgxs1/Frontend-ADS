"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Users } from "lucide-react";
import { getUsuarios } from "@/services/usuario";
import { UsuarioFormulario } from "./UsuarioFormulario";
import { UsuariosTabla } from "./UsuariosTabla";
import type { UsuarioAdmin } from "@/types";

export function DatosUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    getUsuarios()
      .then((data) => {
        if (activo) {
          setUsuarios(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (activo) {
          setUsuarios([]);
          setError(
            err instanceof Error ? err.message : "Ocurrió un error inesperado.",
          );
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  const cargando = usuarios === null;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
          <Users className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Usuarios
          </h1>
          <p className="text-sm text-slate-500">
            Alta de usuarios, asignación de roles y contraseña inicial.
          </p>
        </div>
      </header>

      <UsuarioFormulario
        onCreado={(usuario) => {
          setUsuarios((prev) => {
            const base = prev ?? [];
            const otros = base.filter(
              (item) => item.id_usuario !== usuario.id_usuario,
            );
            return [...otros, usuario].sort((a, b) =>
              a.correo.localeCompare(b.correo),
            );
          });
        }}
      />

      {cargando ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Loader2
            className="h-6 w-6 animate-spin text-slate-400"
            aria-hidden="true"
          />
        </div>
      ) : null}

      {!cargando && error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {!cargando && !error ? (
        <UsuariosTabla
          usuarios={usuarios ?? []}
          onRolActualizado={(usuario) => {
            setUsuarios((prev) =>
              (prev ?? []).map((item) =>
                item.id_usuario === usuario.id_usuario ? usuario : item,
              ),
            );
          }}
        />
      ) : null}
    </div>
  );
}
