import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Route, Stop, Vehicle } from '../../types/index.js';
import { Layers, ZoomIn, ZoomOut, Maximize2, Filter, AlertTriangle, Bus, MapPin, Eye, EyeOff } from 'lucide-react';
import { MapLegend } from './MapLegend.js';

interface TransportMapProps {
  routes: Route[];
  stops: Stop[];
  vehicles: Vehicle[];
  selectedRouteId?: string | null;
  selectedVehicleId?: string | null;
  selectedStopId?: string | null;
  onSelectRoute?: (routeId: string | null) => void;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  onSelectStop?: (stop: Stop) => void;
  heightClass?: string;
}

export const TransportMap: React.FC<TransportMapProps> = ({
  routes,
  stops,
  vehicles,
  selectedRouteId,
  selectedVehicleId,
  selectedStopId,
  onSelectRoute,
  onSelectVehicle,
  onSelectStop,
  heightClass = 'h-[540px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<L.LayerGroup | null>(null);
  const stopMarkersRef = useRef<L.LayerGroup | null>(null);
  const vehicleMarkersRef = useRef<L.LayerGroup | null>(null);

  const [showRoutes, setShowRoutes] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [filterCongestedOnly, setFilterCongestedOnly] = useState(false);
  const [activeFilterRouteId, setActiveFilterRouteId] = useState<string>('all');

  // Initial map setup
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on fictional Chennai campus
    const map = L.map(mapContainerRef.current, {
      center: [12.8398, 80.1550],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    routeLayersRef.current = L.layerGroup().addTo(map);
    stopMarkersRef.current = L.layerGroup().addTo(map);
    vehicleMarkersRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Invalidate size once container rendered
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = routeLayersRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    if (!showRoutes) return;

    const routesToRender = activeFilterRouteId === 'all'
      ? routes
      : routes.filter(r => r.id === activeFilterRouteId);

    routesToRender.forEach(route => {
      const isSelected = selectedRouteId === route.id;
      const polyline = L.polyline(route.waypoints, {
        color: route.color,
        weight: isSelected ? 7 : 4,
        opacity: isSelected ? 1.0 : (selectedRouteId ? 0.35 : 0.8),
        dashArray: isSelected ? undefined : '6, 6',
        lineCap: 'round',
        lineJoin: 'round',
      });

      polyline.on('click', () => {
        if (onSelectRoute) {
          onSelectRoute(isSelected ? null : route.id);
        }
      });

      polyline.bindTooltip(
        `<div class="font-sans font-semibold text-xs px-1.5 py-0.5" style="color: ${route.color}">
          ${route.name} (${route.headwayMinutes}m headway)
        </div>`,
        { sticky: true, opacity: 0.95 }
      );

      layerGroup.addLayer(polyline);

      // Start/End terminal marker
      if (route.waypoints.length > 0) {
        const startPt = route.waypoints[0];
        const terminalIcon = L.divIcon({
          className: 'custom-terminal-icon',
          html: `<div style="background-color: ${route.color};" class="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                  <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                 </div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const termMarker = L.marker(startPt, { icon: terminalIcon });
        layerGroup.addLayer(termMarker);
      }
    });
  }, [routes, selectedRouteId, showRoutes, activeFilterRouteId, onSelectRoute]);

  // Update Stop Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = stopMarkersRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    if (!showStops) return;

    const stopsToRender = filterCongestedOnly
      ? stops.filter(s => s.waitingPassengers >= 25)
      : stops;

    stopsToRender.forEach(stop => {
      const isSelected = selectedStopId === stop.id;
      const isCritical = stop.waitingPassengers >= 40;
      const isWarning = stop.waitingPassengers >= 25;

      let badgeBg = 'bg-blue-600';
      if (isCritical) badgeBg = 'bg-rose-600 ring-4 ring-rose-400/40 marker-pulse-critical';
      else if (isWarning) badgeBg = 'bg-amber-500 ring-4 ring-amber-300/40 marker-pulse-warning';

      const html = `
        <div class="relative group cursor-pointer">
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/95 backdrop-blur-sm border ${isSelected ? 'border-blue-600 ring-2 ring-blue-500 shadow-lg scale-110' : 'border-slate-300 shadow-sm'} transition-transform">
            <span class="w-2.5 h-2.5 rounded-full ${isCritical ? 'bg-rose-500 animate-ping' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}"></span>
            <span class="text-[11px] font-semibold text-slate-800 whitespace-nowrap max-w-[110px] truncate">${stop.name}</span>
            <span class="text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full ${badgeBg}">${stop.waitingPassengers}</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-stop-marker',
        html,
        iconSize: [120, 26],
        iconAnchor: [60, 13],
      });

      const marker = L.marker([stop.lat, stop.lng], { icon });

      marker.on('click', () => {
        if (onSelectStop) {
          onSelectStop(stop);
        }
      });

      layerGroup.addLayer(marker);
    });
  }, [stops, selectedStopId, showStops, filterCongestedOnly, onSelectStop]);

  // Update Vehicle Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = vehicleMarkersRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    if (!showVehicles) return;

    const vehiclesToRender = activeFilterRouteId === 'all'
      ? vehicles
      : vehicles.filter(v => v.assignedRouteId === activeFilterRouteId);

    vehiclesToRender.forEach(vehicle => {
      const isSelected = selectedVehicleId === vehicle.id;
      const isBroken = vehicle.status === 'maintenance';
      const isOvercrowded = vehicle.capacity > 0 && (vehicle.currentPassengers / vehicle.capacity) >= 1.0;
      const isNearingCap = vehicle.capacity > 0 && (vehicle.currentPassengers / vehicle.capacity) >= 0.85;

      const route = routes.find(r => r.id === vehicle.assignedRouteId);
      const routeColor = route?.color || '#64748b';

      let statusRingClass = 'ring-2 ring-emerald-500';
      if (isBroken) statusRingClass = 'ring-4 ring-rose-500 opacity-60';
      else if (isOvercrowded) statusRingClass = 'ring-4 ring-rose-500 marker-pulse-critical';
      else if (isNearingCap) statusRingClass = 'ring-3 ring-amber-500';

      const html = `
        <div class="relative cursor-pointer transition-all duration-300 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
          <div class="flex items-center gap-1 bg-slate-900 text-white px-2 py-1 rounded-md shadow-xl border-2" style="border-color: ${routeColor}">
            <!-- Bus Icon -->
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5c-.3-1-1.1-1.8-2.2-1.8H4.8c-1.1 0-1.9.8-2.2 1.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2C1.5 16.3 2 18 2 18h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
            </svg>
            <span class="text-[11px] font-bold font-mono text-white">${vehicle.id}</span>
            <span class="text-[9px] px-1 rounded font-semibold ${isOvercrowded ? 'bg-rose-500 text-white' : isNearingCap ? 'bg-amber-400 text-slate-900' : 'bg-emerald-500 text-white'}">
              ${vehicle.currentPassengers}/${vehicle.capacity}
            </span>
          </div>
          <!-- Orientation Pointer Arrow -->
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-slate-900 border-b-2 border-r-2" style="border-color: ${routeColor}"></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-vehicle-marker',
        html,
        iconSize: [68, 28],
        iconAnchor: [34, 14],
      });

      const marker = L.marker([vehicle.currentLocation.lat, vehicle.currentLocation.lng], { icon });

      marker.on('click', () => {
        if (onSelectVehicle) {
          onSelectVehicle(vehicle);
        }
      });

      layerGroup.addLayer(marker);
    });
  }, [vehicles, routes, selectedVehicleId, showVehicles, activeFilterRouteId, onSelectVehicle]);

  // Center/Fit map to all routes
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map || stops.length === 0) return;
    const latLngs = stops.map(s => [s.lat, s.lng] as [number, number]);
    map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100`}>
      {/* Map DOM Node */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Banner Notice: Simulated Campus Mobility Network */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-slate-900/90 text-white px-3 py-1.5 rounded-lg shadow-md backdrop-blur-sm border border-slate-700 text-xs font-medium">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Simulated Campus Transit Model — CIATR Chennai Campus (OMR Corridor)</span>
        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600">Synthetic GPS</span>
      </div>

      {/* Top-Right Control Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {/* Route Filter Dropdown */}
        <div className="relative">
          <select
            value={activeFilterRouteId}
            onChange={(e) => setActiveFilterRouteId(e.target.value)}
            className="bg-white/95 backdrop-blur-sm border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Routes ({routes.length})</option>
            {routes.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Congestion Toggle */}
        <button
          onClick={() => setFilterCongestedOnly(!filterCongestedOnly)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors border ${
            filterCongestedOnly
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title="Highlight overcrowded stops"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>Congested Only</span>
        </button>

        {/* Layer Visibility Toggles */}
        <div className="flex bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-0.5 shadow-sm text-xs font-medium">
          <button
            onClick={() => setShowRoutes(!showRoutes)}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
              showRoutes ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Toggle Routes"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Routes</span>
          </button>
          <button
            onClick={() => setShowVehicles(!showVehicles)}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
              showVehicles ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Toggle Vehicles"
          >
            <Bus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Shuttles</span>
          </button>
          <button
            onClick={() => setShowStops(!showStops)}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
              showStops ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Toggle Stops"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Stops</span>
          </button>
        </div>
      </div>

      {/* Floating Zoom & Fit Controls */}
      <div className="absolute bottom-6 right-3 z-10 flex flex-col gap-1.5 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-1 shadow-md">
        <button
          onClick={handleZoomIn}
          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-px bg-slate-200 my-0.5"></div>
        <button
          onClick={handleFitBounds}
          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
          title="Fit All Routes"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-6 left-3 z-10">
        <MapLegend routes={routes} />
      </div>
    </div>
  );
};
