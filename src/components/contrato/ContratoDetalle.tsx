import { Building2, FileText } from "lucide-react";
import { formatearFecha, formatearMoneda } from "@/lib/format";
import type { ContratoConContratista } from "@/types";

interface DatoProps {
  etiqueta: string;
  valor: string;
}

function Dato({ etiqueta, valor }: DatoProps) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {etiqueta}
      </dt>
      <dd className="mt-1 text-sm text-slate-900">{valor}</dd>
    </div>
  );
}

export function ContratoDetalle({ contrato }: { contrato: ContratoConContratista }) {
  const { contratista } = contrato;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Datos del contrato</h2>
            <p className="text-sm text-slate-500">
              Contrato {contrato.numero_contrato}
            </p>
          </div>
        </header>
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Dato etiqueta="Número de contrato" valor={contrato.numero_contrato} />
          <Dato etiqueta="Fecha del contrato" valor={formatearFecha(contrato.fecha_contrato)} />
          <Dato etiqueta="Lugar de la obra" valor={contrato.lugar_obra} />
          <Dato
            etiqueta="Inicio de ejecución"
            valor={formatearFecha(contrato.periodo_ejecucion_inicio)}
          />
          <Dato
            etiqueta="Fin de ejecución"
            valor={formatearFecha(contrato.periodo_ejecucion_fin)}
          />
          <Dato
            etiqueta="Importe del contrato"
            valor={formatearMoneda(contrato.importe_contrato)}
          />
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Datos del contratista</h2>
            <p className="text-sm text-slate-500">{contratista.razon_social}</p>
          </div>
        </header>
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Dato etiqueta="Razón social" valor={contratista.razon_social} />
          <Dato etiqueta="RFC" valor={contratista.rfc} />
          <Dato etiqueta="Registro IVA" valor={contratista.registro_iva} />
          <Dato etiqueta="Registro CMIC" valor={contratista.registro_cmic} />
          <Dato etiqueta="Registro GACM" valor={contratista.registro_gacm} />
          <Dato etiqueta="Representante legal" valor={contratista.representante_legal} />
          <Dato etiqueta="Cargo" valor={contratista.cargo_representante} />
          <Dato etiqueta="Teléfono" valor={contratista.telefono_representante} />
        </dl>
      </section>
    </div>
  );
}
