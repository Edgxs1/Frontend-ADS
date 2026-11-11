const UNIDADES = [
  "",
  "UNO",
  "DOS",
  "TRES",
  "CUATRO",
  "CINCO",
  "SEIS",
  "SIETE",
  "OCHO",
  "NUEVE",
  "DIEZ",
  "ONCE",
  "DOCE",
  "TRECE",
  "CATORCE",
  "QUINCE",
  "DIECISÉIS",
  "DIECISIETE",
  "DIECIOCHO",
  "DIECINUEVE",
  "VEINTE",
  "VEINTIUNO",
  "VEINTIDÓS",
  "VEINTITRÉS",
  "VEINTICUATRO",
  "VEINTICINCO",
  "VEINTISÉIS",
  "VEINTISIETE",
  "VEINTIOCHO",
  "VEINTINUEVE",
];

const DECENAS = [
  "",
  "",
  "",
  "TREINTA",
  "CUARENTA",
  "CINCUENTA",
  "SESENTA",
  "SETENTA",
  "OCHENTA",
  "NOVENTA",
];

const CENTENAS = [
  "",
  "CIENTO",
  "DOSCIENTOS",
  "TRESCIENTOS",
  "CUATROCIENTOS",
  "QUINIENTOS",
  "SEISCIENTOS",
  "SETECIENTOS",
  "OCHOCIENTOS",
  "NOVECIENTOS",
];

function convertirGrupo(numero: number): string {
  if (numero === 0) {
    return "";
  }

  if (numero < 30) {
    return UNIDADES[numero] ?? "";
  }

  if (numero < 100) {
    const decena = Math.floor(numero / 10);
    const unidad = numero % 10;

    if (unidad === 0) {
      return DECENAS[decena] ?? "";
    }

    return `${DECENAS[decena]} Y ${UNIDADES[unidad]}`.trim();
  }

  if (numero === 100) {
    return "CIEN";
  }

  const centena = Math.floor(numero / 100);
  const resto = numero % 100;

  if (resto === 0) {
    return CENTENAS[centena] ?? "";
  }

  return `${CENTENAS[centena]} ${convertirGrupo(resto)}`.trim();
}

function apocopar(texto: string): string {
  if (texto === "UNO") {
    return "UN";
  }

  if (texto === "VEINTIUNO") {
    return "VEINTIÚN";
  }

  if (texto.endsWith(" UNO")) {
    return `${texto.slice(0, -4)} UN`;
  }

  return texto;
}

function convertirEntero(numero: number): string {
  if (numero < 1_000) {
    return convertirGrupo(numero);
  }

  if (numero < 1_000_000) {
    const miles = Math.floor(numero / 1_000);
    const resto = numero % 1_000;
    const prefijo =
      miles === 1 ? "MIL" : `${apocopar(convertirGrupo(miles))} MIL`;

    return resto === 0
      ? prefijo
      : `${prefijo} ${convertirGrupo(resto)}`.trim();
  }

  const millones = Math.floor(numero / 1_000_000);
  const resto = numero % 1_000_000;
  const prefijo =
    millones === 1
      ? "UN MILLÓN"
      : `${apocopar(convertirEntero(millones))} MILLONES`;

  return resto === 0
    ? prefijo
    : `${prefijo} ${convertirEntero(resto)}`.trim();
}

export function importeALetras(valor: number | null | undefined): string {
  const numero =
    typeof valor === "number" && Number.isFinite(valor) ? Math.abs(valor) : 0;
  const totalCentavos = Math.round(numero * 100);
  const enteros = Math.floor(totalCentavos / 100);
  const centavos = totalCentavos % 100;
  const letras =
    enteros === 0 ? "CERO" : apocopar(convertirEntero(enteros));
  const moneda = enteros === 1 ? "PESO" : "PESOS";

  return `${letras} ${moneda} ${String(centavos).padStart(2, "0")}/100 M.N.`;
}
