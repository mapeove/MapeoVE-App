// Shared Map Configuration for MapeoVE

export const MAP_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster" as const,
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export const INITIAL_MAP_CONFIG = {
  latitude: 10.2268,
  longitude: -67.3312,
  zoom: 13,
  zoomSelector: 16,
  maxZoom: 19,
};
