import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const map = new maplibregl.Map({
  container: 'map',
  zoom: 5,
  center: [138, 37],
  minZoom: 5,
  maxZoom: 18,
  maxBounds: [122, 20, 154, 50],
  style: {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        maxzoom: 19,
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      },
      hazard_flood: {
        type: 'raster',
        tiles: [
          'https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png'
        ],
        minzoom: 2,
        maxzoom: 17,
        tileSize: 256,
        attribution: '<a href="https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html">ハザードマップポータルサイト</a>'
      },
      hazard_hightide: {
        type: 'raster',
        tiles: [
          'https://disaportaldata.gsi.go.jp/raster/03_hightide_l2_shinsuishin_data/{z}/{x}/{y}.png'
        ],
        minzoom: 2,
        maxzoom: 17,
        tileSize: 256,
        attribution: '<a href="https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html">ハザードマップポータルサイト</a>'
      },
      hazard_tsunami: {
        type: 'raster',
        tiles: [
          'https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png'
        ],
        minzoom: 2,
        maxzoom: 17,
        tileSize: 256,
        attribution: '<a href="https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html">ハザードマップポータルサイト</a>'
      },
      hazard_doseki: {
        type: 'raster',
        tiles: [
          'https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki/{z}/{x}/{y}.png'
        ],
        minzoom: 2,
        maxzoom: 17,
        tileSize: 256,
        attribution: '<a href="https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html">ハザードマップポータルサイト</a>'
      },
      hazard_kyukeisha: {
        type: 'raster',
        tiles: [
          'https://disaportaldata.gsi.go.jp/raster/05_kyukeishakeikaikuiki/{z}/{x}/{y}.png'
        ],
        minzoom: 2,
        maxzoom: 17,
        tileSize: 256,
        attribution: '<a href="https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html">ハザードマップポータルサイト</a>'
      },
      hazard_jisuberi: {
        type: 'raster',
        tiles: [
          'https://disaportaldata.gsi.go.jp/raster/05_jisuberikeikaikuiki/{z}/{x}/{y}.png'
        ],
        minzoom: 2,
        maxzoom: 17,
        tileSize: 256,
        attribution: '<a href="https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html">ハザードマップポータルサイト</a>'
      }
    },
    layers: [
      {
        id: 'osm-layer',
        type: 'raster',
        source: 'osm'
      },
      {
        id: 'hazard_flood-layer',
        type: 'raster',
        source: 'hazard_flood',
        paint: {
          'raster-opacity': 0.7
        }
      },
      {
        id: 'hazard_hightide-layer',
        type: 'raster',
        source: 'hazard_hightide',
        paint: {
          'raster-opacity': 0.7
        }
      },
      {
        id: 'hazard_tsunami-layer',
        type: 'raster',
        source: 'hazard_tsunami',
        paint: {
          'raster-opacity': 0.7
        }
      },
      {
        id: 'hazard_doseki-layer',
        type: 'raster',
        source: 'hazard_doseki',
        paint: {
          'raster-opacity': 0.7
        }
      },
      {
        id: 'hazard_kyukeisha-layer',
        type: 'raster',
        source: 'hazard_kyukeisha',
        paint: {
          'raster-opacity': 0.7
        }
      },
      {
        id: 'hazard_jisuberi-layer',
        type: 'raster',
        source: 'hazard_jisuberi',
        paint: {
          'raster-opacity': 0.7
        }
      }
    ]
  }
});