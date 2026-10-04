import React, { useState } from 'react';
import { Place, GeoCoordinate } from '../types';
import { calculateDistanceKm } from '../utils/geo';
import { Phone, MapPin, Navigation, Star, Clock, Lightbulb } from 'lucide-react';

interface PlacesViewProps {
  places: Place[];
  userLocation: GeoCoordinate;
  onSelectOnMap: (place: Place) => void;
}

export const PlacesView: React.FC<PlacesViewProps> = ({
  places,
  userLocation,
  onSelectOnMap,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPlaces = places
    .map(p => ({
      ...p,
      distanceKm: calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        p.latitude,
        p.longitude
      ),
    }))
    .filter(p => {
      const matchesCat = activeFilter === 'Todos' || p.category === activeFilter;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  return (
    <div className="space-y-4 pb-20">
      {/* Search and Category Filter */}
      <div className="space-y-2">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar truchas, cafés, hostales, cabañas, termas..."
          className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 shadow-sm"
        />

        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['Todos', 'Comida', 'Hotel', 'Hostal', 'Hostería', 'Airbnb', 'Termas', 'Mirador'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === cat
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Proximity Banner */}
      <div className="bg-teal-50/70 border border-teal-200/60 rounded-xl p-2.5 flex items-center justify-between text-xs text-teal-800">
        <span className="flex items-center gap-1.5 font-medium">
          <Navigation className="w-4 h-4 text-teal-600" />
          Ordenado por proximidad a tu GPS en Baños
        </span>
        <span className="font-bold">{filteredPlaces.length} opciones</span>
      </div>

      {/* Places Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filteredPlaces.map(place => (
          <div
            key={place.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative h-36 w-full">
              <img
                src={place.imageUrl}
                alt={place.name}
                loading="lazy"
                onError={event => { event.currentTarget.src = '/assets/icono_banos_tour.jpg'; }}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {place.category}
                </span>
                <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow">
                  <Navigation className="w-2.5 h-2.5" />
                  {place.distanceKm} km
                </span>
              </div>
              <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-black px-2 py-0.5 rounded-lg shadow">
                {place.priceRange}
              </div>
            </div>

            <div className="p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{place.name}</h3>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    {place.address}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg text-xs font-bold shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  {place.rating}
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">
                {place.description}
              </p>

              <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-[11px] text-slate-600">
                <p className="flex items-start gap-1.5">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
                  <span><strong className="text-slate-800">Horario:</strong> {place.openingHours || 'Consulta el horario antes de visitar.'}</span>
                </p>
                {(place.recommendations ?? []).slice(0, 2).map(recommendation => (
                  <p key={recommendation} className="flex items-start gap-1.5">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span>{recommendation}</span>
                  </p>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {place.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={`tel:${place.phone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> Llamar
                </a>

                <button
                  onClick={() => onSelectOnMap(place)}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl shadow-sm active:scale-95 transition-all"
                >
                  <MapPin className="w-3.5 h-3.5" /> Ver en Mapa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
