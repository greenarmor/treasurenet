'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface TreasureMapProps {
  userLocation: { lat: number; lng: number } | null;
}

export default function TreasureMap({ userLocation }: TreasureMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const defaultCenter: [number, number] = userLocation
      ? [userLocation.lng, userLocation.lat]
      : [-74.006, 40.7128];

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: defaultCenter,
      zoom: 15,
      attributionControl: false,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => setMapReady(true));

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapReady || !userLocation) return;

    const coords: [number, number] = [userLocation.lng, userLocation.lat];

    if (userMarker.current) {
      userMarker.current.setLngLat(coords);
    } else {
      const el = document.createElement('div');
      el.className = 'w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg pulse-dot';
      el.innerHTML = '<div class="w-3 h-3 mx-auto mt-1 bg-blue-300 rounded-full animate-ping"></div>';

      userMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat(coords)
        .addTo(map.current);
    }

    map.current.flyTo({ center: coords, zoom: 15, duration: 1000 });
  }, [userLocation, mapReady]);

  return (
    <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
  );
}
