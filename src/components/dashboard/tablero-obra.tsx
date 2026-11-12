"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Banknote,
  CalendarClock,
  Loader2,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDashboardObra } from "@/services/dashboard";
import { formatearFecha, formatearMoneda } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgrupacionHistorico, DashboardIndicadores } from "@/types";

interface TableroObraProps {
  idObra: string;
}

interface ResultadoDashboard {
  clave: string;
  datos: DashboardIndicadores | null;
  error: string | null;
}

const COLORES_RECURSOS = ["#0f172a", "#94a3b8", "#f59e0b"];

function porcentaje(valor: number): string {
  return `${valor.toFixed(1)}%`;
}

export function TableroObra({ idObra }: TableroObraProps) {
  const [agrupacion, setAgrupacion] = useState<AgrupacionHistorico>("mes");
  const [resultado, setResultado] = useState<ResultadoDashboard | null>(null);
  const clave = `${idObra}:${agrupacion}`;

  useEffect(() => {
    let activo = true;

    getDashboardObra(idObra, agrupacion)
      .then((datos) => {
        if (activo) {
          setResultado({ clave, datos, error: null });
        }
      })
      .catch((err: unknown) => {
        if (activo) {
          setResultado({
            clave,
            datos: null,
            error:
              err instanceof Error
                ? err.message
                : "No se pudieron obtener los indicadores de la obra.",
          });
        }
      });

    return () => {
      activo = false;
    };
  }, [idObra, agrupacion, clave]);

  const valido = resultado?.clave === clave ? resultado : null;
  const cargando = valido === null;
  const datos = valido?.datos ?? null;
  const error = valido?.error ?? null;

  const indicadores = datos
    ? [
        {
          titulo: "Avance físico real",
          valor: datos.avance_fisico_real,
          descripcion: "Cantidades ejecutadas y validadas",
          icono: TrendingUp,
        },
        {
          titulo: "Avance físico programado",
          valor: datos.avance_fisico_programado,
          descripcion: "Avance esperado según el periodo",
          icono: CalendarClock,
        },
        {
          titulo: "Avance financiero real",
          valor: datos.avance_financiero_real,
          descripcion: `${formatearMoneda(datos.importe_ejecutado)} ejercidos`,
          icono: Banknote,
        },
        {
          titulo: "Avance financiero programado",
          valor: datos.avance_financiero_programado,
          descripcion: "Derrama esperada a la fecha de corte",
          icono: BarChart3,
        },
      ]
    : [];

  const recursos = datos
    ? [
        {
          name: "Pagado",
          value: datos.recursos_financieros.pagado,
        },
        {
          name: "Saldo por pagar",
          value: datos.recursos_financieros.saldo_por_pagar,
        },
        {
          name: "Retenciones",
          value: datos.recursos_financieros.retenciones,
        },
      ].filter((item) => item.value > 0)
    : [];

  if (cargando) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2
            className="h-6 w-6 animate-spin text-slate-400"
            aria-hidden="true"
          />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 py-6 text-sm text-slate-500">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
            aria-hidden="true"
          />
          <span>{error}</span>
        </CardContent>
      </Card>
    );
  }

  if (!datos) {
    return null;
  }

  return (
    <div className="space-y-4">
      {datos.desfase_alerta ? (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0"
            aria-hidden="true"
          />
          <span>
            ⚠️ ALERTA: Desfase Físico-Financiero. El avance financiero cobrado
            supera el físico validado.
          </span>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {indicadores.map((indicador) => {
          const Icono = indicador.icono;

          return (
            <Card key={indicador.titulo}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {indicador.titulo}
                </CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/5 text-slate-900">
                  <Icono className="h-4 w-4" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-3xl font-semibold tracking-tight text-slate-900">
                  {porcentaje(indicador.valor)}
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all"
                    style={{ width: `${Math.min(100, indicador.valor)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {indicador.descripcion}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>
          Contrato: {formatearMoneda(datos.importe_contrato)} · Corte:{" "}
          {formatearFecha(datos.fecha_corte)}
        </span>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {(["mes", "semana"] as AgrupacionHistorico[]).map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setAgrupacion(opcion)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                agrupacion === opcion
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {opcion === "mes" ? "Mensual" : "Semanal"}
            </button>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Curva de avance</CardTitle>
            <p className="text-sm text-slate-500">
              Comparativo de avance físico y financiero por periodo.
            </p>
          </CardHeader>
          <CardContent>
            {datos.historico.length === 0 ? (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 py-12 text-sm text-slate-400">
                Aún no hay estimaciones aprobadas para graficar.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={datos.historico}
                    margin={{ top: 8, right: 16, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="etiqueta" tick={{ fontSize: 12 }} />
                    <YAxis
                      domain={[0, 100]}
                      unit="%"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => `${Number(value).toFixed(2)}%`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avance_fisico"
                      name="Avance físico"
                      stroke="#0f172a"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="avance_financiero"
                      name="Avance financiero"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon
                className="h-4 w-4 text-slate-500"
                aria-hidden="true"
              />
              Recursos financieros
            </CardTitle>
            <p className="text-sm text-slate-500">
              Distribución del importe contractual.
            </p>
          </CardHeader>
          <CardContent>
            {recursos.length === 0 ? (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 py-12 text-sm text-slate-400">
                Sin movimientos financieros registrados.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={recursos}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {recursos.map((item, indice) => (
                        <Cell
                          key={item.name}
                          fill={COLORES_RECURSOS[indice % COLORES_RECURSOS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatearMoneda(Number(value))}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
