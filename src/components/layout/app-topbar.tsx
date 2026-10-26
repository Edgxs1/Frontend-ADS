"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, Menu, UserCircle, UserRound } from "lucide-react";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { SelectorObra } from "@/components/layout/SelectorObra";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "@/components/layout/app-sidebar";

const RUTAS_BREADCRUMB: Record<string, string> = {
  "/dashboard": "Inicio",
  "/dashboard/reportes": "Reportes Diarios",
  "/dashboard/bitacora": "Bitácora Electrónica",
  "/dashboard/catalogos": "Catálogos de Conceptos",
  "/dashboard/estimaciones": "Estimaciones",
  "/dashboard/expediente": "Expediente en Nube",
  "/dashboard/contrato": "Contratos",
  "/dashboard/partidas": "Partidas",
  "/dashboard/obras": "Gestión de Obras",
  "/dashboard/usuarios": "Usuarios",
  "/dashboard/perfil": "Mi perfil",
};

function getBreadcrumb(pathname: string) {
  if (pathname === "/dashboard") {
    return [{ label: "General", href: "/dashboard" }, { label: "Inicio" }];
  }

  if (RUTAS_BREADCRUMB[pathname]) {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: RUTAS_BREADCRUMB[pathname] },
    ];
  }

  for (const ruta of Object.keys(RUTAS_BREADCRUMB).sort((a, b) => b.length - a.length)) {
    if (pathname.startsWith(ruta)) {
      return [
        { label: "Dashboard", href: "/dashboard" },
        { label: RUTAS_BREADCRUMB[ruta] },
      ];
    }
  }

  return [{ label: "Dashboard", href: "/dashboard" }, { label: "Módulo" }];
}

export function AppTopbar() {
  const pathname = usePathname();
  const { usuario, rol, signOut } = useSupabaseSession();

  const breadcrumbs = useMemo(() => getBreadcrumb(pathname), [pathname]);
  const correo = usuario?.correo ?? null;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <AppSidebar />
        </SheetContent>
      </Sheet>

      <nav className="hidden items-center gap-1 text-sm text-slate-500 md:flex">
        {breadcrumbs.map((item, index) => {
          const esUltimo = index === breadcrumbs.length - 1;

          return (
            <div key={item.label} className="flex items-center gap-1">
              {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> : null}
              {item.href && !esUltimo ? (
                <a href={item.href} className="transition-colors hover:text-slate-900">
                  {item.label}
                </a>
              ) : (
                <span className={esUltimo ? "font-medium text-slate-900" : ""}>{item.label}</span>
              )}
            </div>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden md:block">
          <SelectorObra />
        </div>
        {rol ? (
          <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 lg:inline-flex">
            {rol}
          </span>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <UserCircle className="h-4 w-4 text-slate-500" />
              <span className="hidden max-w-[160px] truncate text-sm text-slate-700 sm:inline-flex">
                {correo ?? "Usuario"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-900">Mi cuenta</span>
                <span className="truncate text-xs text-slate-500">{correo ?? "-"}</span>
              </div>
            </DropdownMenuLabel>
            {rol ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-slate-500">
                  Rol: {rol}
                </DropdownMenuLabel>
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2">
              <a href="/dashboard/perfil">
                <UserRound className="h-4 w-4" />
                Mi perfil
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="gap-2">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
