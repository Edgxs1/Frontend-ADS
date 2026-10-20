"use client";

import { useState } from "react";
import { ImageOff, Loader2, Trash2 } from "lucide-react";
import { eliminarFoto } from "@/services/reporte";
import type { FotoReporte } from "@/types";

interface GaleriaFotosProps {
  idObra: string;
  idReporte: string;
  fotos: FotoReporte[];
  puedeEliminar: boolean;
  onEliminada: (idFoto: string) => void;
}

export function GaleriaFotos({
  idObra,
  idReporte,
  fotos,
  puedeEliminar,
  onEliminada,
}: GaleriaFotosProps) {
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEliminar = async (idFoto: string) => {
    setEliminando(idFoto);
    setError(null);

    try {
      await eliminarFoto(idObra, idReporte, idFoto);
      onEliminada(idFoto);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo eliminar la foto.",
      );
    } finally {
      setEliminando(null);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">Galería de evidencia</h2>
      <p className="mt-1 text-sm text-slate-500">
        {fotos.length === 0
          ? "Este reporte aún no tiene fotos."
          : `${fotos.length} foto(s) cargada(s).`}
      </p>

      {error ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {fotos.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-12 text-slate-400">
          <ImageOff className="h-6 w-6" aria-hidden="true" />
          <span className="text-sm">Sin evidencia fotográfica</span>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {fotos.map((foto) => (
            <figure
              key={foto.id_foto}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
            >
              <a
                href={foto.url_foto}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.url_foto}
                  alt="Evidencia del reporte"
                  className="h-40 w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
              </a>

              {puedeEliminar ? (
                <button
                  type="button"
                  onClick={() => handleEliminar(foto.id_foto)}
                  disabled={eliminando === foto.id_foto}
                  className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-xs font-medium text-white shadow transition hover:bg-red-700 disabled:opacity-60"
                  aria-label="Eliminar foto"
                >
                  {eliminando === foto.id_foto ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Eliminar
                </button>
              ) : null}
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
