/**
 * Coordinate Validator for MapeoVE
 *
 * Valida que las coordenadas geográficas sean números válidos
 * y estén dentro del territorio venezolano.
 *
 * Rangos aproximados de Venezuela:
 *   Latitud:  0° — 13° N
 *   Longitud: -74° — -59° O
 */

/** Límites geográficos de Venezuela */
export const VENEZUELA_BOUNDS = {
  latMin: 0,
  latMax: 13,
  lngMin: -74,
  lngMax: -59,
} as const;

/**
 * Verifica si un par de coordenadas es numéricamente válido
 * (números finitos, no NaN, no Infinity)
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

/**
 * Verifica si un par de coordenadas cae dentro del territorio venezolano
 */
export function isInVenezuela(lat: number, lng: number): boolean {
  return (
    lat >= VENEZUELA_BOUNDS.latMin &&
    lat <= VENEZUELA_BOUNDS.latMax &&
    lng >= VENEZUELA_BOUNDS.lngMin &&
    lng <= VENEZUELA_BOUNDS.lngMax
  );
}

/**
 * Validación completa: coordenadas numéricamente válidas Y dentro de Venezuela.
 * Esta es la función principal que deben usar los componentes antes de crear marcadores.
 */
export function isValidVenezuelaCoordinate(lat: number, lng: number): boolean {
  return isValidCoordinate(lat, lng) && isInVenezuela(lat, lng);
}

/**
 * Genera un reporte de calidad de coordenadas para un listado de negocios.
 * Solo se ejecuta en desarrollo (client-side).
 * Retorna el conteo de válidos e inválidos.
 */
export function validateBusinessCoordinates(
  businesses: Array<{ name: string; latitude: number; longitude: number }>
): { valid: number; invalid: number; details: Array<{ name: string; lat: number; lng: number; reason: string }> } {
  let valid = 0;
  let invalid = 0;
  const details: Array<{ name: string; lat: number; lng: number; reason: string }> = [];

  for (const biz of businesses) {
    const lat = Number(biz.latitude);
    const lng = Number(biz.longitude);

    if (!isValidCoordinate(lat, lng)) {
      invalid++;
      details.push({
        name: biz.name,
        lat: biz.latitude,
        lng: biz.longitude,
        reason: "Coordenadas no son números válidos",
      });
    } else if (!isInVenezuela(lat, lng)) {
      invalid++;
      details.push({
        name: biz.name,
        lat,
        lng,
        reason: `Fuera de Venezuela (lat ${lat}, lng ${lng})`,
      });
    } else {
      valid++;
    }
  }

  if (typeof console !== "undefined") {
    console.info(
      `[MapeoVE] Reporte de coordenadas: ${valid} válidos, ${invalid} inválidos de ${businesses.length} total`
    );
    if (details.length > 0) {
      console.warn("[MapeoVE] Negocios con coordenadas inválidas:", details);
    }
  }

  return { valid, invalid, details };
}
