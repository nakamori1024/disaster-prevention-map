import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const map = new maplibregl.Map({
  container: 'map', // container id
  zoom: 5,
  center: [138, 37],
  minZoom: 5,
  maxZoom: 18,
  maxBounds: [122, 20, 154, 50],
  style: {
    version: 8,
    sources: {
      'osm': {
        type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        maxzoom: 19,
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    },
    layers: [
      {
        id: 'osm-layer',
        type: 'raster',
        source: 'osm'
      }
    ]
  }
});