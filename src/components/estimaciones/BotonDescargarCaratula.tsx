"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { CaratulaPDF } from "@/components/estimaciones/CaratulaPDF";
import { Button } from "@/components/ui/button";
import type { CaratulaOficial } from "@/types/estimacion";

interface BotonDescargarCaratulaProps {
  caratula: CaratulaOficial;
  nombreObra: string;
}

export function BotonDescargarCaratula({
  caratula,
  nombreObra,
}: BotonDescargarCaratulaProps) {
  const nombreArchivo = `Caratula-${caratula.estimacion.folio}.pdf`;

  return (
    <PDFDownloadLink
      document={<CaratulaPDF caratula={caratula} nombreObra={nombreObra} />}
      fileName={nombreArchivo}
    >
      {({ loading, error }) => (
        <Button
          type="button"
          disabled={loading || Boolean(error)}
          title={error ? "No se pudo generar el PDF" : undefined}
        >
          {loading ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Download aria-hidden="true" />
          )}
          {loading ? "Generando PDF…" : "Descargar Carátula PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
