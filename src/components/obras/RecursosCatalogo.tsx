"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useSupabaseSession } from "@/providers/supabase-provider";
import {
  actualizarRecursoObra,
  crearRecursoObra,
  getRecursosPorObra,
  type RecursoCatalogoObra,
} from "@/services/recurso";

interface RecursosCatalogoProps {
  idObra: string;
}

export function RecursosCatalogo({ idObra }: RecursosCatalogoProps) {
  const { rol } = useSupabaseSession();
  const esAdmin = rol === "Administrador";
  const [recursos, setRecursos] = useState<RecursoCatalogoObra[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [tipo, setTipo] = useState<"PERSONAL" | "MAQUINARIA" | "EQUIPO">("PERSONAL");
  const [descripcion, setDescripcion] = useState("");

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getRecursosPorObra(idObra);
      setRecursos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar recursos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [idObra]);

  const personal = useMemo(
    () => recursos.filter((r) => (r.tipo ?? "").toUpperCase() === "PERSONAL"),
    [recursos],
  );
  const maquinaria = useMemo(
    () => recursos.filter((r) => (r.tipo ?? "").toUpperCase() === "MAQUINARIA"),
    [recursos],
  );
  const equipo = useMemo(
    () => recursos.filter((r) => (r.tipo ?? "").toUpperCase() === "EQUIPO"),
    [recursos],
  );

  const cambiarActivo = async (recurso: RecursoCatalogoObra, activo: boolean) => {
    try {
      const actualizado = await actualizarRecursoObra(idObra, recurso.id_recurso, { activo });
      setRecursos((prev) =>
        prev.map((r) => (r.id_recurso === actualizado.id_recurso ? actualizado : r)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar");
    }
  };

  const agregar = async () => {
    if (!descripcion.trim()) {
      setError("Ingresa una descripción");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await crearRecursoObra(idObra, { tipo, descripcion: descripcion.trim() });
      setDescripcion("");
      setTipo("PERSONAL");
      setMostrarModal(false);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-12">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {esAdmin ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setMostrarModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Agregar Recurso
          </button>
        </div>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Personal</h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {personal.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-500">Sin registros</li>
            ) : (
              personal.map((r) => (
                <li key={r.id_recurso} className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-slate-700">{r.descripcion}</span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={r.activo}
                      onChange={(e) => cambiarActivo(r, e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-600 peer-checked:after:translate-x-full"></div>
                  </label>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Maquinaria</h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {maquinaria.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-500">Sin registros</li>
            ) : (
              maquinaria.map((r) => (
                <li key={r.id_recurso} className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-slate-700">{r.descripcion}</span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={r.activo}
                      onChange={(e) => cambiarActivo(r, e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-600 peer-checked:after:translate-x-full"></div>
                  </label>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Equipo</h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {equipo.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-500">Sin registros</li>
            ) : (
              equipo.map((r) => (
                <li key={r.id_recurso} className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-slate-700">{r.descripcion}</span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={r.activo}
                      onChange={(e) => cambiarActivo(r, e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-600 peer-checked:after:translate-x-full"></div>
                  </label>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {mostrarModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Agregar Recurso</h2>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Tipo</span>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="PERSONAL">Personal</option>
                  <option value="MAQUINARIA">Maquinaria</option>
                  <option value="EQUIPO">Equipo</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Descripción</span>
                <input
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Ej. Retroexcavadora CAT"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={agregar}
                  disabled={guardando}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
