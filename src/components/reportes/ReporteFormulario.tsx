"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { crearReporte, subirFotos } from "@/services/reporte";
import { getRecursosPorObra, type RecursoCatalogoObra } from "@/services/recurso";
import { getCatalogosPorObra } from "@/services/catalogo";
import type { CrearReporteInput, Reporte } from "@/types";
import type {
  EstadoEPP,
  EstadoSenalamiento,
  EstadoSuministro,
  EstadoSufrimiento,
  EstadoTiempo,
  EstadoTipoDia,
} from "@/types/reporte";

interface CatalogoConcepto {
  id_concepto: string;
  clave?: string;
  descripcion: string;
  unidad?: string;
  precio_unitario?: number;
  cantidad?: number;
}

const ESTADOS_TIPO_DIA = ["Laborado", "No laborado"] as const;
const ESTADOS_TIEMPO = ["Soleado", "Nublado", "Lluvia moderada", "Lluvia intensa"] as const;
const ESTADOS_SEÑALAMIENTO = ["Buen estado", "Mal estado", "Suficiente", "Insuficiente"] as const;
const ESTADOS_EPP = ["Completo", "Incompleto", "Suficiente", "Insuficiente"] as const;
const ESTADOS_SUMINISTRO = ["En existencia", "Sin materiales"] as const;
const ESTADOS_SUFRIMIENTO = ["Suficiente", "Insuficiente"] as const;

const MAX_FOTOS = 6;
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_MB = 5;
const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"];
const MENSAJE_MAX_FOTOS = "Máximo 6 fotografías por reporte diario";

interface FotoSeleccionada {
  id: string;
  archivo: File;
  url: string;
}

const esquemaCondicionante = z.object({
  condicionante: z.string().optional(),
  estatus: z.string().optional(),
  semaforo: z.string().optional(),
  frente: z.string().optional(),
});

const esquemaProblematica = z.object({
  fecha: z.string().optional(),
  problematica: z.string().optional(),
  acciones_a_seguir: z.string().optional(),
  status: z.string().optional(),
  solucionado: z.boolean().optional(),
});

const esquemaInterferencia = z.object({
  fecha: z.string().optional(),
  interferencia: z.string().optional(),
  status: z.string().optional(),
  fecha_solucion: z.string().optional(),
});

const esquemaConceptoRelevante = z.object({
  clave: z.string().optional(),
  concepto: z.string().optional(),
  fecha_inicio: z.string().optional(),
  fecha_termino: z.string().optional(),
  cantidad_proyecto: z.coerce.number().optional(),
  cantidad_acumulada: z.coerce.number().optional(),
  cantidad_adicional: z.coerce.number().optional(),
  unidad: z.string().optional(),
});

const esquemaRecursoUtilizado = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

const esquemaReporte = z.object({
  actividades_realizadas: z.string().optional().or(z.literal("")),
  notas_relevantes: z.string().optional().or(z.literal("")),
  hora_lluvia: z.string().optional().or(z.literal("")),
  tipo_dia: z.string().optional().or(z.literal("")),
  estado_tiempo: z.string().optional().or(z.literal("")),
  senalamiento_preventivo: z.string().optional().or(z.literal("")),
  equipo_proteccion: z.string().optional().or(z.literal("")),
  suministro_materiales: z.string().optional().or(z.literal("")),
  estado_personal: z.string().optional().or(z.literal("")),
  estado_maquinaria: z.string().optional().or(z.literal("")),
  estado_equipo: z.string().optional().or(z.literal("")),
  avance_general: z.coerce.number(),
  fecha_estimada_conclusion: z.string().min(1, "Requerida"),
  condicionantes: z.array(esquemaCondicionante).default([]),
  problematica: z.array(esquemaProblematica).default([]),
  interferencias: z.array(esquemaInterferencia).default([]),
  conceptos_relevantes: z.array(esquemaConceptoRelevante).default([]),
  recursos_utilizados: z.array(esquemaRecursoUtilizado).default([]),
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

type FormInput = z.input<typeof esquemaReporte>;
type FormValues = z.output<typeof esquemaReporte>;

const VALORES_INICIALES: FormValues = {
  actividades_realizadas: "",
  notas_relevantes: "",
  hora_lluvia: "",
  tipo_dia: undefined,
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
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
    setValue,
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(esquemaReporte),
    defaultValues: VALORES_INICIALES,
  });

  const {
    fields: condicionantesFields,
    append: appendCondicionante,
    remove: removeCondicionante,
  } = useFieldArray({ control, name: "condicionantes" });
  const {
    fields: problematicaFields,
    append: appendProblematica,
    remove: removeProblematica,
  } = useFieldArray({ control, name: "problematica" });
  const {
    fields: interferenciasFields,
    append: appendInterferencia,
    remove: removeInterferencia,
  } = useFieldArray({ control, name: "interferencias" });
  const {
    fields: conceptosFields,
    append: appendConcepto,
    remove: removeConcepto,
  } = useFieldArray({ control, name: "conceptos_relevantes" });
  const { replace: replaceRecursosTabla } = useFieldArray({
    control,
    name: "recursos_tabla",
  });

  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [catalogoConceptos, setCatalogoConceptos] = useState<CatalogoConcepto[]>([]);
  const [fotos, setFotos] = useState<FotoSeleccionada[]>([]);
  const [errorFotos, setErrorFotos] = useState<string | null>(null);
  const [avisoFotos, setAvisoFotos] = useState<string | null>(null);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const urlsFotos = useRef<Set<string>>(new Set());
  const inputFotos = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = urlsFotos.current;
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
      urls.clear();
    };
  }, []);

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
        replaceRecursosTabla(filas);
      })
      .catch(() => {
        if (activo) {
          replaceRecursosTabla([]);
        }
      });
    return () => {
      activo = false;
    };
  }, [idObra, replaceRecursosTabla]);

  const quitarFoto = (id: string) => {
    const foto = fotos.find((item) => item.id === id);

    if (foto) {
      URL.revokeObjectURL(foto.url);
      urlsFotos.current.delete(foto.url);
    }

    setFotos((prev) => prev.filter((item) => item.id !== id));
    setErrorFotos(null);
    setAvisoFotos(null);
  };

  const seleccionarFotos = (event: ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (archivos.length === 0) {
      return;
    }

    setErrorFotos(null);
    setAvisoFotos(null);

    const disponibles = MAX_FOTOS - fotos.length;

    if (disponibles <= 0) {
      setAvisoFotos(MENSAJE_MAX_FOTOS);
      return;
    }

    if (archivos.length > disponibles) {
      setAvisoFotos(MENSAJE_MAX_FOTOS);
    }

    const candidatas = archivos.slice(0, disponibles);
    const formatoInvalido = candidatas.find(
      (archivo) => !TIPOS_FOTO.includes(archivo.type),
    );

    if (formatoInvalido) {
      setErrorFotos(
        `"${formatoInvalido.name}" no es un formato permitido. Usa JPG, PNG o WEBP.`,
      );
      return;
    }

    const demasiadoGrande = candidatas.find(
      (archivo) => archivo.size > MAX_BYTES,
    );

    if (demasiadoGrande) {
      setErrorFotos(
        `"${demasiadoGrande.name}" supera el límite de ${MAX_MB} MB.`,
      );
      return;
    }

    const nuevas = candidatas.map((archivo, indice) => {
      const url = URL.createObjectURL(archivo);
      urlsFotos.current.add(url);

      return {
        id: `${Date.now()}-${indice}-${archivo.name}`,
        archivo,
        url,
      };
    });

    setFotos((prev) => [...prev, ...nuevas]);
  };

  const recursosTabla = useWatch({ control, name: "recursos_tabla" });
  const personal = (recursosTabla ?? []).filter(
    (recurso) => (recurso.tipo ?? "").toUpperCase() === "PERSONAL",
  );
  const maquinaria = (recursosTabla ?? []).filter(
    (recurso) => (recurso.tipo ?? "").toUpperCase() === "MAQUINARIA",
  );
  const equipo = (recursosTabla ?? []).filter(
    (recurso) => (recurso.tipo ?? "").toUpperCase() === "EQUIPO",
  );

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);

    try {
      const limpiar = <T,>(v: T | "" | undefined): T | undefined =>
        v === "" ? undefined : v;
      const recursos_utilizados = (valores.recursos_tabla ?? []).map((recurso) => {
        const tipo = (recurso.tipo ?? "").toString().toUpperCase();
        if (tipo === "PERSONAL") {
          return {
            id_recurso: recurso.id_recurso,
            tipo: recurso.tipo,
            descripcion: recurso.descripcion,
            cantidad_activa: Number(recurso.cantidad ?? 0),
            cantidad_inactiva: 0,
          };
        }
        return {
          id_recurso: recurso.id_recurso,
          tipo: recurso.tipo,
          descripcion: recurso.descripcion,
          cantidad_activa: Number(recurso.cantidad_activa ?? 0),
          cantidad_inactiva: Number(recurso.cantidad_inactiva ?? 0),
        };
      });

      const payload: CrearReporteInput = {
        actividades_realizadas: limpiar(valores.actividades_realizadas),
        notas_relevantes: limpiar(valores.notas_relevantes),
        hora_lluvia:
          valores.hora_lluvia === "" || valores.hora_lluvia == null
            ? undefined
            : Number(valores.hora_lluvia),
        tipo_dia: limpiar(valores.tipo_dia) as EstadoTipoDia | undefined,
        estado_tiempo: limpiar(valores.estado_tiempo) as EstadoTiempo | undefined,
        senalamiento_preventivo: limpiar(valores.senalamiento_preventivo) as
          | EstadoSenalamiento
          | undefined,
        equipo_proteccion: limpiar(valores.equipo_proteccion) as EstadoEPP | undefined,
        suministro_materiales: limpiar(valores.suministro_materiales) as
          | EstadoSuministro
          | undefined,
        estado_personal: limpiar(valores.estado_personal) as EstadoSufrimiento | undefined,
        estado_maquinaria: limpiar(valores.estado_maquinaria) as EstadoSufrimiento | undefined,
        estado_equipo: limpiar(valores.estado_equipo) as EstadoSufrimiento | undefined,
        avance_general: Number(valores.avance_general),
        fecha_estimada_conclusion: valores.fecha_estimada_conclusion,
        condicionantes: valores.condicionantes ?? [],
        problematica: valores.problematica ?? [],
        interferencias: valores.interferencias ?? [],
        conceptos_relevantes: valores.conceptos_relevantes ?? [],
        recursos_utilizados,
      };
      const reporte = await crearReporte(idObra, payload);
      let falloFotos = false;

      if (fotos.length > 0) {
        setSubiendoFotos(true);

        const formData = new FormData();
        for (const foto of fotos) {
          formData.append("fotos", foto.archivo);
        }

        try {
          await subirFotos(idObra, reporte.id_reporte, formData);
        } catch {
          falloFotos = true;
        } finally {
          setSubiendoFotos(false);
        }
      }

      onCreado(reporte);
      onCerrar();

      if (falloFotos) {
        toast.warning(
          "El reporte se guardó, pero falló la carga de algunas fotografías. Puedes reintentar subirlas aquí",
        );
        router.push(`/dashboard/reportes/${reporte.id_reporte}`);
      }
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
                <span className="mb-1 block text-sm font-medium text-slate-700">Horas de lluvia</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  {...register("hora_lluvia")}
                  placeholder="0"
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
                <span className="mb-1 block text-sm font-medium text-slate-700">Tipo de día</span>
                <select {...register("tipo_dia")} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10">
                  <option value="">Seleccionar</option>
                  {ESTADOS_TIPO_DIA.map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </label>
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
                      {personal.length === 0 ? <tr><td colSpan={2} className="px-4 py-3 text-center text-slate-500">Sin recursos</td></tr> : personal.map((r)=>{
                        const g = (recursosTabla??[]).findIndex((x)=>x.id_recurso===r.id_recurso);
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
                      {maquinaria.length===0?<tr><td colSpan={3} className="px-4 py-3 text-center text-slate-500">Sin recursos</td></tr>:maquinaria.map((r)=>{
                        const g=(recursosTabla??[]).findIndex((x)=>x.id_recurso===r.id_recurso);
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
                      {equipo.length===0?<tr><td colSpan={3} className="px-4 py-3 text-center text-slate-500">Sin recursos</td></tr>:equipo.map((r)=>{
                        const g=(recursosTabla??[]).findIndex((x)=>x.id_recurso===r.id_recurso);
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
              <button type="button" onClick={()=>appendCondicionante({condicionante:"",estatus:"",semaforo:"",frente:""})} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"><Plus className="h-3 w-3"/>Agregar</button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left font-medium text-slate-500">Condicionante</th><th className="px-3 py-2 text-left font-medium text-slate-500">Estatus</th><th className="px-3 py-2 text-left font-medium text-slate-500">Semáforo</th><th className="px-3 py-2 text-left font-medium text-slate-500">Frente</th><th className="px-3 py-2"></th></tr></thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {condicionantesFields.length===0?<tr><td colSpan={5} className="px-3 py-2 text-center text-slate-500">Sin registros</td></tr>:condicionantesFields.map((f,i)=><tr key={f.id}><td className="px-3 py-1"><input {...register(`condicionantes.${i}.condicionante`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input {...register(`condicionantes.${i}.estatus`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input {...register(`condicionantes.${i}.semaforo`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input {...register(`condicionantes.${i}.frente`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><button type="button" onClick={()=>removeCondicionante(i)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4"/></button></td></tr>)}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Problemática</h3>
              <button type="button" onClick={()=>appendProblematica({fecha:"",problematica:"",acciones_a_seguir:"",status:"",solucionado:false})} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"><Plus className="h-3 w-3"/>Agregar</button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left font-medium text-slate-500">Fecha</th><th className="px-3 py-2 text-left font-medium text-slate-500">Problemática</th><th className="px-3 py-2 text-left font-medium text-slate-500">Acciones a seguir</th><th className="px-3 py-2 text-left font-medium text-slate-500">Status</th><th className="px-3 py-2 text-left font-medium text-slate-500">Solucionado</th><th className="px-3 py-2"></th></tr></thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {problematicaFields.length===0?<tr><td colSpan={6} className="px-3 py-2 text-center text-slate-500">Sin registros</td></tr>:problematicaFields.map((f,i)=><tr key={f.id}><td className="px-3 py-1"><input type="date" {...register(`problematica.${i}.fecha`)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input {...register(`problematica.${i}.problematica`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input {...register(`problematica.${i}.acciones_a_seguir`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input {...register(`problematica.${i}.status`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input type="checkbox" {...register(`problematica.${i}.solucionado`)} /></td><td className="px-3 py-1"><button type="button" onClick={()=>removeProblematica(i)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4"/></button></td></tr>)}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Interferencias</h3>
              <button type="button" onClick={()=>appendInterferencia({fecha:"",interferencia:"",status:"",fecha_solucion:""})} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"><Plus className="h-3 w-3"/>Agregar</button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left font-medium text-slate-500">Fecha</th><th className="px-3 py-2 text-left font-medium text-slate-500">Interferencia</th><th className="px-3 py-2 text-left font-medium text-slate-500">Status</th><th className="px-3 py-2 text-left font-medium text-slate-500">Fecha de solución</th><th className="px-3 py-2"></th></tr></thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {interferenciasFields.length===0?<tr><td colSpan={5} className="px-3 py-2 text-center text-slate-500">Sin registros</td></tr>:interferenciasFields.map((f,i)=><tr key={f.id}><td className="px-3 py-1"><input type="date" {...register(`interferencias.${i}.fecha`)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input {...register(`interferencias.${i}.interferencia`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input {...register(`interferencias.${i}.status`)} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><input type="date" {...register(`interferencias.${i}.fecha_solucion`)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td><td className="px-3 py-1"><button type="button" onClick={()=>removeInterferencia(i)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4"/></button></td></tr>)}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Conceptos relevantes</h3>
              <button type="button" onClick={()=>appendConcepto({clave:"",concepto:"",fecha_inicio:"",fecha_termino:"",cantidad_proyecto:0,cantidad_acumulada:0,cantidad_adicional:0,unidad:""})} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"><Plus className="h-3 w-3"/>Agregar</button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left font-medium text-slate-500">Clave</th><th className="px-3 py-2 text-left font-medium text-slate-500">Concepto</th><th className="px-3 py-2 text-left font-medium text-slate-500">F. Inicio</th><th className="px-3 py-2 text-left font-medium text-slate-500">F. Término</th><th className="px-3 py-2 text-left font-medium text-slate-500">Cant. Proyecto</th><th className="px-3 py-2 text-left font-medium text-slate-500">Cant. Acumulada</th><th className="px-3 py-2 text-left font-medium text-slate-500">Cant. Adicional</th><th className="px-3 py-2 text-left font-medium text-slate-500">Unidad</th><th className="px-3 py-2"></th></tr></thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {conceptosFields.length===0?<tr><td colSpan={9} className="px-3 py-2 text-center text-slate-500">Sin registros</td></tr>:conceptosFields.map((f,i)=>{
                    const registroConcepto = register(`conceptos_relevantes.${i}.concepto`);
                    return <tr key={f.id}>
                      <td className="px-3 py-1"><input {...register(`conceptos_relevantes.${i}.clave`)} className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td>
                      <td className="px-3 py-1">
                        <input list="conceptos-list" {...registroConcepto} onChange={(evento)=>{
                          void registroConcepto.onChange(evento);
                          const concepto = catalogoConceptos.find((item)=>item.descripcion===evento.target.value);
                          if(concepto){ setValue(`conceptos_relevantes.${i}.clave`, concepto.clave||""); setValue(`conceptos_relevantes.${i}.unidad`, concepto.unidad||""); }
                        }} className="w-64 rounded-lg border border-slate-300 px-2 py-1 text-sm"/>
                      </td>
                      <td className="px-3 py-1"><input type="date" {...register(`conceptos_relevantes.${i}.fecha_inicio`)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td>
                      <td className="px-3 py-1"><input type="date" {...register(`conceptos_relevantes.${i}.fecha_termino`)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td>
                      <td className="px-3 py-1"><input type="number" step="0.01" {...register(`conceptos_relevantes.${i}.cantidad_proyecto`)} className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td>
                      <td className="px-3 py-1"><input type="number" step="0.01" {...register(`conceptos_relevantes.${i}.cantidad_acumulada`)} className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td>
                      <td className="px-3 py-1"><input type="number" step="0.01" {...register(`conceptos_relevantes.${i}.cantidad_adicional`)} className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td>
                      <td className="px-3 py-1"><input {...register(`conceptos_relevantes.${i}.unidad`)} className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm"/></td>
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

          <section className="space-y-4" aria-labelledby="evidencia-fotografica">
            <div>
              <h3 id="evidencia-fotografica" className="text-sm font-semibold text-slate-900">
                Evidencia Fotográfica (Opcional — Máximo 6 fotografías)
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Selecciona fotografías desde la cámara o la galería. Máximo {MAX_MB} MB por imagen.
              </p>
            </div>

            <input
              ref={inputFotos}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={isSubmitting || fotos.length >= MAX_FOTOS}
              onChange={seleccionarFotos}
              className="block w-full cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {avisoFotos ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {avisoFotos}
              </p>
            ) : null}

            {errorFotos ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorFotos}
              </p>
            ) : null}

            {fotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {fotos.map((foto) => (
                  <figure
                    key={foto.id}
                    className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <Image
                      src={foto.url}
                      alt={foto.archivo.name}
                      width={200}
                      height={96}
                      unoptimized
                      className="h-24 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => quitarFoto(foto.id)}
                      aria-label={`Quitar ${foto.archivo.name}`}
                      className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white transition hover:bg-red-600"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-xs text-slate-400">
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                Puedes seleccionar hasta {MAX_FOTOS} imágenes JPG, PNG o WEBP.
              </p>
            )}
          </section>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isSubmitting && subiendoFotos
                ? "Guardando reporte y subiendo fotografías..."
                : isSubmitting
                  ? "Guardando..."
                  : "Crear reporte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
