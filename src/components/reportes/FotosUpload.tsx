"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { subirFotos } from "@/services/reporte";
import type { FotoReporte } from "@/types";

const MAX_FOTOS = 6;
const MAX_BYTES = 10 * 1024 * 1024;

interface FotosUploadProps {
  idObra: string;
  idReporte: string;
  fotosActuales: number;
  onSubidas: (fotos: FotoReporte[]) => void;
}

export function FotosUpload({
  idObra,
  idReporte,
  fotosActuales,
  onSubidas,
}: FotosUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleArchivos = useCallback(
    async (archivos: FileList) => {
      setError(null);

      const lista = Array.from(archivos);

      if (lista.length === 0) {
        return;
      }

      if (fotosActuales + lista.length > MAX_FOTOS) {
        setError(`Un reporte admite un máximo de ${MAX_FOTOS} fotos.`);
        return;
      }

      const demasiadoGrande = lista.find((file) => file.size > MAX_BYTES);

      if (demasiadoGrande) {
        setError(`"${demasiadoGrande.name}" supera el límite de 10 MB.`);
        return;
      }

      const formData = new FormData();

      for (const file of lista) {
        formData.append("fotos", file);
      }

      setSubiendo(true);

      try {
        const subidas = await subirFotos(idObra, idReporte, formData);
        onSubidas(subidas);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudieron subir las fotos.",
        );
      } finally {
        setSubiendo(false);

        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [idObra, idReporte, fotosActuales, onSubidas],
  );

  const restantes = MAX_FOTOS - fotosActuales;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">Adjuntar evidencia fotográfica</h2>
      <p className="mt-1 text-sm text-slate-500">
        Puedes adjuntar hasta {MAX_FOTOS} imágenes (máx. 10 MB cada una). Te quedan{" "}
        {restantes}.
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        disabled={subiendo || restantes <= 0}
        onChange={(evento) => {
          if (evento.target.files) {
            void handleArchivos(evento.target.files);
          }
        }}
        className="mt-4 block w-full cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
      />

      {subiendo ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Subiendo fotos...
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!subiendo && restantes > 0 ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
          Selecciona una o varias imágenes para subirlas.
        </p>
      ) : null}
    </section>
  );
}
