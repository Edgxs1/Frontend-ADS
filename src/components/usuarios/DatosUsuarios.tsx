"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Search, Users, X } from "lucide-react";
import { getUsuarios } from "@/services/usuario";
import { UsuarioFormulario } from "./UsuarioFormulario";
import { UsuariosTabla } from "./UsuariosTabla";
import { ROLES_SISTEMA } from "@/types";
import type { Rol } from "@/providers/supabase-provider";
import type { UsuarioAdmin } from "@/types";

export function DatosUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [rolFiltro, setRolFiltro] = useState<Rol | "">("");
  const [cargando, setCargando] = useState(true);
  const [recargar, setRecargar] = useState(0);

  const iniciarConsulta = () => {
    setCargando(true);
    setError(null);
  };

  useEffect(() => {
    const siguiente = searchInput.trim();
    const temporizador = window.setTimeout(() => {
      if (siguiente !== search) {
        setCargando(true);
        setError(null);
        setSearch(siguiente);
      }
    }, 350);

    return () => window.clearTimeout(temporizador);
  }, [searchInput, search]);

  useEffect(() => {
    let activo = true;

    getUsuarios({
      search,
      rol: rolFiltro || undefined,
    })
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
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [search, rolFiltro, recargar]);

  const cargandoInicial = usuarios === null;
  const hayFiltros = search.length > 0 || rolFiltro !== "";

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
          iniciarConsulta();
          setRecargar((valor) => valor + 1);
        }}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar por correo, RFC o cédula..."
              aria-label="Buscar usuarios"
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <select
            value={rolFiltro}
            onChange={(event) => {
              setRolFiltro(event.target.value as Rol | "");
              iniciarConsulta();
            }}
            aria-label="Filtrar por rol"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 sm:w-56"
          >
            <option value="">Todos los roles</option>
            {ROLES_SISTEMA.map((rol) => (
              <option key={rol.id} value={rol.nombre}>
                {rol.nombre}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          {cargando && !cargandoInicial ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : null}
          {cargandoInicial
            ? "Cargando usuarios..."
            : `${usuarios?.length ?? 0} usuario${(usuarios?.length ?? 0) === 1 ? "" : "s"}`}
        </p>
      </section>

      {cargandoInicial ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Loader2
            className="h-6 w-6 animate-spin text-slate-400"
            aria-hidden="true"
          />
        </div>
      ) : null}

      {!cargandoInicial && error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {!cargandoInicial && !error ? (
        <UsuariosTabla
          usuarios={usuarios ?? []}
          mensajeVacio={
            hayFiltros
              ? "No se encontraron usuarios con los filtros seleccionados."
              : undefined
          }
          onRolActualizado={(usuario) => {
            setUsuarios((prev) =>
              (prev ?? []).map((item) =>
                item.id_usuario === usuario.id_usuario ? usuario : item,
              ),
            );
          }}
          onEstadoActualizado={(usuario) => {
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
