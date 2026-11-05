import { ShieldCheck } from "lucide-react";
import { formatearFecha, formatearMoneda } from "@/lib/format";
import type { ContratoConContratista } from "@/types";
import type {
  CaratulaOficial,
  EstimacionConcepto,
  ResumenPartida,
} from "@/types/estimacion";

interface CaratulaEstimacionProps {
  caratula: CaratulaOficial;
  nombreObra: string;
  contrato: ContratoConContratista | null;
  resumenPartidas: ResumenPartida[];
}

interface FirmaCaratula {
  accion: string;
  rol: string;
  hash: string | null;
}

export function CaratulaEstimacion({
  caratula,
  nombreObra,
  contrato,
  resumenPartidas,
}: CaratulaEstimacionProps) {
  const { estimacion, conceptos, caratula: financiero } = caratula;
  const aprobada = estimacion.estado === "Aprobada";

  const firmas: FirmaCaratula[] = [
    {
      accion: "Formuló",
      rol: "Superintendente",
      hash: estimacion.firma_superintendente,
    },
    {
      accion: "Revisó",
      rol: "Supervisor",
      hash: estimacion.firma_supervisor,
    },
    {
      accion: "Autorizó",
      rol: "Residente",
      hash: estimacion.firma_residente,
    },
  ];

  const totalPartidas = resumenPartidas.reduce(
    (total, partida) => total + partida.importe,
    0,
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-900 px-6 pb-6 pt-8 sm:px-10">
        <h2 className="text-center text-xl font-bold uppercase tracking-widest text-slate-900">
          Carátula de Estimación
        </h2>
        <p className="mt-1 text-center text-[11px] uppercase tracking-[0.3em] text-slate-500">
          Documento oficial de pago
        </p>
        <p className="mt-4 text-center text-base font-semibold text-slate-900">
          {nombreObra}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Dato etiqueta="Folio" valor={estimacion.folio} />
          <Dato etiqueta="Tipo" valor={estimacion.tipo} />
          <Dato etiqueta="Estado" valor={estimacion.estado} />
          <Dato
            etiqueta="Fecha de estimación"
            valor={formatearFecha(estimacion.fecha ?? estimacion.created_at)}
          />
          <Dato etiqueta="Contrato" valor={contrato?.numero_contrato ?? "—"} />
          <Dato
            etiqueta="Contratista"
            valor={contrato?.contratista?.razon_social ?? "—"}
          />
          <Dato
            etiqueta="Periodo de ejecución"
            valor={
              contrato
                ? `${formatearFecha(contrato.periodo_ejecucion_inicio)} — ${formatearFecha(contrato.periodo_ejecucion_fin)}`
                : "—"
            }
          />
          <Dato
            etiqueta="Periodo de estimación"
            valor={`${formatearFecha(estimacion.periodo_inicio)} — ${formatearFecha(estimacion.periodo_fin)}`}
          />
        </div>
      </div>

      <div className="space-y-10 px-6 py-8 sm:px-10">
        <Seccion titulo="Resumen financiero">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <FilaFinanciera
              etiqueta="Subtotal de conceptos"
              valor={financiero.subtotal}
            />
            <FilaFinanciera etiqueta="IVA (16%)" valor={financiero.iva} />
            <FilaFinanciera
              etiqueta="Subtotal con IVA"
              valor={financiero.subtotal + financiero.iva}
            />
            <FilaFinanciera
              etiqueta="Amortización de anticipo"
              valor={financiero.amortizacion_anticipo}
              negativo
            />
            <FilaFinanciera
              etiqueta="Retención por inspección (0.5%)"
              valor={financiero.retencion_inspeccion}
              negativo
            />
            <FilaFinanciera
              etiqueta="Retención manual / atraso de programa"
              valor={financiero.retencion_atraso_programa}
              negativo
              ultima
            />
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-white">
              Neto a recibir
            </span>
            <span className="text-lg font-bold text-white">
              {formatearMoneda(financiero.neto_a_recibir)}
            </span>
          </div>
        </Seccion>

        <Seccion titulo="Resumen por partida">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Clave</th>
                  <th className="px-3 py-2 font-semibold">Partida</th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Conceptos
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {resumenPartidas.length > 0 ? (
                  resumenPartidas.map((partida) => (
                    <tr key={partida.id_partida ?? partida.clave}>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {partida.clave}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {partida.descripcion}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {partida.conceptos}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-900">
                        {formatearMoneda(partida.importe)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-3 text-center text-slate-500"
                    >
                      Sin partidas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t border-slate-300 bg-slate-50">
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Total
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-900">
                    {formatearMoneda(totalPartidas)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Seccion>

        <Seccion titulo="Lista detallada de conceptos">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Clave</th>
                  <th className="px-3 py-2 font-semibold">Descripción</th>
                  <th className="px-3 py-2 text-center font-semibold">
                    Unidad
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Cantidad
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">P.U.</th>
                  <th className="px-3 py-2 text-right font-semibold">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {conceptos.length > 0 ? (
                  conceptos.map((concepto, index) => (
                    <FilaConcepto
                      key={
                        concepto.id_detalle ??
                        `${concepto.id_concepto}-${index}`
                      }
                      concepto={concepto}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-3 text-center text-slate-500"
                    >
                      Sin conceptos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Seccion>

        <Seccion titulo="Firmas">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {firmas.map((firma) => (
              <div
                key={firma.rol}
                className="flex flex-col items-center text-center"
              >
                <div className="h-14 w-full border-b border-slate-300" />
                <span className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
                  {firma.accion}
                </span>
                <span className="text-xs text-slate-500">{firma.rol}</span>
                {aprobada && firma.hash ? (
                  <code className="mt-2 w-full break-all rounded bg-slate-50 px-2 py-1 text-[10px] text-slate-500">
                    {firma.hash}
                  </code>
                ) : (
                  <span className="mt-2 text-[11px] text-slate-400">
                    Pendiente de firma
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-center text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Los hashes SHA-256 validan la autenticidad e integridad del
            documento.
          </p>
        </Seccion>
      </div>
    </section>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        {etiqueta}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{valor}</p>
    </div>
  );
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-900">
        {titulo}
      </h3>
      {children}
    </div>
  );
}

function FilaFinanciera({
  etiqueta,
  valor,
  negativo = false,
  ultima = false,
}: {
  etiqueta: string;
  valor: number;
  negativo?: boolean;
  ultima?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-2 text-sm ${
        ultima ? "" : "border-b border-slate-200"
      }`}
    >
      <span className="text-slate-500">
        {negativo ? `( - ) ${etiqueta}` : etiqueta}
      </span>
      <span className="font-medium text-slate-900">{formatearMoneda(valor)}</span>
    </div>
  );
}

function FilaConcepto({ concepto }: { concepto: EstimacionConcepto }) {
  const cantidad = Number(concepto.cantidad_de_esta_estimacion ?? 0);
  const precioUnitario = Number(concepto.precio_unitario_snapshot ?? 0);
  const importe = Number(concepto.importe ?? cantidad * precioUnitario);

  return (
    <tr>
      <td className="px-3 py-2 font-medium text-slate-900">
        {concepto.clave ?? "—"}
      </td>
      <td className="px-3 py-2 text-slate-600">
        {concepto.descripcion ?? "—"}
      </td>
      <td className="px-3 py-2 text-center text-slate-600">
        {concepto.unidad_medida ?? "—"}
      </td>
      <td className="px-3 py-2 text-right text-slate-600">
        {cantidad.toLocaleString("es-MX")}
      </td>
      <td className="px-3 py-2 text-right text-slate-600">
        {formatearMoneda(precioUnitario)}
      </td>
      <td className="px-3 py-2 text-right font-medium text-slate-900">
        {formatearMoneda(importe)}
      </td>
    </tr>
  );
}
