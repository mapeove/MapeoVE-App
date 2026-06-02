/**
 * Geocoding Architecture for MapeoVE
 *
 * Interfaces y tipos para futura integración con proveedores de geocodificación.
 * NO consume APIs externas todavía.
 *
 * Objetivo futuro: Dirección → coordenadas automáticas.
 */

/** Resultado de una operación de geocodificación */
export interface GeocodingResult {
  /** Latitud de la ubicación encontrada */
  lat: number;
  /** Longitud de la ubicación encontrada */
  lng: number;
  /** Dirección formateada devuelta por el proveedor */
  formattedAddress: string;
  /** Precisión del resultado (rooftop, street, city, etc.) */
  precision: GeocodingPrecision;
  /** Código de país (ISO 3166-1 alpha-2) */
  countryCode?: string;
  /** Nombre del proveedor que generó el resultado */
  provider: string;
}

/** Niveles de precisión de geocodificación */
export type GeocodingPrecision =
  | "rooftop"    // Exacto a nivel de edificio
  | "street"     // Nivel de calle
  | "intersection" // Intersección de calles
  | "neighborhood" // Barrio/urbanización
  | "city"       // Nivel de ciudad
  | "state"      // Nivel de estado/provincia
  | "country";   // Solo país

/** Interfaz que debe implementar cualquier proveedor de geocodificación */
export interface GeocodingProvider {
  /** Nombre identificador del proveedor */
  name: string;

  /**
   * Convierte una dirección textual en coordenadas geográficas.
   * @param address Dirección a buscar (ej: "Calle 10, La Victoria, Aragua")
   * @param options Opciones adicionales (país, límites, etc.)
   */
  geocode(
    address: string,
    options?: GeocodingOptions
  ): Promise<GeocodingResult[]>;

  /**
   * Convierte coordenadas geográficas en una dirección textual (geocodificación inversa).
   * @param lat Latitud
   * @param lng Longitud
   */
  reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null>;
}

/** Opciones para operaciones de geocodificación */
export interface GeocodingOptions {
  /** Restringir búsqueda a un país (código ISO) */
  countryCode?: string;
  /** Límite geográfico (bounding box) */
  bounds?: {
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
  };
  /** Número máximo de resultados */
  limit?: number;
  /** Idioma preferido para los resultados */
  language?: string;
}

/**
 * Función placeholder para geocodificación futura.
 * Actualmente retorna un array vacío.
 */
export async function geocodeAddress(
  _address: string,
  _options?: GeocodingOptions
): Promise<GeocodingResult[]> {
  // TODO: Implementar con proveedor real (Nominatim, Google, Mapbox, etc.)
  console.info("[MapeoVE] Geocodificación no implementada todavía");
  return [];
}
