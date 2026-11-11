import type { ReactNode } from "react";
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { calcularDatosCaratula } from "@/lib/caratula";
import type {
  ConceptoCaratula,
  DatoCaratula,
  DatosCaratula,
  FianzaCaratula,
  FilaImporteCaratula,
  GrupoConceptosCaratula,
} from "@/lib/caratula";
import { formatearMoneda } from "@/lib/format";
import type { ContratoConContratista } from "@/types";
import type { CaratulaOficial, ResumenPartida } from "@/types/estimacion";

Font.registerHyphenationCallback((word) => [word]);

const AZUL = "#0f172a";
const GRIS = "#475569";
const BORDE = "#64748b";

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 24,
    fontFamily: "Helvetica",
    fontSize: 7,
    color: AZUL,
    backgroundColor: "#ffffff",
  },
  tituloBar: {
    borderWidth: 1,
    borderColor: AZUL,
    backgroundColor: AZUL,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  titulo: {
    fontSize: 10.5,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  encabezado: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: AZUL,
  },
  filaEncabezado: {
    flexDirection: "row",
  },
  celdaEncabezado: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDE,
    paddingVertical: 2.5,
    paddingHorizontal: 3,
  },
  celdaEncabezadoSinDerecha: {
    borderRightWidth: 0,
  },
  celdaEncabezadoSinAbajo: {
    borderBottomWidth: 0,
  },
  encabezadoEtiqueta: {
    fontSize: 5.4,
    color: GRIS,
    textTransform: "uppercase",
    letterSpacing: 0.25,
    marginBottom: 1,
  },
  encabezadoValor: {
    fontSize: 7,
    fontWeight: "bold",
    lineHeight: 1.2,
  },
  tablasRow: {
    flexDirection: "row",
    marginTop: 6,
    alignItems: "flex-start",
  },
  tablaCol: {
    flex: 1,
    marginRight: 5,
  },
  tablaColUltima: {
    marginRight: 0,
  },
  tablaTitulo: {
    borderWidth: 1,
    borderColor: AZUL,
    backgroundColor: "#e2e8f0",
    paddingVertical: 2,
    textAlign: "center",
    fontSize: 6.8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tablaFila: {
    flexDirection: "row",
  },
  celda: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDE,
    paddingVertical: 1.8,
    paddingHorizontal: 2.5,
  },
  celdaSinDerecha: {
    borderRightWidth: 0,
  },
  celdaSinAbajo: {
    borderBottomWidth: 0,
  },
  celdaHeader: {
    backgroundColor: "#f1f5f9",
  },
  celdaEnfasis: {
    backgroundColor: AZUL,
  },
  celdaTexto: {
    fontSize: 6.1,
    lineHeight: 1.2,
  },
  celdaTextoHeader: {
    fontSize: 5.8,
    fontWeight: "bold",
    color: GRIS,
    textTransform: "uppercase",
    letterSpacing: 0.15,
  },
  celdaTextoNumero: {
    textAlign: "right",
  },
  celdaTextoEnfasis: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  detalleRow: {
    flexDirection: "row",
    marginTop: 6,
    alignItems: "flex-start",
  },
  detalleCol: {
    flex: 1,
    marginRight: 5,
  },
  detalleColUltima: {
    flex: 1,
  },
  resumenRow: {
    flexDirection: "row",
    marginTop: 8,
    alignItems: "flex-start",
  },
  resumenCol: {
    flex: 1,
    marginRight: 5,
  },
  resumenColUltima: {
    flex: 1,
  },
  conceptoSeccion: {
    marginTop: 8,
    width: "100%",
  },
  conceptoPartida: {
    backgroundColor: "#f8fafc",
    fontWeight: "bold",
    fontSize: 5.8,
  },
  celdaConcepto: {
    paddingVertical: 2,
    paddingHorizontal: 2.5,
  },
  conceptoTexto: {
    fontSize: 5.6,
    lineHeight: 1.15,
  },
  conceptoTextoHeader: {
    fontSize: 4.7,
    fontWeight: "bold",
    color: GRIS,
    textTransform: "uppercase",
    letterSpacing: 0.1,
  },
  conceptoEspacio: {
    height: 4,
    borderWidth: 1,
    borderColor: BORDE,
  },
  datosBloque: {
    marginBottom: 5,
  },
  fianzasBloque: {
    marginTop: 6,
  },
  letrasTabla: {
    borderTopWidth: 1,
    borderColor: AZUL,
    backgroundColor: "#f8fafc",
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  letrasEtiqueta: {
    fontSize: 5.6,
    color: GRIS,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  letrasTexto: {
    marginTop: 1,
    fontSize: 6.8,
    fontWeight: "bold",
    textTransform: "uppercase",
    lineHeight: 1.25,
  },
  firmas: {
    marginTop: 28,
  },
  firmasRow: {
    flexDirection: "row",
    borderTopWidth: 1.5,
    borderTopColor: AZUL,
    paddingTop: 4,
  },
  firmaCol: {
    flex: 1,
    marginHorizontal: 6,
    paddingTop: 3,
  },
  firmaLinea: {
    height: 24,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#94a3b8",
  },
  firmaAccion: {
    fontSize: 7.2,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  firmaRol: {
    fontSize: 5.6,
    color: GRIS,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  firmaHash: {
    marginTop: 2,
    fontSize: 5.5,
    color: GRIS,
    lineHeight: 1.3,
    letterSpacing: 0.1,
  },
  pie: {
    marginTop: 3,
    fontSize: 5,
    textAlign: "center",
    color: "#94a3b8",
  },
});

function formatearPorcentaje(valor: number | null): string {
  if (valor === null || !Number.isFinite(valor)) {
    return "—";
  }

  return `${valor.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function formatearHash(hash: string | null): string {
  if (!hash) {
    return "Sin firma SHA-256";
  }

  return hash.replace(/(.{16})/g, "$1 ").trim();
}

function EncabezadoCelda({
  etiqueta,
  valor,
  flex,
  sinDerecha,
  sinAbajo,
}: {
  etiqueta: string;
  valor: string;
  flex: number;
  sinDerecha?: boolean;
  sinAbajo?: boolean;
}) {
  return (
    <View
      style={[
        styles.celdaEncabezado,
        { flex },
        sinDerecha ? styles.celdaEncabezadoSinDerecha : {},
        sinAbajo ? styles.celdaEncabezadoSinAbajo : {},
      ]}
    >
      <Text style={styles.encabezadoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.encabezadoValor}>{valor}</Text>
    </View>
  );
}

function TablaImportes({
  titulo,
  filas,
  conPorcentaje,
  ultima,
}: {
  titulo: string;
  filas: FilaImporteCaratula[];
  conPorcentaje: boolean;
  ultima?: boolean;
}) {
  const flexConcepto = conPorcentaje ? 4.4 : 6.2;
  const flexImporte = conPorcentaje ? 3.4 : 3.8;
  const flexPorcentaje = 1.6;

  return (
    <View style={[styles.tablaCol, ultima ? styles.tablaColUltima : {}]}>
      <Text style={styles.tablaTitulo}>{titulo}</Text>
      <View style={styles.tablaFila}>
        <View
          style={[
            styles.celda,
            styles.celdaHeader,
            { flex: flexConcepto },
          ]}
        >
          <Text style={styles.celdaTextoHeader}>Concepto</Text>
        </View>
        <View
          style={[
            styles.celda,
            styles.celdaHeader,
            conPorcentaje ? {} : styles.celdaSinDerecha,
            { flex: flexImporte },
          ]}
        >
          <Text style={[styles.celdaTextoHeader, styles.celdaTextoNumero]}>
            Importe
          </Text>
        </View>
        {conPorcentaje ? (
          <View
            style={[
              styles.celda,
              styles.celdaHeader,
              styles.celdaSinDerecha,
              { flex: flexPorcentaje },
            ]}
          >
            <Text style={[styles.celdaTextoHeader, styles.celdaTextoNumero]}>
              %
            </Text>
          </View>
        ) : null}
      </View>

      {filas.map((fila, index) => {
        const esUltima = index === filas.length - 1;

        return (
          <View key={fila.etiqueta} style={styles.tablaFila}>
            <View
              style={[
                styles.celda,
                fila.enfasis ? styles.celdaEnfasis : {},
                esUltima ? styles.celdaSinAbajo : {},
                { flex: flexConcepto },
              ]}
            >
              <Text
                style={[
                  styles.celdaTexto,
                  fila.enfasis ? styles.celdaTextoEnfasis : {},
                ]}
              >
                {fila.negativo ? `( - ) ${fila.etiqueta}` : fila.etiqueta}
              </Text>
            </View>
            <View
              style={[
                styles.celda,
                fila.enfasis ? styles.celdaEnfasis : {},
                conPorcentaje ? {} : styles.celdaSinDerecha,
                esUltima ? styles.celdaSinAbajo : {},
                { flex: flexImporte },
              ]}
            >
              <Text
                style={[
                  styles.celdaTexto,
                  styles.celdaTextoNumero,
                  fila.enfasis ? styles.celdaTextoEnfasis : {},
                ]}
              >
                {formatearMoneda(fila.importe)}
              </Text>
            </View>
            {conPorcentaje ? (
              <View
                style={[
                  styles.celda,
                  styles.celdaSinDerecha,
                  fila.enfasis ? styles.celdaEnfasis : {},
                  esUltima ? styles.celdaSinAbajo : {},
                  { flex: flexPorcentaje },
                ]}
              >
                <Text
                  style={[
                    styles.celdaTexto,
                    styles.celdaTextoNumero,
                    fila.enfasis ? styles.celdaTextoEnfasis : {},
                  ]}
                >
                  {formatearPorcentaje(fila.porcentaje)}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function SeccionDatos({
  titulo,
  datos,
}: {
  titulo: string;
  datos: DatoCaratula[];
}) {
  return (
    <View style={styles.datosBloque}>
      <Text style={styles.tablaTitulo}>{titulo}</Text>
      {datos.map((dato, index) => {
        const esUltima = index === datos.length - 1;

        return (
          <View key={dato.etiqueta} style={styles.tablaFila}>
            <View
              style={[
                styles.celda,
                esUltima ? styles.celdaSinAbajo : {},
                { flex: 2.8 },
              ]}
            >
              <Text
                style={[
                  styles.celdaTexto,
                  { fontWeight: "bold", color: GRIS, fontSize: 5.8 },
                ]}
              >
                {dato.etiqueta}
              </Text>
            </View>
            <View
              style={[
                styles.celda,
                styles.celdaSinDerecha,
                esUltima ? styles.celdaSinAbajo : {},
                { flex: 5.2 },
              ]}
            >
              <Text style={styles.celdaTexto}>{dato.valor}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function SeccionFianzas({ fianzas }: { fianzas: FianzaCaratula[] }) {
  return (
    <View style={styles.fianzasBloque} wrap={false}>
      <Text style={styles.tablaTitulo}>Fianzas</Text>
      <View style={styles.tablaFila}>
        <View style={[styles.celda, styles.celdaHeader, { flex: 3.4 }]}>
          <Text style={styles.celdaTextoHeader}>Concepto</Text>
        </View>
        <View style={[styles.celda, styles.celdaHeader, { flex: 2.6 }]}>
          <Text style={styles.celdaTextoHeader}>Número</Text>
        </View>
        <View style={[styles.celda, styles.celdaHeader, { flex: 1.8 }]}>
          <Text style={[styles.celdaTextoHeader, { textAlign: "center" }]}>
            Fecha
          </Text>
        </View>
        <View
          style={[
            styles.celda,
            styles.celdaHeader,
            styles.celdaSinDerecha,
            { flex: 2.2 },
          ]}
        >
          <Text style={[styles.celdaTextoHeader, styles.celdaTextoNumero]}>
            Importe
          </Text>
        </View>
      </View>
      {fianzas.map((fianza, index) => {
        const esUltima = index === fianzas.length - 1;

        return (
          <View key={fianza.concepto} style={styles.tablaFila}>
            <View
              style={[
                styles.celda,
                esUltima ? styles.celdaSinAbajo : {},
                { flex: 3.4 },
              ]}
            >
              <Text
                style={[
                  styles.celdaTexto,
                  { fontWeight: "bold", color: GRIS },
                ]}
              >
                {fianza.concepto}
              </Text>
            </View>
            <View
              style={[
                styles.celda,
                esUltima ? styles.celdaSinAbajo : {},
                { flex: 2.6 },
              ]}
            >
              <Text style={styles.celdaTexto}>{fianza.numero}</Text>
            </View>
            <View
              style={[
                styles.celda,
                esUltima ? styles.celdaSinAbajo : {},
                { flex: 1.8 },
              ]}
            >
              <Text style={[styles.celdaTexto, { textAlign: "center" }]}>
                {fianza.fecha}
              </Text>
            </View>
            <View
              style={[
                styles.celda,
                styles.celdaSinDerecha,
                esUltima ? styles.celdaSinAbajo : {},
                { flex: 2.2 },
              ]}
            >
              <Text style={[styles.celdaTexto, styles.celdaTextoNumero]}>
                {fianza.importe}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function CeldaConcepto({
  children,
  flex,
  header,
  numerica,
  centrada,
  ultima,
}: {
  children?: ReactNode;
  flex: number;
  header?: boolean;
  numerica?: boolean;
  centrada?: boolean;
  ultima?: boolean;
}) {
  return (
    <View
      style={[
        styles.celda,
        styles.celdaConcepto,
        header ? styles.celdaHeader : {},
        ultima ? styles.celdaSinDerecha : {},
        { flex },
      ]}
    >
      {children ? (
        <Text
          style={[
            header ? styles.conceptoTextoHeader : styles.conceptoTexto,
            numerica ? styles.celdaTextoNumero : {},
            centrada ? { textAlign: "center" } : {},
          ]}
        >
          {children}
        </Text>
      ) : null}
    </View>
  );
}

function FilaConceptoPDF({ concepto }: { concepto: ConceptoCaratula }) {
  return (
    <View style={styles.tablaFila} wrap={false}>
      <CeldaConcepto flex={6}>{concepto.clave}</CeldaConcepto>
      <CeldaConcepto flex={8}>{concepto.especificacion}</CeldaConcepto>
      <CeldaConcepto flex={31}>{concepto.descripcion}</CeldaConcepto>
      <CeldaConcepto flex={5} centrada>
        {concepto.unidad}
      </CeldaConcepto>
      <CeldaConcepto flex={6.5} numerica>
        {concepto.cantidadSegunProyecto}
      </CeldaConcepto>
      <CeldaConcepto flex={6.5} numerica>
        {concepto.cantidadHastaAnterior}
      </CeldaConcepto>
      <CeldaConcepto flex={6.5} numerica>
        {concepto.cantidadEstaEstimacion}
      </CeldaConcepto>
      <CeldaConcepto flex={6.5} numerica>
        {concepto.cantidadTotalEstimado}
      </CeldaConcepto>
      <CeldaConcepto flex={6.5} numerica>
        {concepto.cantidadPorEjecutar}
      </CeldaConcepto>
      <CeldaConcepto flex={9} numerica>
        {concepto.precioUnitario}
      </CeldaConcepto>
      <CeldaConcepto flex={8.5} numerica ultima>
        {concepto.importe}
      </CeldaConcepto>
    </View>
  );
}

function TablaDetalleConceptos({
  grupos,
}: {
  grupos: GrupoConceptosCaratula[];
}) {
  return (
    <View style={styles.conceptoSeccion}>
      <Text style={styles.tablaTitulo}>Detalle de conceptos</Text>
      <View style={styles.tablaFila} wrap={false}>
        <CeldaConcepto flex={6} header>
          {"Concepto\nNum"}
        </CeldaConcepto>
        <CeldaConcepto flex={8} header>
          {"Especificación\nNum"}
        </CeldaConcepto>
        <CeldaConcepto flex={31} header>
          Concepto de obra
        </CeldaConcepto>
        <CeldaConcepto flex={37.5} header centrada>
          Cantidades de obra
        </CeldaConcepto>
        <CeldaConcepto flex={9} header numerica>
          {"Precio\nunitario"}
        </CeldaConcepto>
        <CeldaConcepto flex={10} header numerica ultima>
          Importe
        </CeldaConcepto>
      </View>
      <View style={styles.tablaFila} wrap={false}>
        <CeldaConcepto flex={6} header />
        <CeldaConcepto flex={8} header />
        <CeldaConcepto flex={31} header />
        <CeldaConcepto flex={5} header numerica>
          Unidad
        </CeldaConcepto>
        <CeldaConcepto flex={6.5} header numerica>
          {"Según\nproyecto"}
        </CeldaConcepto>
        <CeldaConcepto flex={6.5} header numerica>
          {"Hasta\nestimación\nanterior"}
        </CeldaConcepto>
        <CeldaConcepto flex={6.5} header numerica>
          {"De esta\nestimación"}
        </CeldaConcepto>
        <CeldaConcepto flex={6.5} header numerica>
          {"Total\nestimado"}
        </CeldaConcepto>
        <CeldaConcepto flex={6.5} header numerica>
          {"Por\nejecutar"}
        </CeldaConcepto>
        <CeldaConcepto flex={9} header />
        <CeldaConcepto flex={8.5} header ultima />
      </View>

      {grupos.length > 0 ? (
        grupos.map((grupo) => (
          <View key={grupo.clave}>
            <View style={styles.tablaFila} wrap={false}>
              <CeldaConcepto flex={6} />
              <CeldaConcepto flex={8} />
              <View
                style={[
                  styles.celda,
                  styles.celdaConcepto,
                  styles.celdaSinDerecha,
                  styles.conceptoPartida,
                  { flex: 86 },
                ]}
              >
                <Text
                  style={[
                    styles.conceptoTexto,
                    styles.conceptoPartida,
                  ]}
                >
                  {`${grupo.clave} — ${grupo.descripcion}`}
                </Text>
              </View>
            </View>
            {grupo.conceptos.map((concepto, indice) => (
              <FilaConceptoPDF
                key={`${grupo.clave}-${concepto.clave}-${indice}`}
                concepto={concepto}
              />
            ))}
            <View style={styles.conceptoEspacio} />
          </View>
        ))
      ) : (
        <View style={styles.tablaFila}>
          <CeldaConcepto flex={10.2} ultima centrada>
            Sin conceptos registrados.
          </CeldaConcepto>
        </View>
      )}
    </View>
  );
}

function CabeceraResumen() {
  return (
    <View style={styles.tablaFila}>
      <View style={[styles.celda, styles.celdaHeader, { flex: 1.2 }]}>
        <Text style={styles.celdaTextoHeader}>{"Num de\nPartida"}</Text>
      </View>
      <View style={[styles.celda, styles.celdaHeader, { flex: 4.2 }]}>
        <Text style={styles.celdaTextoHeader}>Descripción</Text>
      </View>
      <View
        style={[
          styles.celda,
          styles.celdaHeader,
          styles.celdaSinDerecha,
          { flex: 1.8 },
        ]}
      >
        <Text style={[styles.celdaTextoHeader, styles.celdaTextoNumero]}>
          Importe
        </Text>
      </View>
    </View>
  );
}

function FilaResumen({
  etiqueta,
  valor,
  negativo,
  enfasis,
  ultimaFila,
}: {
  etiqueta: string;
  valor: number;
  negativo?: boolean;
  enfasis?: boolean;
  ultimaFila?: boolean;
}) {
  return (
    <View style={styles.tablaFila}>
      <View
        style={[
          styles.celda,
          enfasis ? styles.celdaEnfasis : {},
          ultimaFila ? styles.celdaSinAbajo : {},
          { flex: 1.2 },
        ]}
      />
      <View
        style={[
          styles.celda,
          enfasis ? styles.celdaEnfasis : {},
          ultimaFila ? styles.celdaSinAbajo : {},
          { flex: 4.2 },
        ]}
      >
        <Text
          style={[
            styles.celdaTexto,
            enfasis ? styles.celdaTextoEnfasis : {},
          ]}
        >
          {negativo ? `( - ) ${etiqueta}` : etiqueta}
        </Text>
      </View>
      <View
        style={[
          styles.celda,
          styles.celdaSinDerecha,
          enfasis ? styles.celdaEnfasis : {},
          ultimaFila ? styles.celdaSinAbajo : {},
          { flex: 1.8 },
        ]}
      >
        <Text
          style={[
            styles.celdaTexto,
            styles.celdaTextoNumero,
            enfasis ? styles.celdaTextoEnfasis : {},
          ]}
        >
          {formatearMoneda(valor)}
        </Text>
      </View>
    </View>
  );
}

function BloqueLetras({ importeConLetra }: { importeConLetra: string }) {
  return (
    <View style={styles.letrasTabla}>
      <Text style={styles.letrasEtiqueta}>
        (CANTIDAD CON LETRA)
      </Text>
      <Text style={styles.letrasTexto}>SON: {importeConLetra}</Text>
    </View>
  );
}

function TablaResumenBase({ datos }: { datos: DatosCaratula }) {
  return (
    <View style={styles.resumenCol}>
      <Text style={styles.tablaTitulo}>Resumen base</Text>
      <CabeceraResumen />
      {datos.resumenPartidas.length > 0 ? (
        datos.resumenPartidas.map((partida) => (
          <View key={partida.id_partida ?? partida.clave} style={styles.tablaFila}>
            <View style={[styles.celda, { flex: 1.2 }]}>
              <Text style={styles.celdaTexto}>{partida.clave}</Text>
            </View>
            <View style={[styles.celda, { flex: 4.2 }]}>
              <Text style={styles.celdaTexto}>{partida.descripcion}</Text>
            </View>
            <View
              style={[
                styles.celda,
                styles.celdaSinDerecha,
                { flex: 1.8 },
              ]}
            >
              <Text style={[styles.celdaTexto, styles.celdaTextoNumero]}>
                {formatearMoneda(partida.importe)}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.tablaFila}>
          <View style={[styles.celda, styles.celdaSinDerecha, { flex: 7.2 }]}>
            <Text style={[styles.celdaTexto, { textAlign: "center" }]}>
              Sin partidas registradas.
            </Text>
          </View>
        </View>
      )}
      <FilaResumen
        etiqueta="Subtotal de esos conceptos"
        valor={datos.subtotalPartidas}
        ultimaFila
      />
      <BloqueLetras importeConLetra={datos.importeConLetraSubtotal} />
    </View>
  );
}

function TablaDesgloseFinanciero({ datos }: { datos: DatosCaratula }) {
  const filas: {
    etiqueta: string;
    valor: number;
    negativo?: boolean;
    enfasis?: boolean;
  }[] = [
    {
      etiqueta: "Total estimación",
      valor: datos.resumenTotales.totalEstimacion,
    },
    {
      etiqueta: "Amortización del anticipo",
      valor: datos.resumenTotales.amortizacion,
      negativo: true,
    },
    {
      etiqueta: "Subtotal",
      valor: datos.resumenTotales.subtotal,
    },
    {
      etiqueta: `IVA (${datos.porcentajeIva.toLocaleString("es-MX", {
        maximumFractionDigits: 2,
      })}%)`,
      valor: datos.resumenTotales.iva,
    },
    {
      etiqueta: "Retención (0.5% SFP)",
      valor: datos.resumenTotales.retencionSfp,
      negativo: true,
    },
  ];

  if (datos.resumenTotales.retencionAtraso > 0) {
    filas.push({
      etiqueta: "Retención por atraso",
      valor: datos.resumenTotales.retencionAtraso,
      negativo: true,
    });
  }

  filas.push({
    etiqueta: "Total (Neto)",
    valor: datos.resumenTotales.totalNeto,
    enfasis: true,
  });

  return (
    <View style={styles.resumenColUltima}>
      <Text style={styles.tablaTitulo}>Desglose financiero</Text>
      <CabeceraResumen />
      {filas.map((fila, indice) => (
        <FilaResumen
          key={fila.etiqueta}
          etiqueta={fila.etiqueta}
          valor={fila.valor}
          negativo={fila.negativo}
          enfasis={fila.enfasis}
          ultimaFila={indice === filas.length - 1}
        />
      ))}
      <BloqueLetras importeConLetra={datos.importeConLetraNeto} />
    </View>
  );
}

interface CaratulaPDFProps {
  caratula: CaratulaOficial;
  nombreObra: string;
  contrato: ContratoConContratista | null;
  resumenPartidas: ResumenPartida[];
}

export function CaratulaPDF({
  caratula,
  nombreObra,
  contrato,
  resumenPartidas,
}: CaratulaPDFProps) {
  const datos = calcularDatosCaratula(
    caratula,
    nombreObra,
    contrato,
    resumenPartidas,
  );

  return (
    <Document
      title={`Carátula ${datos.estimacionNumero}`}
      author="Sistema de Estimaciones"
      subject={`Carátula de estimación ${datos.estimacionNumero}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.tituloBar}>
          <Text style={styles.titulo}>
            Carátula de Estimación - Documento oficial de pago
          </Text>
        </View>

        <View style={styles.encabezado}>
          <View style={styles.filaEncabezado}>
            <EncabezadoCelda
              etiqueta="Obra"
              valor={datos.nombreObra}
              flex={3}
            />
            <EncabezadoCelda
              etiqueta="Hoja"
              valor={datos.hoja}
              flex={1}
              sinDerecha
            />
          </View>
          <View style={styles.filaEncabezado}>
            <EncabezadoCelda
              etiqueta="Descripción"
              valor={datos.descripcion}
              flex={3}
            />
            <EncabezadoCelda
              etiqueta="Estimación"
              valor={datos.estimacionNumero}
              flex={1}
              sinDerecha
            />
          </View>
          <View style={styles.filaEncabezado}>
            <EncabezadoCelda
              etiqueta="Contrato"
              valor={datos.contratoNumero}
              flex={1}
            />
            <EncabezadoCelda
              etiqueta="Fecha de contrato"
              valor={datos.fechaContrato}
              flex={1}
            />
            <EncabezadoCelda
              etiqueta="Periodo del"
              valor={datos.periodoInicio}
              flex={1}
            />
            <EncabezadoCelda
              etiqueta="Periodo al"
              valor={datos.periodoFin}
              flex={1}
              sinDerecha
            />
          </View>
          <View style={styles.filaEncabezado}>
            <EncabezadoCelda
              etiqueta="Contratista"
              valor={datos.contratista}
              flex={2}
              sinAbajo
            />
            <EncabezadoCelda
              etiqueta="RFC"
              valor={datos.rfc}
              flex={1}
              sinAbajo
            />
            <EncabezadoCelda
              etiqueta="Lugar de la obra"
              valor={datos.lugarObra}
              flex={1}
              sinDerecha
              sinAbajo
            />
          </View>
        </View>

        <View style={styles.tablasRow} wrap={false}>
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
            ultima
          />
        </View>

        <View style={styles.detalleRow} wrap={false}>
          <View style={styles.detalleCol}>
            <SeccionDatos
              titulo="Contratista"
              datos={datos.contratistaDetalle}
            />
          </View>
          <View style={styles.detalleCol}>
            <SeccionDatos titulo="Contrato" datos={datos.contratoDetalle} />
          </View>
          <View style={styles.detalleColUltima}>
            <SeccionDatos
              titulo="Estimación"
              datos={datos.estimacionDetalle}
            />
          </View>
        </View>

        <SeccionFianzas fianzas={datos.fianzasDetalle} />

        <TablaDetalleConceptos grupos={datos.gruposConceptos} />

        <View style={styles.resumenRow}>
          <TablaResumenBase datos={datos} />
          <TablaDesgloseFinanciero datos={datos} />
        </View>

        <View style={styles.firmas} wrap={false}>
          <View style={styles.firmasRow}>
            {datos.firmas.map((firma) => (
              <View key={firma.accion} style={styles.firmaCol}>
                <View style={styles.firmaLinea} />
                <Text style={styles.firmaAccion}>{firma.accion}</Text>
                <Text style={styles.firmaRol}>{firma.rol}</Text>
                <Text style={styles.firmaHash}>
                  {formatearHash(firma.hash)}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.pie}>
            Los hashes SHA-256 validan la autenticidad e integridad de este
            documento (RF3.8).
          </Text>
        </View>
      </Page>
    </Document>
  );
}
