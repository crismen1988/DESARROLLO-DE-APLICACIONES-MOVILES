import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Tour, Place, GeoCoordinate } from '../types';
import { calculateDistanceKm } from '../utils/geo';
import { Navigation, RefreshCw } from 'lucide-react';

interface MapViewProps {
  tours: Tour[];
  places: Place[];
  userLocation: GeoCoordinate;
  isUsingGps: boolean;
  isGpsLoading: boolean;
  onLocateUser: () => Promise<void>;
  onSelectTour?: (tour: Tour) => void;
  onSelectPlace?: (place: Place) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  tours,
  places,
  userLocation,
  isUsingGps,
  isGpsLoading,
  onLocateUser,
  onSelectTour,
  onSelectPlace,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [selectedItem, setSelectedItem] = useState<{ type: 'tour' | 'place'; data: any } | null>(null);
  const [routeSummary, setRouteSummary] = useState<string | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.latitude, userLocation.longitude],
        zoom: 13,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Add zoom control at top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        routeLayerRef.current?.remove();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Mantiene el mapa centrado cuando llega una lectura GPS nueva o cambia la referencia.
  useEffect(() => {
    mapInstanceRef.current?.flyTo([userLocation.latitude, userLocation.longitude], 14, { duration: 1.2 });
  }, [userLocation.latitude, userLocation.longitude]);

  // Update Markers whenever filters or data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Add user location marker
    const userIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="w-6 h-6 bg-teal-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div class="w-2 h-2 bg-white rounded-full"></div>
        </div>
        <div class="absolute w-10 h-10 bg-teal-400/40 rounded-full animate-ping pointer-events-none"></div>
      </div>
    `;
    const userMarkerIcon = L.divIcon({
      html: userIconHtml,
      className: 'custom-user-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
      icon: userMarkerIcon,
    }).addTo(markersGroup);

    userMarker.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px;">
        <strong style="color: #0f766e; font-size: 13px;">${isUsingGps ? 'Tu ubicación actual' : 'Punto de referencia'}</strong>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">${userLocation.name}</p>
      </div>
    `);

    // 2. Add Tours Markers
    tours.forEach(tour => {
      if (activeCategory !== 'Todos' && activeCategory !== tour.category) return;

      const dist = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        tour.latitude,
        tour.longitude
      );

      const tourIconHtml = `
        <div style="
          background: #0d9488;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);
          border: 2px solid white;
          font-size: 14px;
        ">
          ${tour.category === 'Aventura' ? '🧗' : tour.category === 'Cascadas' ? '🌊' : '🌲'}
        </div>
      `;

      const marker = L.marker([tour.latitude, tour.longitude], {
        icon: L.divIcon({
          html: tourIconHtml,
          className: 'custom-tour-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      }).addTo(markersGroup);

      marker.on('click', () => {
        setSelectedItem({ type: 'tour', data: { ...tour, distanceKm: dist } });
      });
    });

    // 3. Add Places Markers (Comida, Hoteles, Termas)
    places.forEach(place => {
      if (activeCategory !== 'Todos' && activeCategory !== place.category) return;

      const dist = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        place.latitude,
        place.longitude
      );

      const color =
        place.category === 'Comida'
          ? '#059669'
          : place.category === 'Termas'
          ? '#0d9488'
          : place.category === 'Airbnb'
          ? '#b45309'
          : place.category === 'Mirador'
          ? '#7c3aed'
          : '#334155';

      const markerLabel =
        place.category === 'Comida'
          ? 'C'
          : place.category === 'Termas'
          ? 'T'
          : place.category === 'Airbnb'
          ? 'A'
          : place.category === 'Mirador'
          ? 'M'
          : 'H';

      const placeIconHtml = `
        <div style="
          background: ${color};
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 5px rgba(0,0,0,0.3);
          border: 2px solid white;
          font-size: 13px;
        ">
          ${markerLabel}
        </div>
      `;

      const marker = L.marker([place.latitude, place.longitude], {
        icon: L.divIcon({
          html: placeIconHtml,
          className: 'custom-place-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      }).addTo(markersGroup);

      marker.on('click', () => {
        setSelectedItem({ type: 'place', data: { ...place, distanceKm: dist } });
      });
    });
  }, [tours, places, userLocation, activeCategory, isUsingGps]);

  // Obtiene la ruta vial; si no hay red conserva una referencia directa útil.
  useEffect(() => {
    const map = mapInstanceRef.current;
    routeLayerRef.current?.remove();
    routeLayerRef.current = null;
    setRouteSummary(null);
    if (!map || !selectedItem) return;

    const destination = selectedItem.data as { latitude: number; longitude: number };
    const controller = new AbortController();
    let disposed = false;
    const timeout = window.setTimeout(() => controller.abort(), 8_000);
    const drawFallback = () => {
      const points: L.LatLngExpression[] = [
        [userLocation.latitude, userLocation.longitude],
        [destination.latitude, destination.longitude],
      ];
      routeLayerRef.current = L.polyline(points, { color: '#d97706', weight: 4, dashArray: '7 8' }).addTo(map);
      const distance = calculateDistanceKm(userLocation.latitude, userLocation.longitude, destination.latitude, destination.longitude);
      setRouteSummary(`${distance} km en línea directa · ruta vial no disponible sin conexión`);
      map.fitBounds(routeLayerRef.current.getBounds(), { padding: [36, 36], maxZoom: 15 });
    };

    void fetch(
      `https://router.project-osrm.org/route/v1/driving/${userLocation.longitude},${userLocation.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`,
      { signal: controller.signal }
    )
      .then(async response => {
        if (!response.ok) throw new Error('Ruta no disponible');
        const payload = await response.json() as {
          routes?: Array<{ distance: number; duration: number; geometry: { coordinates: Array<[number, number]> } }>;
        };
        const route = payload.routes?.[0];
        if (!route) throw new Error('Ruta no encontrada');
        const points = route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude] as L.LatLngExpression);
        routeLayerRef.current = L.polyline(points, { color: '#0d9488', weight: 5, opacity: 0.9 }).addTo(map);
        setRouteSummary(`${(route.distance / 1000).toFixed(1)} km · ${Math.max(1, Math.round(route.duration / 60))} min aprox.`);
        map.fitBounds(routeLayerRef.current.getBounds(), { padding: [36, 36], maxZoom: 15 });
      })
      .catch(() => { if (!disposed) drawFallback(); })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      controller.abort();
      routeLayerRef.current?.remove();
      routeLayerRef.current = null;
    };
  }, [selectedItem, userLocation.latitude, userLocation.longitude]);

  const recenterMap = (lat: number, lng: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
    }
  };

  return (
    <div className="relative w-full h-[min(600px,68dvh)] min-h-[420px] flex flex-col rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      {/* Category Pills Header */}
      <div className="absolute top-3 left-3 right-14 z-[400] flex gap-1.5 overflow-x-auto pb-1 no-scrollbar pointer-events-auto">
        {['Todos', 'Cascadas', 'Aventura', 'Comida', 'Hotel', 'Hostal', 'Hostería', 'Airbnb', 'Termas', 'Mirador'].map(
          cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-md backdrop-blur-md transition-all ${
                activeCategory === cat
                  ? 'bg-teal-600 text-white shadow-teal-500/30'
                  : 'bg-white/95 text-slate-700 hover:bg-white border border-slate-200'
              }`}
            >
              {cat}
            </button>
          )
        )}
      </div>

      {/* Current position and recenter controls */}
      <div className="absolute bottom-6 right-4 z-[400] flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => void onLocateUser()}
          disabled={isGpsLoading}
          title="Actualizar mi ubicación"
          aria-label="Actualizar mi ubicación"
          className="w-11 h-11 rounded-full bg-teal-600 text-white shadow-xl border border-white flex items-center justify-center hover:bg-teal-500 active:scale-95 transition-all disabled:opacity-70"
        >
          <RefreshCw className={`w-5 h-5 ${isGpsLoading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => recenterMap(userLocation.latitude, userLocation.longitude)}
          title="Centrar en mi posición"
          aria-label="Centrar en mi posición"
          className="w-11 h-11 rounded-full bg-white text-teal-700 shadow-xl border border-slate-200 flex items-center justify-center hover:bg-teal-50 active:scale-95 transition-all"
        >
          <Navigation className="w-5 h-5 text-teal-600" />
        </button>
      </div>

      <div className="absolute left-3 bottom-3 z-[350] rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-[10px] font-bold text-slate-700 shadow-md backdrop-blur-md pointer-events-none">
        {isUsingGps ? 'Ubicación del dispositivo' : `Referencia: ${userLocation.name}`}
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Selected Item Floating Bottom Sheet */}
      {selectedItem && (
        <div className="absolute bottom-3 left-3 right-16 z-[400] bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-slate-200 animate-slide-up pointer-events-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                  {selectedItem.data.category}
                </span>
                <span className="text-xs font-bold text-teal-600 flex items-center gap-0.5">
                  <Navigation className="w-3 h-3" />
                  {selectedItem.data.distanceKm} km de ti
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 truncate">
                {selectedItem.data.title || selectedItem.data.name}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                {selectedItem.data.description || selectedItem.data.address}
              </p>
              {routeSummary && <p className="mt-1 text-[11px] font-semibold text-teal-700">Ruta: {routeSummary}</p>}
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {selectedItem.type === 'tour' && (
                <button
                  onClick={() => {
                    if (onSelectTour) onSelectTour(selectedItem.data);
                  }}
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow active:scale-95"
                >
                  Ver / Reservar
                </button>
              )}
              {selectedItem.type === 'place' && (
                <button
                  onClick={() => {
                    if (onSelectPlace) onSelectPlace(selectedItem.data);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow active:scale-95"
                >
                  Ver Detalles
                </button>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedItem.data.latitude},${selectedItem.data.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold text-teal-700 hover:text-teal-800"
              >
                Iniciar navegación
              </a>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
