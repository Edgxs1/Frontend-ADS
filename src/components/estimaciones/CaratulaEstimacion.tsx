import { Fragment } from "react";
import { ShieldCheck } from "lucide-react";
import { calcularDatosCaratula } from "@/lib/caratula";
import type {
  ConceptoCaratula,
  DatoCaratula,
  FianzaCaratula,
  FilaImporteCaratula,
  FirmaCaratula,
  GrupoConceptosCaratula,
  TotalResumenCaratula,
} from "@/lib/caratula";
import { formatearMoneda } from "@/lib/format";
import type { ContratoConContratista } from "@/types";
import type { CaratulaOficial, ResumenPartida } from "@/types/estimacion";

interface CaratulaEstimacionProps {
  caratula: CaratulaOficial;
  nombreObra: string;
  contrato: ContratoConContratista | null;
  resumenPartidas: ResumenPartida[];
}

function formatearPorcentaje(valor: number | null): string {
  if (valor === null || !Number.isFinite(valor)) {
    return "—";
  }

  return `${valor.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

export function CaratulaEstimacion({
  caratula,
  nombreObra,
  contrato,
  resumenPartidas,
}: CaratulaEstimacionProps) {
  const datos = calcularDatosCaratula(
    caratula,
    nombreObra,
    contrato,
    resumenPartidas,
  );

  return (
    <article
      aria-label="Carátula oficial de estimación"
      className="caratula-documento mx-auto w-full max-w-[210mm] border border-slate-300 bg-white p-4 text-xs text-slate-900 shadow-sm sm:p-6 print:max-w-none print:border-0 print:p-0 print:shadow-none"
    >
      <div className="border border-slate-800 bg-slate-800 px-3 py-2 text-center text-white print:bg-slate-800">
        <h2 className="text-xs font-bold uppercase tracking-wide">
          Carátula de Estimación - Documento oficial de pago
        </h2>
      </div>

      <table className="w-full table-fixed border-collapse text-xs">
        <colgroup>
          <col className="w-1/4" />
          <col className="w-1/4" />
          <col className="w-1/4" />
          <col className="w-1/4" />
        </colgroup>
        <tbody>
          <tr>
            <CampoEncabezado
              etiqueta="Obra"
              valor={datos.nombreObra}
              colSpan={3}
            />
            <CampoEncabezado etiqueta="Hoja" valor={datos.hoja} />
          </tr>
          <tr>
            <CampoEncabezado
              etiqueta="Descripción"
              valor={datos.descripcion}
              colSpan={3}
            />
            <CampoEncabezado
              etiqueta="Estimación"
              valor={datos.estimacionNumero}
            />
          </tr>
          <tr>
            <CampoEncabezado etiqueta="Contrato" valor={datos.contratoNumero} />
            <CampoEncabezado
              etiqueta="Fecha de contrato"
              valor={datos.fechaContrato}
            />
            <CampoEncabezado etiqueta="Periodo del" valor={datos.periodoInicio} />
            <CampoEncabezado etiqueta="Periodo al" valor={datos.periodoFin} />
          </tr>
          <tr>
            <CampoEncabezado
              etiqueta="Contratista"
              valor={datos.contratista}
              colSpan={2}
            />
            <CampoEncabezado etiqueta="RFC" valor={datos.rfc} />
            <CampoEncabezado
              etiqueta="Lugar de la obra"
              valor={datos.lugarObra}
            />
          </tr>
        </tbody>
      </table>

      <section className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3 print:grid-cols-3">
        <TablaImportes
          titulo="Importes sin IVA"
          filas={datos.importesSinIva}
          conPorcentaje
        />
        <TablaImportes
          titulo="Del anticipo"
          filas={datos.delAnticipo}
          conPorcentaje
        />
        <TablaImportes
          titulo="Del neto a recibir"
          filas={datos.delNeto}
          conPorcentaje={false}
        />
      </section>

      <section className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-3 print:grid-cols-3">
        <TablaDatos titulo="Contratista" datos={datos.contratistaDetalle} />
        <TablaDatos titulo="Contrato" datos={datos.contratoDetalle} />
        <TablaDatos titulo="Estimación" datos={datos.estimacionDetalle} />
      </section>

      <TablaFianzas fianzas={datos.fianzasDetalle} />

      <TablaDetalleConceptos grupos={datos.gruposConceptos} />

      <section className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2 print:grid-cols-2">
        <TablaResumenBase
          partidas={datos.resumenPartidas}
          subtotal={datos.subtotalPartidas}
          importeConLetra={datos.importeConLetraSubtotal}
        />
        <TablaDesgloseFinanciero
          totales={datos.resumenTotales}
          porcentajeIva={datos.porcentajeIva}
          importeConLetra={datos.importeConLetraNeto}
        />
      </section>

      <footer className="caratula-firmas mt-6 grid grid-cols-1 gap-6 border-t-2 border-slate-800 pt-4 sm:grid-cols-3 print:grid-cols-3">
        {datos.firmas.map((firma) => (
          <BloqueFirma key={firma.accion} firma={firma} />
        ))}
      </footer>

      <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[9px] text-slate-500">
        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
        Los hashes SHA-256 impresos validan la autenticidad e integridad del
        documento (RF3.8).
      </p>
    </article>
  );
}

function CampoEncabezado({
  etiqueta,
  valor,
  colSpan,
}: {
  etiqueta: string;
  valor: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className="border border-slate-400 px-2 py-1 align-top"
    >
      <span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-500">
        {etiqueta}
      </span>
      <span className="block font-semibold leading-snug text-slate-900">
        {valor}
      </span>
    </td>
  );
}

function TablaImportes({
  titulo,
  filas,
  conPorcentaje,
}: {
  titulo: string;
  filas: FilaImporteCaratula[];
  conPorcentaje: boolean;
}) {
  return (
    <div className="break-inside-avoid border border-slate-700">
      <h3 className="border-b border-slate-700 bg-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase tracking-wide text-slate-900 print:bg-slate-200">
        {titulo}
      </h3>
      <table className="w-full table-fixed border-collapse text-xs">
        <colgroup>
          <col className="w-[48%]" />
          <col className={conPorcentaje ? "w-[34%]" : "w-[52%]"} />
          {conPorcentaje ? <col className="w-[18%]" /> : null}
        </colgroup>
        <thead>
          <tr>
            <th className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-left font-semibold print:bg-slate-100">
              Concepto
            </th>
            <th className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-right font-semibold print:bg-slate-100">
              Importe
            </th>
            {conPorcentaje ? (
              <th className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-right font-semibold print:bg-slate-100">
                %
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr
              key={fila.etiqueta}
              className={fila.enfasis ? "bg-slate-900 font-bold text-white" : ""}
            >
              <td className="border border-slate-400 px-1.5 py-0.5 align-top">
                {fila.negativo ? `( - ) ${fila.etiqueta}` : fila.etiqueta}
              </td>
              <td className="border border-slate-400 px-1.5 py-0.5 text-right tabular-nums">
                {formatearMoneda(fila.importe)}
              </td>
              {conPorcentaje ? (
                <td className="border border-slate-400 px-1.5 py-0.5 text-right tabular-nums">
                  {formatearPorcentaje(fila.porcentaje)}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TablaDatos({
  titulo,
  datos,
}: {
  titulo: string;
  datos: DatoCaratula[];
}) {
  return (
    <div className="break-inside-avoid border border-slate-700">
      <h3 className="border-b border-slate-700 bg-slate-200 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-900 print:bg-slate-200">
        {titulo}
      </h3>
      <table className="w-full table-fixed border-collapse text-xs">
        <colgroup>
          <col className="w-[38%]" />
          <col className="w-[62%]" />
        </colgroup>
        <tbody>
          {datos.map((dato) => (
            <tr key={dato.etiqueta}>
              <td className="border border-slate-400 px-1.5 py-0.5 align-top font-semibold text-slate-600">
                {dato.etiqueta}
              </td>
              <td className="border border-slate-400 px-1.5 py-0.5 align-top">
                {dato.valor}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TablaFianzas({ fianzas }: { fianzas: FianzaCaratula[] }) {
  return (
    <div className="mt-2 break-inside-avoid border border-slate-700">
      <h3 className="border-b border-slate-700 bg-slate-200 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-900 print:bg-slate-200">
        Fianzas
      </h3>
      <table className="w-full table-fixed border-collapse text-xs">
        <colgroup>
          <col className="w-[34%]" />
          <col className="w-[26%]" />
          <col className="w-[18%]" />
          <col className="w-[22%]" />
        </colgroup>
        <thead>
          <tr>
            <th className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-left font-semibold print:bg-slate-100">
              Concepto
            </th>
            <th className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-left font-semibold print:bg-slate-100">
              Número
            </th>
            <th className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-center font-semibold print:bg-slate-100">
              Fecha
            </th>
            <th className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-right font-semibold print:bg-slate-100">
              Importe
            </th>
          </tr>
        </thead>
        <tbody>
          {fianzas.map((fianza) => (
            <tr key={fianza.concepto}>
              <td className="border border-slate-400 px-1.5 py-0.5 align-top font-semibold text-slate-600">
                {fianza.concepto}
              </td>
              <td className="border border-slate-400 px-1.5 py-0.5 align-top">
                {fianza.numero}
              </td>
              <td className="border border-slate-400 px-1.5 py-0.5 text-center tabular-nums">
                {fianza.fecha}
              </td>
              <td className="border border-slate-400 px-1.5 py-0.5 text-right tabular-nums">
                {fianza.importe}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TablaDetalleConceptos({
  grupos,
}: {
  grupos: GrupoConceptosCaratula[];
}) {
  return (
    <section className="mt-3 border border-slate-700">
      <h3 className="border-b border-slate-700 bg-slate-200 px-2 py-1 text-center text-[11px] font-bold uppercase tracking-wide text-slate-900 print:bg-slate-200">
        Detalle de conceptos
      </h3>
      <table className="w-full table-fixed border-collapse text-[9px] print:text-[8px]">
        <colgroup>
          <col className="w-[6%]" />
          <col className="w-[8%]" />
          <col className="w-[31%]" />
          <col className="w-[5%]" />
          <col className="w-[6.5%]" />
          <col className="w-[6.5%]" />
          <col className="w-[6.5%]" />
          <col className="w-[6.5%]" />
          <col className="w-[6.5%]" />
          <col className="w-[9%]" />
          <col className="w-[8.5%]" />
        </colgroup>
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-left font-semibold print:bg-slate-100"
            >
              Concepto Num
            </th>
            <th
              rowSpan={2}
              className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-left font-semibold print:bg-slate-100"
            >
              Especificación Num
            </th>
            <th
              rowSpan={2}
              className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-left font-semibold print:bg-slate-100"
            >
              Concepto de obra
            </th>
            <th
              colSpan={6}
              className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-center font-semibold print:bg-slate-100"
            >
              Cantidades de obra
            </th>
            <th
              rowSpan={2}
              className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-right font-semibold print:bg-slate-100"
            >
              Precio unitario
            </th>
            <th
              rowSpan={2}
              className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-right font-semibold print:bg-slate-100"
            >
              Importe
            </th>
          </tr>
          <tr>
            {[
              "Unidad",
              "Según proyecto",
              "Hasta estimación anterior",
              "De esta estimación",
              "Total estimado",
              "Por ejecutar",
            ].map((titulo) => (
              <th
                key={titulo}
                className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-right font-semibold print:bg-slate-100"
              >
                {titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grupos.length > 0 ? (
            grupos.map((grupo) => (
              <Fragment key={grupo.clave}>
                <tr className="break-inside-avoid">
                  <td className="border border-slate-400 px-1.5 py-1" />
                  <td className="border border-slate-400 px-1.5 py-1" />
                  <td
                    colSpan={9}
                    className="border border-slate-400 bg-slate-50 px-1.5 py-1 font-bold uppercase print:bg-slate-50"
                  >
                    {grupo.clave} — {grupo.descripcion}
                  </td>
                </tr>
                {grupo.conceptos.map((concepto, indice) => (
                  <FilaConcepto
                    key={`${grupo.clave}-${concepto.clave}-${indice}`}
                    concepto={concepto}
                  />
                ))}
                <tr>
                  <td
                    colSpan={11}
                    className="h-2 border border-slate-400 bg-white"
                  />
                </tr>
              </Fragment>
            ))
          ) : (
            <tr>
              <td
                colSpan={11}
                className="border border-slate-400 px-1 py-2 text-center text-slate-500"
              >
                Sin conceptos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function FilaConcepto({ concepto }: { concepto: ConceptoCaratula }) {
  return (
    <tr className="break-inside-avoid">
      <td className="border border-slate-400 px-1.5 py-1 align-top">
        {concepto.clave}
      </td>
      <td className="border border-slate-400 px-1.5 py-1 align-top">
        {concepto.especificacion}
      </td>
      <td className="border border-slate-400 px-1.5 py-1 align-top">
        {concepto.descripcion}
      </td>
      <td className="border border-slate-400 px-1.5 py-1 align-top text-center">
        {concepto.unidad}
      </td>
      <td className="border border-slate-400 px-1.5 py-1 text-right tabular-nums">
        {concepto.cantidadSegunProyecto}
      </td>
      <td className="border border-slate-400 px-1.5 py-1 text-right tabular-nums">
        {concepto.cantidadHastaAnterior}
      </td>
      <td className="border border-slate-400 px-1.5 py-1 text-right tabular-nums">
        {concepto.cantidadEstaEstimacion}
      </td>
      <td className="border border-slate-400 px-1.5 py-1 text-right tabular-nums">
        {concepto.cantidadTotalEstimado}
      </td>
      <td className="border border-slate-400 px-1.5 py-1 text-right tabular-nums">
        {concepto.cantidadPorEjecutar}
      </td>
      <td className="border border-slate-400 px-1.5 py-1 text-right tabular-nums">
        {concepto.precioUnitario}
      </td>
      <td className="border border-slate-400 px-1.5 py-1 text-right tabular-nums">
        {concepto.importe}
      </td>
    </tr>
  );
}

function TablaResumenBase({
  partidas,
  subtotal,
  importeConLetra,
}: {
  partidas: ResumenPartida[];
  subtotal: number;
  importeConLetra: string;
}) {
  return (
    <div className="break-inside-avoid border border-slate-700">
      <h3 className="border-b border-slate-700 bg-slate-200 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-900 print:bg-slate-200">
        Resumen base
      </h3>
      <table className="w-full table-fixed border-collapse text-xs">
        <colgroup>
          <col className="w-[20%]" />
          <col className="w-[56%]" />
          <col className="w-[24%]" />
        </colgroup>
        <thead>
          <tr>
            <th className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-left font-semibold print:bg-slate-100">
              Num de Partida
            </th>
            <th className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-left font-semibold print:bg-slate-100">
              Descripción
            </th>
            <th className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-right font-semibold print:bg-slate-100">
              Importe
            </th>
          </tr>
        </thead>
        <tbody>
          {partidas.length > 0 ? (
            partidas.map((partida) => (
              <tr key={partida.id_partida ?? partida.clave}>
                <td className="border border-slate-400 px-1.5 py-0.5 align-top">
                  {partida.clave}
                </td>
                <td className="border border-slate-400 px-1.5 py-0.5 align-top">
                  {partida.descripcion}
                </td>
                <td className="border border-slate-400 px-1.5 py-0.5 text-right tabular-nums">
                  {formatearMoneda(partida.importe)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={3}
                className="border border-slate-400 px-1.5 py-2 text-center text-slate-500"
              >
                Sin partidas registradas.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={2}
              className="border border-slate-400 px-1.5 py-0.5 text-right font-semibold"
            >
              Subtotal de esos conceptos
            </td>
            <td className="border border-slate-400 px-1.5 py-0.5 text-right tabular-nums">
              {formatearMoneda(subtotal)}
            </td>
          </tr>
        </tfoot>
      </table>
      <BloqueLetras importeConLetra={importeConLetra} />
    </div>
  );
}

function TablaDesgloseFinanciero({
  totales,
  porcentajeIva,
  importeConLetra,
}: {
  totales: TotalResumenCaratula;
  porcentajeIva: number;
  importeConLetra: string;
}) {
  const filas: {
    etiqueta: string;
    importe: number;
    negativo?: boolean;
    enfasis?: boolean;
  }[] = [
    {
      etiqueta: "Total estimación",
      importe: totales.totalEstimacion,
    },
    {
      etiqueta: "Amortización del anticipo",
      importe: totales.amortizacion,
      negativo: true,
    },
    {
      etiqueta: "Subtotal",
      importe: totales.subtotal,
    },
    {
      etiqueta: `IVA (${porcentajeIva.toLocaleString("es-MX", {
        maximumFractionDigits: 2,
      })}%)`,
      importe: totales.iva,
    },
    {
      etiqueta: "Retención (0.5% SFP)",
      importe: totales.retencionSfp,
      negativo: true,
    },
  ];

  if (totales.retencionAtraso > 0) {
    filas.push({
      etiqueta: "Retención por atraso",
      importe: totales.retencionAtraso,
      negativo: true,
    });
  }

  filas.push({
    etiqueta: "Total (Neto)",
    importe: totales.totalNeto,
    enfasis: true,
  });

  return (
    <div className="break-inside-avoid border border-slate-700">
      <h3 className="border-b border-slate-700 bg-slate-200 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-900 print:bg-slate-200">
        Desglose financiero
      </h3>
      <table className="w-full table-fixed border-collapse text-xs">
        <colgroup>
          <col className="w-[20%]" />
          <col className="w-[56%]" />
          <col className="w-[24%]" />
        </colgroup>
        <thead>
          <tr>
            <th className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-left font-semibold print:bg-slate-100">
              Num de Partida
            </th>
            <th className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-left font-semibold print:bg-slate-100">
              Descripción
            </th>
            <th className="border border-slate-400 bg-slate-100 px-1.5 py-1 text-right font-semibold print:bg-slate-100">
              Importe
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr
              key={fila.etiqueta}
              className={fila.enfasis ? "bg-slate-900 font-bold text-white" : ""}
            >
              <td className="border border-slate-400 px-1.5 py-0.5 align-top">
                —
              </td>
              <td className="border border-slate-400 px-1.5 py-0.5 align-top">
                {fila.negativo ? `( - ) ${fila.etiqueta}` : fila.etiqueta}
              </td>
              <td className="border border-slate-400 px-1.5 py-0.5 text-right tabular-nums">
                {formatearMoneda(fila.importe)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <BloqueLetras importeConLetra={importeConLetra} />
    </div>
  );
}

function BloqueLetras({ importeConLetra }: { importeConLetra: string }) {
  return (
    <div className="border-t border-slate-700 bg-slate-50 px-1.5 py-1 print:bg-slate-50">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-600">
        (CANTIDAD CON LETRA)
      </p>
      <p className="mt-0.5 text-[10px] font-bold uppercase leading-snug text-slate-900">
        SON: {importeConLetra}
      </p>
    </div>
  );
}

function BloqueFirma({ firma }: { firma: FirmaCaratula }) {
  return (
    <div className="text-center">
      <div className="mb-2 h-14 border-b border-slate-400" />
      <p className="text-xs font-bold uppercase tracking-wide text-slate-900">
        {firma.accion}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-slate-600">
        {firma.rol}
      </p>
      {firma.hash ? (
        <p className="mt-1 break-all border border-slate-300 bg-slate-50 px-1 py-0.5 font-mono text-[8px] leading-tight text-slate-500">
          {firma.hash}
        </p>
      ) : (
        <p className="mt-1 text-[9px] text-slate-400">Sin firma SHA-256</p>
      )}
    </div>
  );
}
