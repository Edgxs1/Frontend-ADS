import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatearFecha, formatearMoneda } from "@/lib/format";
import type { CaratulaOficial } from "@/types/estimacion";

const AZUL = "#0f172a";
const GRIS = "#475569";
const BORDE = "#e2e8f0";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingHorizontal: 44,
    paddingBottom: 128,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: AZUL,
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: AZUL,
    paddingBottom: 14,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitulo: {
    marginTop: 4,
    fontSize: 8,
    textAlign: "center",
    color: GRIS,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  obra: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 16,
    columnGap: 12,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    marginBottom: 2,
    fontSize: 7,
    color: GRIS,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tabla: {
    borderWidth: 1,
    borderColor: BORDE,
    borderRadius: 4,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDE,
  },
  filaUltima: {
    borderBottomWidth: 0,
  },
  etiqueta: {
    color: GRIS,
  },
  valor: {
    fontWeight: "bold",
  },
  netoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: AZUL,
    borderRadius: 4,
  },
  netoLabel: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  netoValor: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  conceptosSection: {
    marginTop: 16,
  },
  conceptosTable: {
    borderWidth: 1,
    borderColor: BORDE,
    borderRadius: 4,
  },
  conceptosHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: BORDE,
  },
  conceptosRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDE,
  },
  conceptosRowUltima: {
    borderBottomWidth: 0,
  },
  conceptosCellClave: {
    width: "10%",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: BORDE,
  },
  conceptosCellDescripcion: {
    width: "42%",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: BORDE,
  },
  conceptosCellUnidad: {
    width: "10%",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: BORDE,
    textAlign: "center",
  },
  conceptosCellPunit: {
    width: "12%",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: BORDE,
    textAlign: "right",
  },
  conceptosCellCantidad: {
    width: "12%",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: BORDE,
    textAlign: "right",
  },
  conceptosCellImporte: {
    width: "14%",
    paddingVertical: 6,
    paddingHorizontal: 6,
    textAlign: "right",
  },
  conceptosHeaderText: {
    fontSize: 7,
    fontWeight: "bold",
    color: GRIS,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  conceptosTextClave: {
    fontSize: 8,
  },
  conceptosTextDesc: {
    fontSize: 7,
    lineHeight: 1.3,
  },
  conceptosTextUnidad: {
    fontSize: 8,
    textAlign: "center",
  },
  conceptosTextNumero: {
    fontSize: 8,
    textAlign: "right",
  },
  firmas: {
    position: "absolute",
    left: 44,
    right: 44,
    bottom: 44,
  },
  firmasTitulo: {
    marginBottom: 8,
    fontSize: 8,
    fontWeight: "bold",
    color: GRIS,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  firmasRow: {
    flexDirection: "row",
  },
  firmaCol: {
    flex: 1,
    marginHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    paddingTop: 6,
  },
  firmaRol: {
    marginBottom: 3,
    fontSize: 9,
    fontWeight: "bold",
  },
  firmaHash: {
    fontSize: 8,
    lineHeight: 1.35,
    color: GRIS,
    letterSpacing: 0.2,
  },
  pie: {
    marginTop: 10,
    fontSize: 7,
    textAlign: "center",
    color: "#94a3b8",
  },
});

function formatearHash(hash: string | null): string {
  if (!hash) {
    return "No disponible";
  }

  return hash.replace(/(.{16})/g, "$1 ").trim();
}

interface CaratulaPDFProps {
  caratula: CaratulaOficial;
  nombreObra: string;
}

export function CaratulaPDF({ caratula, nombreObra }: CaratulaPDFProps) {
  const { estimacion, conceptos, caratula: financiero } = caratula;

  return (
    <Document
      title={`Carátula ${estimacion.folio}`}
      author="Sistema de Estimaciones"
      subject={`Carátula de estimación ${estimacion.folio}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.titulo}>Carátula de Estimación</Text>
          <Text style={styles.subtitulo}>Documento oficial de pago</Text>
          <Text style={styles.obra}>{nombreObra}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Folio</Text>
              <Text style={styles.metaValue}>{estimacion.folio}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Tipo de estimación</Text>
              <Text style={styles.metaValue}>{estimacion.tipo}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Periodo</Text>
              <Text style={styles.metaValue}>
                {formatearFecha(estimacion.periodo_inicio)} —{" "}
                {formatearFecha(estimacion.periodo_fin)}
              </Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Estado</Text>
              <Text style={styles.metaValue}>{estimacion.estado}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Resumen financiero</Text>

        <View style={styles.tabla}>
          <View style={styles.fila}>
            <Text style={styles.etiqueta}>Subtotal</Text>
            <Text style={styles.valor}>{formatearMoneda(financiero.subtotal)}</Text>
          </View>
          <View style={styles.fila}>
            <Text style={styles.etiqueta}>IVA (16%)</Text>
            <Text style={styles.valor}>{formatearMoneda(financiero.iva)}</Text>
          </View>
          <View style={styles.fila}>
            <Text style={styles.etiqueta}>Retención inspección (0.5%)</Text>
            <Text style={styles.valor}>
              {formatearMoneda(financiero.retencion_inspeccion)}
            </Text>
          </View>
          <View style={styles.fila}>
            <Text style={styles.etiqueta}>Amortización anticipo</Text>
            <Text style={styles.valor}>
              {formatearMoneda(financiero.amortizacion_anticipo)}
            </Text>
          </View>
          <View style={[styles.fila, styles.filaUltima]}>
            <Text style={styles.etiqueta}>Retención atraso programa</Text>
            <Text style={styles.valor}>
              {formatearMoneda(financiero.retencion_atraso_programa)}
            </Text>
          </View>
        </View>

        <View style={styles.netoRow}>
          <Text style={styles.netoLabel}>Neto a recibir</Text>
          <Text style={styles.netoValor}>
            {formatearMoneda(financiero.neto_a_recibir)}
          </Text>
        </View>

        {conceptos && conceptos.length > 0 ? (
          <View style={styles.conceptosSection} wrap={true}>
            <Text style={styles.sectionTitle}>Conceptos cobrados</Text>
            <View style={styles.conceptosTable}>
              <View style={styles.conceptosHeaderRow} fixed>
                <View style={styles.conceptosCellClave}>
                  <Text style={styles.conceptosHeaderText}>Clave</Text>
                </View>
                <View style={styles.conceptosCellDescripcion}>
                  <Text style={styles.conceptosHeaderText}>Descripción</Text>
                </View>
                <View style={styles.conceptosCellUnidad}>
                  <Text style={styles.conceptosHeaderText}>Unidad</Text>
                </View>
                <View style={styles.conceptosCellPunit}>
                  <Text style={styles.conceptosHeaderText}>P.U.</Text>
                </View>
                <View style={styles.conceptosCellCantidad}>
                  <Text style={styles.conceptosHeaderText}>Cantidad</Text>
                </View>
                <View style={styles.conceptosCellImporte}>
                  <Text style={styles.conceptosHeaderText}>Importe</Text>
                </View>
              </View>
              {conceptos.map((concepto, index) => {
                const esUltima = index === conceptos.length - 1;
                const cantidad = Number(
                  concepto.cantidad_de_esta_estimacion ?? 0,
                );
                const precioUnitario = Number(
                  concepto.precio_unitario_snapshot ?? 0,
                );
                const importe = Number(concepto.importe ?? cantidad * precioUnitario);

                return (
                  <View
                    key={concepto.id_detalle ?? concepto.id_concepto ?? index}
                    style={
                      esUltima
                        ? [styles.conceptosRow, styles.conceptosRowUltima]
                        : styles.conceptosRow
                    }
                    wrap={false}
                  >
                    <View style={styles.conceptosCellClave}>
                      <Text style={styles.conceptosTextClave}>
                        {concepto.clave ?? "—"}
                      </Text>
                    </View>
                    <View style={styles.conceptosCellDescripcion}>
                      <Text style={styles.conceptosTextDesc}>
                        {concepto.descripcion ?? "—"}
                      </Text>
                    </View>
                    <View style={styles.conceptosCellUnidad}>
                      <Text style={styles.conceptosTextUnidad}>
                        {concepto.unidad_medida ?? "—"}
                      </Text>
                    </View>
                    <View style={styles.conceptosCellPunit}>
                      <Text style={styles.conceptosTextNumero}>
                        {formatearMoneda(precioUnitario)}
                      </Text>
                    </View>
                    <View style={styles.conceptosCellCantidad}>
                      <Text style={styles.conceptosTextNumero}>
                        {cantidad.toLocaleString("es-MX")}
                      </Text>
                    </View>
                    <View style={styles.conceptosCellImporte}>
                      <Text style={styles.conceptosTextNumero}>
                        {formatearMoneda(importe)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.firmas} fixed>
          <Text style={styles.firmasTitulo}>Firmas criptográficas</Text>
          <View style={styles.firmasRow}>
            <View style={styles.firmaCol}>
              <Text style={styles.firmaRol}>Superintendente</Text>
              <Text style={styles.firmaHash}>
                {formatearHash(estimacion.firma_superintendente)}
              </Text>
            </View>
            <View style={styles.firmaCol}>
              <Text style={styles.firmaRol}>Supervisor</Text>
              <Text style={styles.firmaHash}>
                {formatearHash(estimacion.firma_supervisor)}
              </Text>
            </View>
            <View style={styles.firmaCol}>
              <Text style={styles.firmaRol}>Residente</Text>
              <Text style={styles.firmaHash}>
                {formatearHash(estimacion.firma_residente)}
              </Text>
            </View>
          </View>
          <Text style={styles.pie}>
            Los hashes anteriores validan la autenticidad e integridad de este
            documento.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
