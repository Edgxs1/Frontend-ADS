"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  FileSignature,
  FolderOpen,
  LogOut,
  Loader2,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSupabaseSession } from "@/providers/supabase-provider";
import type { Rol } from "@/providers/supabase-provider";
import { SelectorObra } from "@/components/layout/SelectorObra";

interface Seccion {
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  href?: string;
}

const SECCIONES_PORTAL: Seccion[] = [
  {
    titulo: "Obras",
    descripcion: "Consulta y seguimiento de las obras registradas.",
    icono: Building2,
  },
  {
    titulo: "Reportes",
    descripcion: "Reportes diarios y avances de la obra.",
    icono: ClipboardList,
  },
];

const SECCIONES_POR_ROL: Record<Rol, Seccion[]> = {
  Administrador: [
    {
      titulo: "Obras",
      descripcion: "Registra obras y administra las asignaciones de su equipo.",
      icono: Building2,
      href: "/dashboard/obras",
    },
    {
      titulo: "Usuarios",
      descripcion: "Alta de usuarios y asignación de roles.",
      icono: Users,
      href: "/dashboard/usuarios",
    },
    ...SECCIONES_PORTAL.filter((seccion) => seccion.titulo !== "Obras"),
  ],
  Superintendente: SECCIONES_PORTAL,
  Supervisor: [
    ...SECCIONES_PORTAL,
    {
      titulo: "Firmas",
      descripcion: "Validación y firma de reportes.",
      icono: FileSignature,
    },
  ],
  Residente: [
    {
      titulo: "Reportes diarios",
      descripcion: "Captura de reportes y avances de obra.",
      icono: ClipboardList,
    },
  ],
  Directivo: [
    {
      titulo: "Indicadores",
      descripcion: "Panel de seguimiento y resultados.",
      icono: BarChart3,
    },
    ...SECCIONES_PORTAL,
  ],
};

export default function DashboardPage() {
  const router = useRouter();
  const { session, usuario, rol, loading, loadingPerfil, signOut } =
    useSupabaseSession();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading || (session && loadingPerfil)) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden="true" />
      </main>
    );
  }

  if (!session) {
    return null;
  }

  const secciones = rol ? SECCIONES_POR_ROL[rol] : [];

  return (
    <main className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Obra Pública</p>
              <p className="text-xs text-slate-500">{usuario?.correo ?? session.user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <SelectorObra />
            <Link
              href="/dashboard/contrato"
              className="hidden items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
            >
              <FileSignature className="h-4 w-4" aria-hidden="true" />
              Datos Contractuales
            </Link>
            <Link
              href="/dashboard/partidas"
              className="hidden items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Partidas
            </Link>
            <Link
              href="/dashboard/catalogos"
              className="hidden items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Catálogos
            </Link>
            <Link
              href="/dashboard/expediente"
              className="hidden items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
            >
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
              Expediente
            </Link>
            <Link
              href="/dashboard/reportes"
              className="hidden items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Reportes Diarios
            </Link>
            {rol === "Administrador" ? (
              <>
                <Link
                  href="/dashboard/obras"
                  className="hidden items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
                >
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                  Obras
                </Link>
                <Link
                  href="/dashboard/usuarios"
                  className="hidden items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
                >
                  <Users className="h-4 w-4" aria-hidden="true" />
                  Usuarios
                </Link>
              </>
            ) : null}
            {rol ? (
              <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-700">
                {rol}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => signOut()}
              className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Panel{rol ? ` de ${rol}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Bienvenido. Selecciona un módulo para continuar.
        </p>

        {!rol ? (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>
              Tu cuenta aún no tiene un rol asignado. Contacta al administrador para
              habilitar los módulos correspondientes.
            </span>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {secciones.map((seccion) => {
              const Icono = seccion.icono;
              const contenido = (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
                    <Icono className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 font-semibold text-slate-900">
                    {seccion.titulo}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {seccion.descripcion}
                  </p>
                </>
              );

              if (seccion.href) {
                return (
                  <Link
                    key={seccion.titulo}
                    href={seccion.href}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    {contenido}
                  </Link>
                );
              }

              return (
                <div
                  key={seccion.titulo}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
                >
                  {contenido}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
