"use client";

import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { crearReporte } from "@/services/reporte";
import { getRecursosPorObra, type RecursoCatalogoObra } from "@/services/recurso";
import { getCatalogosPorObra } from "@/services/catalogo";
import type { Reporte } from "@/types";

interface CatalogoConcepto {
  id_concepto: string;
  clave?: string;
  descripcion: string;
  unidad?: string;
  precio_unitario?: number;
  cantidad?: number;
}

const ESTADOS_TIEMPO = ["Soleado", "Nublado", "Lluvia moderada", "Lluvia intensa"] as const;
const ESTADOS_SEÑALAMIENTO = ["Buen estado", "Mal estado", "Suficiente", "Insuficiente"] as const;
const ESTADOS_EPP = ["Completo", "Incompleto", "Suficiente", "Insuficiente"] as const;
const ESTADOS_SUMINISTRO = ["En existencia", "Sin materiales"] as const;
const ESTADOS_SUFRIMIENTO = ["Suficiente", "Insuficiente"] as const;

const esquemaReporte = z.object({
  actividades_realizadas: z.string().optional().or(z.literal("")),
  notas_relevantes: z.string().optional().or(z.literal("")),
  hora_lluvia: z.string().optional().or(z.literal("")),
  estado_tiempo: z.string().optional().or(z.literal("")),
  senalamiento_preventivo: z.string().optional().or(z.literal("")),
  equipo_proteccion: z.string().optional().or(z.literal("")),
  suministro_materiales: z.string().optional().or(z.literal("")),
  estado_personal: z.string().optional().or(z.literal("")),
  estado_maquinaria: z.string().optional().or(z.literal("")),
  estado_equipo: z.string().optional().or(z.literal("")),
  avance_general: z.coerce.number(),
  fecha_estimada_conclusion: z.string().min(1, "Requerida"),
  condicionantes: z.array(z.any()).default([]),
  problematica: z.array(z.any()).default([]),
  interferencias: z.array(z.any()).default([]),
  conceptos_relevantes: z.array(z.any()).default([]),
  recursos_utilizados: z.array(z.any()).default([]),
  recursos_tabla: z
    .array(
      z.object({
        id_recurso: z.string(),
        tipo: z.string().nullable().optional(),
        descripcion: z.string(),
        cantidad: z.coerce.number().optional(),
        cantidad_activa: z.coerce.number().optional(),
        cantidad_inactiva: z.coerce.number().optional(),
      }),
    )
    .default([]),
});

type FormValues = z.infer<typeof esquemaReporte>;

const VALORES_INICIALES: FormValues = {
  actividades_realizadas: "",
  notas_relevantes: "",
  hora_lluvia: "",
  estado_tiempo: undefined,
  senalamiento_preventivo: undefined,
  equipo_proteccion: undefined,
  suministro_materiales: undefined,
  estado_personal: undefined,
  estado_maquinaria: undefined,
  estado_equipo: undefined,
  avance_general: 0,
  fecha_estimada_conclusion: "",
  condicionantes: [],
  problematica: [],
  interferencias: [],
  conceptos_relevantes: [],
  recursos_utilizados: [],
  recursos_tabla: [],
};

interface ReporteFormularioProps {
  idObra: string;
  onCreado: (reporte: Reporte) => void;
  onCerrar: () => void;
}

export function ReporteFormulario({
  idObra,
  onCreado,
  onCerrar,
}: ReporteFormularioProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(esquemaReporte) as any,
    defaultValues: VALORES_INICIALES,
  });

  const {
    fields: condicionantesFields,
    append: appendCondicionante,
    remove: removeCondicionante,
  } = useFieldArray({ control, name: "condicionantes" as any });
  const {
    fields: problematicaFields,
    append: appendProblematica,
    remove: removeProblematica,
  } = useFieldArray({ control, name: "problematica" as any });
  const {
    fields: interferenciasFields,
    append: appendInterferencia,
    remove: removeInterferencia,
  } = useFieldArray({ control, name: "interferencias" as any });
  const {
    fields: conceptosFields,
    append: appendConcepto,
    remove: removeConcepto,
  } = useFieldArray({ control, name: "conceptos_relevantes" as any });
  const {
    fields: recursosTablaFields,
    replace: replaceRecursosTabla,
  } = useFieldArray({ control, name: "recursos_tabla" as any });

  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [catalogoConceptos, setCatalogoConceptos] = useState<CatalogoConcepto[]>([]);
  const [recursosCargados, setRecursosCargados] = useState(false);

  useEffect(() => {
    let activo = true;
    getCatalogosPorObra(idObra)
      .then((data) => {
        if (activo) setCatalogoConceptos(data);
      })
      .catch(() => {
        if (activo) setCatalogoConceptos([]);
      });
    return () => {
      activo = false;
    };
  }, [idObra]);

  useEffect(() => {
    let activo = true;
    getRecursosPorObra(idObra)
      .then((recursos: RecursoCatalogoObra[]) => {
        if (!activo) return;
        const filas = recursos.map((recurso) => ({
          id_recurso: recurso.id_recurso,
          tipo: recurso.tipo,
          descripcion: recurso.descripcion,
          cantidad: 0,
          cantidad_activa: 0,
          cantidad_inactiva: 0,
        }));
        replaceRecursosTabla(filas as any);
        setRecursosCargados(true);
      })
      .catch(() => {
        if (activo) {
          replaceRecursosTabla([] as any);
          setRecursosCargados(true);
        }
      });
    return () => {
      activo = false;
    };
  }, [idObra, replaceRecursosTabla]);

  const recursosTabla = watch("recursos_tabla") as any[] | undefined;
  const personal = useMemo(
    () => (recursosTabla ?? []).filter((r) => (r?.tipo ?? "").toUpperCase() === "PERSONAL"),
    [recursosTabla],
  );
  const maquinaria = useMemo(
    () => (recursosTabla ?? []).filter((r) => (r?.tipo ?? "").toUpperCase() === "MAQUINARIA"),
    [recursosTabla],
  );
  const equipo = useMemo(
    () => (recursosTabla ?? []).filter((r) => (r?.tipo ?? "").toUpperCase() === "EQUIPO"),
    [recursosTabla],
  );

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);

    try {
      const limpiar = <T,>(v: T | "" | undefined) => (v === "" ? undefined : v);
      const recursos_utilizados = (valores.recursos_tabla ?? []).map((r: any) => {
        const tipo = (r.tipo ?? "").toString().toUpperCase();
        if (tipo === "PERSONAL") {
          return {
            id_recurso: r.id_recurso,
            tipo: r.tipo,
            descripcion: r.descripcion,
            cantidad_activa: Number(r.cantidad ?? 0),
            cantidad_inactiva: 0,
          };
        }
        return {
          id_recurso: r.id_recurso,
          tipo: r.tipo,
          descripcion: r.descripcion,
          cantidad_activa: Number(r.cantidad_activa ?? 0),
          cantidad_inactiva: Number(r.cantidad_inactiva ?? 0),
        };
      });

      const payload = {
        actividades_realizadas: limpiar(valores.actividades_realizadas),
        notas_relevantes: limpiar(valores.notas_relevantes),
        hora_lluvia: limpiar(valores.hora_lluvia),
        estado_tiempo: limpiar(valores.estado_tiempo) as any,
        senalamiento_preventivo: limpiar(valores.senalamiento_preventivo) as any,
        equipo_proteccion: limpiar(valores.equipo_proteccion) as any,
        suministro_materiales: limpiar(valores.suministro_materiales) as any,
        estado_personal: limpiar(valores.estado_personal) as any,
        estado_maquinaria: limpiar(valores.estado_maquinaria) as any,
        estado_equipo: limpiar(valores.estado_equipo) as any,
        avance_general: Number(valores.avance_general),
        fecha_estimada_conclusion: valores.fecha_estimada_conclusion,
        condicionantes: valores.condicionantes ?? [],
        problematica: valores.problematica ?? [],
        interferencias: valores.interferencias ?? [],
        conceptos_relevantes: valores.conceptos_relevantes ?? [],
        recursos_utilizados,
      };
      const reporte = await crearReporte(idObra, payload as any);
      onCreado(reporte);
      onCerrar();
    } catch (error) {
      setErrorServidor(
        error instanceof Error ? error.message : "Ocurrió un error inesperado.",
      );
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Crear reporte diario"
        className="max-h-[95dvh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-900">Crear reporte diario</h2>
            <p className="mt-1 text-sm text-slate-500">
              Registra las condiciones y el avance de la jornada.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-6" noValidate>
          {errorServidor ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorServidor}
            </p>
          ) : null}

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Actividades y avance</h3>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Actividades realizadas</span>
              <textarea
                {...register("actividades_realizadas")}
                rows={3}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Notas relevantes</span>
              <textarea
                {...register("notas_relevantes")}
                rows={2}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Hora de lluvia</span>
                <input
                  {...register("hora_lluvia")}
                  placeholder="HH:MM"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Avance general (%)</span>
                <input
                  type="number"
                  step="0.01"
                  {...register("avance_general")}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Fecha estimada de conclusión</span>
                <input
                  type="date"
                  {...register("fecha_estimada_conclusion")}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Condiciones de la jornada</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Estado del tiempo</span>
                <select {...register("estado_tiempo")} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10">
                  <option value="">Seleccionar</option>
                  {ESTADOS_TIEMPO.map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Señalamiento preventivo</span>
                <select {...register("senalamiento_preventivo")} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10">
                  <option value="">Seleccionar</option>
                  {ESTADOS_SEÑALAMIENTO.map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Equipo de protección personal</span>
                <select {...register("equipo_proteccion")} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10">
                  <option value="">Seleccionar</option>
                  {ESTADOS_EPP.map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Suministro de materiales</span>
                <select {...register("suministro_materiales")} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10">
                  <option value="">Seleccionar</option>
                  {ESTADOS_SUMINISTRO.map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Estado de personal</span>
                <select {...register("estado_personal")} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10">
                  <option value="">Seleccionar</option>
                  {ESTADOS_SUFRIMIENTO.map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Estado de maquinaria</span>
                <select {...register("estado_maquinaria")} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10">
                  <option value="">Seleccionar</option>
                  {ESTADOS_SUFRIMIENTO.map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Estado de equipo</span>
                <select {...register("estado_equipo")} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10">
                  <option value="">Seleccionar</option>
                  {ESTADOS_SUFRIMIENTO.map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Recursos utilizados</h3>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Personal</p>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50"><tr><th className="px-4 py-2 text-left font-medium text-slate-500">Descripción</th><th className="px-4 py-2 text-left font-medium text-slate-500">Cantidad</th></tr></thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {personal.length === 0 ? <tr><td colSpan={2} className="px-4 py-3 text-center text-slate-500">Sin recursos</td></tr> : personal.map((r:any)=>{
                        const g = (recursosTabla??[]).findIndex((x:any)=>x.id_recurso===r.id_recurso);
                        return <tr key={r.id_recurso}><td className="px-4 py-2 text-slate-700">{r.descripcion}</td><td className="px-4 py-2"><input type="number" min={0} {...register(`recursos_tabla.${g}.cantidad` as const)} className="w-32 rounded-lg border border-slate-300 px-2 py-1 text-sm" /></td></tr>
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Maquinaria</p>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50"><tr><th className="px-4 py-2 text-left font-medium text-slate-500">Descripción</th><th className="px-4 py-2 text-left font-medium text-slate-500">Activo</th><th className="px-4 py-2 text-left font-medium text-slate-500">Inactivo</th></tr></thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {maquinaria.length===0?<tr><td colSpan={3} className="px-4 py-3 text-center text-slate-500">Sin recursos</td></tr>:maquinaria.map((r:any)=>{
                        const g=(recursosTabla??[]).findIndex((x:any)=>x.id_recurso===r.id_recurso);
                        return <tr key={r.id_recurso}><td className="px-4 py-2 text-slate-700">{r.descripcion}</td><td className="px-4 py-2"><input type="number" min={0} {...register(`recursos_tabla.${g}.cantidad_activa` as const)} className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm" /></td><td className="px-4 py-2"><input type="number" min={0} {...register(`recursos_tabla.${g}.cantidad_inactiva` as const)} className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm" /></td></tr>
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Equipo</p>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50"><tr><th className="px-4 py-2 text-left font-medium text-slate-500">Descripción</th><th className="px-4 py-2 text-left font-medium text-slate-500">Activo</th><th className="px-4 py-2 text-left font-medium text-slate-500">Inactivo</th></tr></thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {equipo.length===0?<tr><td colSpan={3} className="px-4 py-3 text-center text-slate-500">Sin recursos</td></tr>:equipo.map((r:any)=>{
                        const g=(recursosTabla??[]).findIndex((x:any)=>x.id_recurso===r.id_recurso);
                        return <tr key={r.id_recurso}><td className="px-4 py-2 text-slate-700">{r.descripcion}</td><td className="px-4 py-2"><input type="number" min={0} {...register(`recursos_tabla.${g}.cantidad_activa` as const)} className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm" /></td><td className="px-4 py-2"><input type="number" min={0} {...register(`recursos_tabla.${g}.cantidad_inactiva` as const)} className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm" /></td></tr>
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Condicionantes</h3>
              <button type="button" onClick={()=>appendCondicionante({condicionante:"",estatus:"",semaforo:"",frente:""} as any)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"><Plus className="h-3 w-3"/>Agregar</button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left font-medium text-slate-500">Condicionante</th><th className="px-3 py-2 text-left font-medium text-slate-500">Estatus</th><th className="px-3 py-2 text-left font-medium text-slate-500">Semáforo</th><th className="px-3 py-2 text-left font-medium text-slate-500">Frente</th><th className="px-3 py-2"></th></tr></thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {condicionantesFields.length===0?<tr><td colSpan={5} className="px-3 py-2 text-center text-slate-500">Sin registros</td></tr>:condicionantesFields.map((f:any,i:number)=><tr key={f.id}><td className="px-3 py-1"><input {...(register as any)(`condicionantes.${i}.condicionante`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input {...(register as any)(`condicionantes.${i}.estatus`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input {...(register as any)(`condicionantes.${i}.semaforo`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input {...(register as any)(`condicionantes.${i}.frente`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><button type="button" onClick={()=>removeCondicionante(i)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4"/></button></td></tr>)}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Problemática</h3>
              <button type="button" onClick={()=>appendProblematica({fecha:"",problematica:"",acciones_a_seguir:"",status:"",solucionado:false} as any)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"><Plus className="h-3 w-3"/>Agregar</button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left font-medium text-slate-500">Fecha</th><th className="px-3 py-2 text-left font-medium text-slate-500">Problemática</th><th className="px-3 py-2 text-left font-medium text-slate-500">Acciones a seguir</th><th className="px-3 py-2 text-left font-medium text-slate-500">Status</th><th className="px-3 py-2 text-left font-medium text-slate-500">Solucionado</th><th className="px-3 py-2"></th></tr></thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {problematicaFields.length===0?<tr><td colSpan={6} className="px-3 py-2 text-center text-slate-500">Sin registros</td></tr>:problematicaFields.map((f:any,i:number)=><tr key={f.id}><td className="px-3 py-1"><input type="date" {...(register as any)(`problematica.${i}.fecha`)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input {...(register as any)(`problematica.${i}.problematica`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input {...(register as any)(`problematica.${i}.acciones_a_seguir`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input {...(register as any)(`problematica.${i}.status`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input type="checkbox" {...(register as any)(`problematica.${i}.solucionado`)} /></td><td className="px-3 py-1"><button type="button" onClick={()=>removeProblematica(i)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4"/></button></td></tr>)}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Interferencias</h3>
              <button type="button" onClick={()=>appendInterferencia({fecha:"",interferencia:"",status:"",fecha_solucion:""} as any)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"><Plus className="h-3 w-3"/>Agregar</button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left font-medium text-slate-500">Fecha</th><th className="px-3 py-2 text-left font-medium text-slate-500">Interferencia</th><th className="px-3 py-2 text-left font-medium text-slate-500">Status</th><th className="px-3 py-2 text-left font-medium text-slate-500">Fecha de solución</th><th className="px-3 py-2"></th></tr></thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {interferenciasFields.length===0?<tr><td colSpan={5} className="px-3 py-2 text-center text-slate-500">Sin registros</td></tr>:interferenciasFields.map((f:any,i:number)=><tr key={f.id}><td className="px-3 py-1"><input type="date" {...(register as any)(`interferencias.${i}.fecha`)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input {...(register as any)(`interferencias.${i}.interferencia`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input {...(register as any)(`interferencias.${i}.status`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input type="date" {...(register as any)(`interferencias.${i}.fecha_solucion`)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><button type="button" onClick={()=>removeInterferencia(i)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4"/></button></td></tr>)}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Conceptos relevantes</h3>
              <button type="button" onClick={()=>appendConcepto({clave:"",concepto:"",fecha_inicio:"",fecha_termino:"",cantidad_proyecto:0,cantidad_acumulada:0,cantidad_adicional:0,unidad:""} as any)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"><Plus className="h-3 w-3"/>Agregar</button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left font-medium text-slate-500">Clave</th><th className="px-3 py-2 text-left font-medium text-slate-500">Concepto</th><th className="px-3 py-2 text-left font-medium text-slate-500">F. Inicio</th><th className="px-3 py-2 text-left font-medium text-slate-500">F. Término</th><th className="px-3 py-2 text-left font-medium text-slate-500">Cant. Proyecto</th><th className="px-3 py-2 text-left font-medium text-slate-500">Cant. Acumulada</th><th className="px-3 py-2 text-left font-medium text-slate-500">Cant. Adicional</th><th className="px-3 py-2 text-left font-medium text-slate-500">Unidad</th><th className="px-3 py-2"></th></tr></thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {conceptosFields.length===0?<tr><td colSpan={9} className="px-3 py-2 text-center text-slate-500">Sin registros</td></tr>:conceptosFields.map((f:any,i:number)=>{
                    return <tr key={f.id}>
                      <td className="px-3 py-1"><input {...(register as any)(`conceptos_relevantes.${i}.clave`)} className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td>
                      <td className="px-3 py-1">
                        <input list={`conceptos-list`} {...(register as any)(`conceptos_relevantes.${i}.concepto`)} onChange={(e:any)=>{
                          const c = catalogoConceptos.find((x:any)=>x.descripcion===e.target.value);
                          if(c){ (setValue as any)(`conceptos_relevantes.${i}.clave`, c.clave||""); (setValue as any)(`conceptos_relevantes.${i}.unidad`, c.unidad||""); }
                        }} className="w-64 rounded-lg border border-slate-300 px-2 py-1 text-sm"/>
                      </td>
                      <td className="px-3 py-1"><input type="date" {...(register as any)(`conceptos_relevantes.${i}.fecha_inicio`)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td>
                      <td className="px-3 py-1"><input type="date" {...(register as any)(`conceptos_relevantes.${i}.fecha_termino`)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td>
                      <td className="px-3 py-1"><input type="number" step="0.01" {...(register as any)(`conceptos_relevantes.${i}.cantidad_proyecto`)} className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td>
                      <td className="px-3 py-1"><input type="number" step="0.01" {...(register as any)(`conceptos_relevantes.${i}.cantidad_acumulada`)} className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td>
                      <td className="px-3 py-1"><input type="number" step="0.01" {...(register as any)(`conceptos_relevantes.${i}.cantidad_adicional`)} className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td>
                      <td className="px-3 py-1"><input {...(register as any)(`conceptos_relevantes.${i}.unidad`)} className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td>
                      <td className="px-3 py-1"><button type="button" onClick={()=>removeConcepto(i)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4"/></button></td>
                    </tr>
                  })}
                </tbody>
              </table>
            </div>
            <datalist id="conceptos-list">
              {catalogoConceptos.map((c)=><option key={c.id_concepto} value={c.descripcion}>{c.clave}</option>)}
            </datalist>
          </section>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Crear reporte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
