"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { CaratulaPDF } from "@/components/estimaciones/CaratulaPDF";
import { Button } from "@/components/ui/button";
import type { ContratoConContratista } from "@/types";
import type { CaratulaOficial, ResumenPartida } from "@/types/estimacion";

interface BotonDescargarCaratulaProps {
  caratula: CaratulaOficial;
  nombreObra: string;
  contrato: ContratoConContratista | null;
  resumenPartidas: ResumenPartida[];
}

export function BotonDescargarCaratula({
  caratula,
  nombreObra,
  contrato,
  resumenPartidas,
}: BotonDescargarCaratulaProps) {
  const nombreArchivo = `Caratula-${caratula.estimacion.folio}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <CaratulaPDF
          caratula={caratula}
          nombreObra={nombreObra}
          contrato={contrato}
          resumenPartidas={resumenPartidas}
        />
      }
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
          {loading ? "Generando PDF…" : "Exportar a PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
