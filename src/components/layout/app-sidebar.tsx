"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  ChevronRight,
  ClipboardList,
  FileSignature,
  FolderOpen,
  Home,
  LayoutDashboard,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSupabaseSession } from "@/providers/supabase-provider";
import type { Rol } from "@/providers/supabase-provider";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  titulo: string;
  href: string;
  icono: LucideIcon;
  exact?: boolean;
}

interface NavGrupo {
  titulo: string;
  items: NavItem[];
  rolesPermitidos?: Rol[];
}

const GRUPOS_NAV: NavGrupo[] = [
  {
    titulo: "General",
    items: [
      {
        titulo: "Inicio",
        href: "/dashboard",
        icono: LayoutDashboard,
        exact: true,
      },
      {
        titulo: "Mi perfil",
        href: "/dashboard/perfil",
        icono: UserRound,
        exact: true,
      },
    ],
  },
  {
    titulo: "Operación de Obra",
    items: [
      {
        titulo: "Reportes Diarios",
        href: "/dashboard/reportes",
        icono: ClipboardList,
      },
      {
        titulo: "Bitácora Electrónica",
        href: "/dashboard/bitacora",
        icono: BookOpen,
      },
    ],
  },
  {
    titulo: "Control Financiero",
    items: [
      {
        titulo: "Catálogos de Conceptos",
        href: "/dashboard/catalogos",
        icono: Calculator,
      },
      {
        titulo: "Estimaciones",
        href: "/dashboard/estimaciones",
        icono: FileSignature,
      },
    ],
  },
  {
    titulo: "Documentación",
    items: [
      {
        titulo: "Expediente en Nube",
        href: "/dashboard/expediente",
        icono: FolderOpen,
      },
      {
        titulo: "Contratos",
        href: "/dashboard/contrato",
        icono: FileSignature,
      },
      {
        titulo: "Partidas",
        href: "/dashboard/partidas",
        icono: BarChart3,
      },
    ],
  },
  {
    titulo: "Administración",
    rolesPermitidos: ["Administrador"],
    items: [
      {
        titulo: "Gestión de Obras",
        href: "/dashboard/obras",
        icono: Building2,
      },
      {
        titulo: "Usuarios",
        href: "/dashboard/usuarios",
        icono: Users,
      },
    ],
  },
];

function isItemActive(pathname: string, item: NavItem) {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname.startsWith(item.href);
}

interface AppSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function AppSidebar({ className, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const { rol } = useSupabaseSession();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-slate-200 bg-white",
        className,
      )}
    >
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
          <Building2 className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">Obra Pública</p>
          <p className="text-xs text-slate-500">Panel de Control</p>
        </div>
      </div>
      <Separator />
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-6">
          {GRUPOS_NAV.map((grupo) => {
            if (grupo.rolesPermitidos && rol) {
              if (!grupo.rolesPermitidos.includes(rol)) {
                return null;
              }
            }

            if (grupo.rolesPermitidos && !rol) {
              return null;
            }

            return (
              <div key={grupo.titulo} className="flex flex-col gap-2">
                <p className="px-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                  {grupo.titulo}
                </p>
                <div className="flex flex-col gap-1">
                  {grupo.items.map((item) => {
                    const Icono = item.icono;
                    const activo = isItemActive(pathname, item);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                          activo
                            ? "bg-slate-100 font-medium text-slate-900 shadow-sm"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        )}
                      >
                        <Icono
                          className={cn(
                            "h-4 w-4",
                            activo ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600",
                          )}
                          aria-hidden="true"
                        />
                        <span className="flex-1">{item.titulo}</span>
                        {activo ? (
                          <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>
      <Separator />
      <div className="px-4 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          <Home className="h-3.5 w-3.5" aria-hidden="true" />
          Volver al resumen
        </Link>
      </div>
    </aside>
  );
}
