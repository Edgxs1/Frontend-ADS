"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Loader2,
  UserRound,
} from "lucide-react";
import { getFotos, getReportes } from "@/services/reporte";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { useObra } from "@/providers/obra-provider";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
import { formatearFecha } from "@/lib/format";
import { EstadoBadge } from "./EstadoBadge";
import { FotosUpload } from "./FotosUpload";
import { GaleriaFotos } from "./GaleriaFotos";
import type { FotoReporte, Reporte } from "@/types";

interface DatosCargados {
  idObra: string;
  idReporte: string;
  reporte: Reporte | null;
  fotos: FotoReporte[];
  error: string | null;
}

interface DatosReporteDetalleProps {
  idReporte: string;
}

export function DatosReporteDetalle({ idReporte }: DatosReporteDetalleProps) {
  const { obraActiva } = useObra();
  const { rol } = useSupabaseSession();
  const [datos, setDatos] = useState<DatosCargados | null>(null);

  const idObra = obraActiva?.id_obra ?? null;

  useEffect(() => {
    if (!idObra) {
      return;
    }

    const obraSolicitada = idObra;
    let activo = true;

    Promise.all([
      getReportes(obraSolicitada),
      getFotos(obraSolicitada, idReporte),
    ])
      .then(([reportes, fotos]) => {
        if (!activo) return;

        const reporte =
          reportes.find((item) => item.id_reporte === idReporte) ?? null;

        setDatos({
          idObra: obraSolicitada,
          idReporte,
          reporte,
          fotos,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (activo) {
          setDatos({
            idObra: obraSolicitada,
            idReporte,
            reporte: null,
            fotos: [],
            error:
              err instanceof Error ? err.message : "Ocurrió un error inesperado.",
          });
        }
      });

    return () => {
      activo = false;
    };
  }, [idObra, idReporte]);

  const datosValidos = useMemo(
    () =>
      datos && idObra && datos.idObra === idObra && datos.idReporte === idReporte
        ? datos
        : null,
    [datos, idObra, idReporte],
  );

  const cargando = idObra !== null && datosValidos === null;
  const reporte = datosValidos?.reporte ?? null;
  const fotos = datosValidos?.fotos ?? [];
  const error = datosValidos?.error ?? null;

  const esSupervisor = rol === "Supervisor";
  const reporteValidado = reporte?.estado === "Validado";

  if (!obraActiva) {
    return <SinObraSeleccionada />;
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden="true" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{error}</span>
      </div>
    );
  }

  if (!reporte) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        No se encontró el reporte solicitado en esta obra.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Detalle del reporte
          </h1>
          <EstadoBadge estado={reporte.estado} />
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-2 text-sm">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <div>
              <dt className="text-slate-500">Fecha</dt>
              <dd className="font-medium text-slate-800">
                {formatearFecha(reporte.created_at)}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <div>
              <dt className="text-slate-500">Creador</dt>
              <dd className="font-medium text-slate-800">
                {reporte.creador_correo ?? "—"}
              </dd>
            </div>
          </div>
        </dl>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Avance general</h2>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
              {reporte.avance_general ?? "—"} {reporte.avance_general != null ? "%" : ""}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Fecha estimada de conclusión</h2>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
              {reporte.fecha_estimada_conclusion ?? "—"}
            </p>
          </div>
        </div>

        {reporte.actividades_realizadas ? (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-slate-900">Actividades realizadas</h2>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{reporte.actividades_realizadas}</p>
          </div>
        ) : null}
        {reporte.notas_relevantes ? (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-slate-900">Notas relevantes</h2>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{reporte.notas_relevantes}</p>
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Estado del tiempo</h2>
            <p className="mt-1 text-sm text-slate-600">{reporte.estado_tiempo ?? "—"}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Hora de lluvia</h2>
            <p className="mt-1 text-sm text-slate-600">{reporte.hora_lluvia ?? "—"}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Señalamiento preventivo</h2>
            <p className="mt-1 text-sm text-slate-600">{reporte.senalamiento_preventivo ?? "—"}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">EPP</h2>
            <p className="mt-1 text-sm text-slate-600">{reporte.equipo_proteccion ?? "—"}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Suministro de materiales</h2>
            <p className="mt-1 text-sm text-slate-600">{reporte.suministro_materiales ?? "—"}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Estado personal/maquinaria/equipo</h2>
            <p className="mt-1 text-sm text-slate-600">{[reporte.estado_personal, reporte.estado_maquinaria, reporte.estado_equipo].filter(Boolean).join(" / ") || "—"}</p>
          </div>
        </div>
      </section>

      {esSupervisor && !reporteValidado ? (
        <FotosUpload
          idObra={obraActiva.id_obra}
          idReporte={reporte.id_reporte}
          fotosActuales={fotos.length}
          onSubidas={(nuevas) => {
            setDatos((prev) => {
              if (!prev || prev.idReporte !== reporte.id_reporte) return prev;
              return { ...prev, fotos: [...prev.fotos, ...nuevas] };
            });
          }}
        />
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Recursos utilizados</h2>
        {Array.isArray(reporte.recursos_utilizados) && reporte.recursos_utilizados.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Tipo</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Descripción</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Activo</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Inactivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {reporte.recursos_utilizados.map((r:any, idx:number)=>(
                  <tr key={idx}>
                    <td className="px-4 py-2 text-slate-700">{r?.tipo ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-700">{r?.descripcion ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{r?.cantidad_activa ?? r?.cantidad ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{r?.cantidad_inactiva ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-slate-500">Sin registros</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Condicionantes</h2>
        {Array.isArray(reporte.condicionantes) && reporte.condicionantes.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left font-medium text-slate-500">Condicionante</th><th className="px-3 py-2 text-left font-medium text-slate-500">Estatus</th><th className="px-3 py-2 text-left font-medium text-slate-500">Semáforo</th><th className="px-3 py-2 text-left font-medium text-slate-500">Frente</th></tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white">{reporte.condicionantes.map((c:any,idx:number)=><tr key={idx}><td className="px-3 py-1 text-slate-700">{c?.condicionante??"—"}</td><td className="px-3 py-1 text-slate-600">{c?.estatus??"—"}</td><td className="px-3 py-1 text-slate-600">{c?.semaforo??"—"}</td><td className="px-3 py-1 text-slate-600">{c?.frente??"—"}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="text-sm text-slate-500">Sin registros</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Problemática</h2>
        {Array.isArray(reporte.problematica) && reporte.problematica.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left font-medium text-slate-500">Fecha</th><th className="px-3 py-2 text-left font-medium text-slate-500">Problemática</th><th className="px-3 py-2 text-left font-medium text-slate-500">Acciones a seguir</th><th className="px-3 py-2 text-left font-medium text-slate-500">Status</th><th className="px-3 py-2 text-left font-medium text-slate-500">Solucionado</th></tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white">{reporte.problematica.map((p:any,idx:number)=><tr key={idx}><td className="px-3 py-1 text-slate-600">{p?.fecha??"—"}</td><td className="px-3 py-1 text-slate-700">{p?.problematica??"—"}</td><td className="px-3 py-1 text-slate-600">{p?.acciones_a_seguir??"—"}</td><td className="px-3 py-1 text-slate-600">{p?.status??"—"}</td><td className="px-3 py-1 text-slate-600">{p?.solucionado?"Sí":"No"}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="text-sm text-slate-500">Sin registros</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Interferencias</h2>
        {Array.isArray(reporte.interferencias) && reporte.interferencias.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left font-medium text-slate-500">Fecha</th><th className="px-3 py-2 text-left font-medium text-slate-500">Interferencia</th><th className="px-3 py-2 text-left font-medium text-slate-500">Status</th><th className="px-3 py-2 text-left font-medium text-slate-500">Fecha de solución</th></tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white">{reporte.interferencias.map((i:any,idx:number)=><tr key={idx}><td className="px-3 py-1 text-slate-600">{i?.fecha??"—"}</td><td className="px-3 py-1 text-slate-700">{i?.interferencia??"—"}</td><td className="px-3 py-1 text-slate-600">{i?.status??"—"}</td><td className="px-3 py-1 text-slate-600">{i?.fecha_solucion??"—"}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="text-sm text-slate-500">Sin registros</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Conceptos relevantes</h2>
        {Array.isArray(reporte.conceptos_relevantes) && reporte.conceptos_relevantes.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left font-medium text-slate-500">Clave</th><th className="px-3 py-2 text-left font-medium text-slate-500">Concepto</th><th className="px-3 py-2 text-left font-medium text-slate-500">F. Inicio</th><th className="px-3 py-2 text-left font-medium text-slate-500">F. Término</th><th className="px-3 py-2 text-left font-medium text-slate-500">Cant. Proyecto</th><th className="px-3 py-2 text-left font-medium text-slate-500">Cant. Acumulada</th><th className="px-3 py-2 text-left font-medium text-slate-500">Cant. Adicional</th><th className="px-3 py-2 text-left font-medium text-slate-500">Unidad</th></tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white">{reporte.conceptos_relevantes.map((c:any,idx:number)=><tr key={idx}><td className="px-3 py-1 text-slate-700">{c?.clave??"—"}</td><td className="px-3 py-1 text-slate-700">{c?.concepto??"—"}</td><td className="px-3 py-1 text-slate-600">{c?.fecha_inicio??"—"}</td><td className="px-3 py-1 text-slate-600">{c?.fecha_termino??"—"}</td><td className="px-3 py-1 text-slate-600">{c?.cantidad_proyecto??"—"}</td><td className="px-3 py-1 text-slate-600">{c?.cantidad_acumulada??"—"}</td><td className="px-3 py-1 text-slate-600">{c?.cantidad_adicional??"—"}</td><td className="px-3 py-1 text-slate-600">{c?.unidad??"—"}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="text-sm text-slate-500">Sin registros</p>}
      </section>

      <GaleriaFotos
        idObra={obraActiva.id_obra}
        idReporte={reporte.id_reporte}
        fotos={fotos}
        puedeEliminar={esSupervisor && !reporteValidado}
        onEliminada={(idFoto) => {
          setDatos((prev) => {
            if (!prev || prev.idReporte !== reporte.id_reporte) return prev;
            return {
              ...prev,
              fotos: prev.fotos.filter((foto) => foto.id_foto !== idFoto),
            };
          });
        }}
      />
    </div>
  );
}
