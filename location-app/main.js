import distance from '@turf/distance';
import maplibregl from 'maplibre-gl';
import { useGsiTerrainSource } from 'maplibre-gl-gsi-terrain';
import OpacityControl from 'maplibre-gl-opacity';
import 'maplibre-gl-opacity/dist/maplibre-gl-opacity.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';

// PMTilesプロトコルを初期化
const protocol = new Protocol();
// MapLibre GL JSに 'pmtiles' というカスタムプロトコルを追加
maplibregl.addProtocol('pmtiles', protocol.tile);


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
      },
      route: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
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
        },
        layout: {
          visibility: 'none'
        }
      },
      {
        id: 'hazard_hightide-layer',
        type: 'raster',
        source: 'hazard_hightide',
        paint: {
          'raster-opacity': 0.7
        },
        layout: {
          visibility: 'none'
        }
      },
      {
        id: 'hazard_tsunami-layer',
        type: 'raster',
        source: 'hazard_tsunami',
        paint: {
          'raster-opacity': 0.7
        },
        layout: {
          visibility: 'none'
        }
      },
      {
        id: 'hazard_doseki-layer',
        type: 'raster',
        source: 'hazard_doseki',
        paint: {
          'raster-opacity': 0.7
        },
        layout: {
          visibility: 'none'
        }
      },
      {
        id: 'hazard_kyukeisha-layer',
        type: 'raster',
        source: 'hazard_kyukeisha',
        paint: {
          'raster-opacity': 0.7
        },
        layout: {
          visibility: 'none'
        }
      },
      {
        id: 'hazard_jisuberi-layer',
        type: 'raster',
        source: 'hazard_jisuberi',
        paint: {
          'raster-opacity': 0.7
        },
        layout: {
          visibility: 'none'
        }
      },
      {
        id: 'route-layer',
        source: 'route',
        type: 'line',
        paint: {
          'line-color': '#33aaff',
          'line-width': 4
        }
      }
    ]
  }
});

const getCurrentSkhbLayerFilter = () => {
  const style = map.getStyle();
  const skhbLayers = style.layers.filter((layer) =>
    layer.id.startsWith('skhb'),
  );
  const visibleSkhbLayers = skhbLayers.filter(
    (layer) => layer.layout.visibility === 'visible',
  );
  return visibleSkhbLayers[0].filter;
};

const getNearestFeature = (longitude, latitude) => {
  const currentSkhbLayerFilter = getCurrentSkhbLayerFilter();
  const features = map.querySourceFeatures('pmtiles', {
    sourceLayer: 'tokyo_hinan',
    filter: currentSkhbLayerFilter
  });

  const nearestFeature = features.reduce((minDistFeature, feature) => {
    const dist = distance(
      [longitude, latitude],
      feature.geometry.coordinates
    );

    if (minDistFeature === null || minDistFeature.properties.dist > dist)
      return {
        ...feature,
        properties: {
          ...feature.properties,
          dist,
        }
      };
    return minDistFeature;
  }, null);
  return nearestFeature;
};

map.on('load', () => {
  const tilesUrl = 'https://d1z62ehlrono0i.cloudfront.net/streaming_data/pmtiles/tokyo_hinan.pmtiles';
  // const tilesUrl = 'tokyo_hinan.pmtiles';  // ローカルのPMTilesファイルを指定

  map.addSource('pmtiles', {
    type: 'vector',
    url: 'pmtiles://' + tilesUrl,
    attribution: 'test-data'
  });
  map.addLayer({
    id: 'skhb-1-layer',
    type: 'circle',
    source: 'pmtiles',
    'source-layer': 'tokyo_hinan',
    paint: {
      'circle-color': '#6666cc',
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5, 2,
        14, 6,
      ],
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff'
    },
    filter: ['==', ['get', 'FLOOD'], 1]
  });
  map.addLayer({
    id: 'skhb-2-layer',
    type: 'circle',
    source: 'pmtiles',
    'source-layer': 'tokyo_hinan',
    paint: {
      'circle-color': '#6666cc',
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5, 2,
        14, 6,
      ],
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff'
    },
    filter: ['==', ['get', 'HIGHTIDE'], 1]
  });
  map.addLayer({
    id: 'skhb-3-layer',
    type: 'circle',
    source: 'pmtiles',
    'source-layer': 'tokyo_hinan',
    paint: {
      'circle-color': '#6666cc',
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5, 2,
        14, 6,
      ],
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff'
    },
    filter: ['==', ['get', 'TSUNAMI'], 1]
  });
  map.addLayer({
    id: 'skhb-4-layer',
    type: 'circle',
    source: 'pmtiles',
    'source-layer': 'tokyo_hinan',
    paint: {
      'circle-color': '#6666cc',
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5, 2,
        14, 6,
      ],
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff'
    },
    filter: ['==', ['get', 'EARTHQUAKE'], 1]
  });

  const opacitySkhb = new OpacityControl({
    baseLayers: {
      'skhb-1-layer': '洪水',
      'skhb-2-layer': '高潮',
      'skhb-3-layer': '津波',
      'skhb-4-layer': '地震'
    }
  });
  map.addControl(opacitySkhb, 'top-right');

  const opacityControl = new OpacityControl({
    baseLayers: {
      'hazard_flood-layer': '洪水浸水想定区域',
      'hazard_hightide-layer': '高潮浸水想定区域',
      'hazard_tsunami-layer': '津波浸水想定区域',
      'hazard_doseki-layer': '土石流警戒区域',
      'hazard_kyukeisha-layer': '急傾斜警戒区域',
      'hazard_jisuberi-layer': '地すべり警戒区域'
    }
  });
  map.addControl(opacityControl, 'top-left');

  map.on('mousemove', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: [
        'skhb-1-layer',
        'skhb-2-layer',
        'skhb-3-layer',
        'skhb-4-layer'
      ]
    })
    if (features.length > 0) {
      map.getCanvas().style.cursor = 'pointer';
    } else {
      map.getCanvas().style.cursor = '';
    }
  });

  map.on('click', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: [
        'skhb-1-layer',
        'skhb-2-layer',
        'skhb-3-layer',
        'skhb-4-layer'
      ]
    })
    if (features.length === 0) return;
    const feature = features[0];
    const popup = new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`
        <h3>${feature.properties['NAME']}</h3>
        <p>Address: ${feature.properties['ADDRESS']}</p>
        <p>Flood: ${feature.properties['FLOOD']}</p>
        <p>High Tide: ${feature.properties['HIGHTIDE']}</p>
        <p>Tsunami: ${feature.properties['TSUNAMI']}</p>
        <p>Earthquake: ${feature.properties['EARTHQUAKE']}</p>
      `)
      .addTo(map);
  })

  let userLocation = null;

  const geolocationControl = new maplibregl.GeolocateControl({
    trackUserLocation: true,
  });
  map.addControl(geolocationControl, 'bottom-right');
  geolocationControl.on('geolocate', (e) => {
    userLocation = [e.coords.longitude, e.coords.latitude];
  });


  map.on('render', () => {
    if (geolocationControl._watchState === 'OFF') userLocation = null;

    // ライン形状をリセット
    if (map.getZoom() < 7 || userLocation === null) {
      map.getSource('route').setData({
        type: 'FeatureCollection',
        features: []
      });
      return;
    }

    const nearestFeature = getNearestFeature(userLocation[0], userLocation[1]);

    // 直線ライン
    const routeFeature = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          userLocation,
          nearestFeature._geometry.coordinates
        ]
      }
    };
    map.getSource('route').setData({
      type: 'FeatureCollection',
      features: [routeFeature]
    });
  });

  const gsiTerrainSource = useGsiTerrainSource(maplibregl.addProtocol);
  map.addSource('gsi-terrain', gsiTerrainSource);
  map.addLayer({
    id: 'hillshade',
    type: 'hillshade',
    source: 'gsi-terrain',
    paint: {
      'hillshade-illumination-anchor': 'map',
      'hillshade-exaggeration': 0.2
    }
  }, 'hazard_jisuberi-layer');
  map.addControl(
    new maplibregl.TerrainControl({
      source: 'gsi-terrain',
      exaggeration: 1
    })
  )
});
