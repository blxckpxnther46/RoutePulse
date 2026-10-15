import React, { useState } from 'react';
import { Route, Stop, Vehicle, Departure } from '../types/index.js';
import { TransportMap } from '../components/map/TransportMap.js';
import { StopDetailModal } from '../components/map/StopDetailModal.js';
import { VehicleDetailModal } from '../components/map/VehicleDetailModal.js';
import { Bus, Users, MapPin, Gauge, Layers, AlertTriangle } from 'lucide-react';
import { getUtilizationColor, getStatusBadgeClass } from '../utils/formatters.js';

interface LiveMapPageProps {
  routes: Route[];
  stops: Stop[];
  vehicles: Vehicle[];
  upcomingDepartures: Departure[];
  onUpdateVehicleRoute: (vehicleId: string, newRouteId: string | null) => Promise<void>;
}

export const LiveMapPage: React.FC<LiveMapPageProps> = ({
  routes,
  stops,
  vehicles,
  upcomingDepartures,
  onUpdateVehicleRoute,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);

  const activeVehicles = vehicles.filter(v => v.status === 'in_service' || v.status === 'in_transit');
  const overcrowdedVehicles = vehicles.filter(v => v.capacity > 0 && v.currentPassengers / v.capacity >= 1.0);
  const congestedStops = stops.filter(s => s.waitingPassengers >= 25);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls & Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Campus Live Mobility Radar</h2>
          <p className="text-xs text-slate-500">
            Interactive GIS view of CIATR campus shuttle corridors, real-time simulated telemetry, and platform queues
          </p>
        </div>

        {/* Quick Fleet & Queue Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700">
            <Bus className="w-3.5 h-3.5 text-blue-600" />
            <span>{activeVehicles.length} / {vehicles.length} Active Shuttles</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-700">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>{congestedStops.length} Queued Stops</span>
          </div>

          {overcrowdedVehicles.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{overcrowdedVehicles.length} Overcrowded</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Full-Size Map */}
      <TransportMap
        routes={routes}
        stops={stops}
        vehicles={vehicles}
        selectedRouteId={selectedRouteId}
        selectedVehicleId={selectedVehicle?.id}
        selectedStopId={selectedStop?.id}
        onSelectRoute={(id) => setSelectedRouteId(id)}
        onSelectVehicle={(v) => setSelectedVehicle(v)}
        onSelectStop={(s) => setSelectedStop(s)}
        heightClass="h-[620px]"
      />

      {/* Corridor Quick Select & Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {routes.map(r => {
          const isSelected = selectedRouteId === r.id;
          const assigned = vehicles.filter(v => v.assignedRouteId === r.id);
          const totalPax = assigned.reduce((sum, v) => sum + v.currentPassengers, 0);
          const totalCap = assigned.reduce((sum, v) => sum + v.capacity, 0);
          const loadPct = totalCap > 0 ? Math.round((totalPax / totalCap) * 100) : 0;

          return (
            <div
              key={r.id}
              onClick={() => setSelectedRouteId(isSelected ? null : r.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }}></span>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                  {r.headwayMinutes}m
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 truncate mb-1">{r.name}</h4>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{assigned.length} buses</span>
                <span className="font-mono font-semibold" style={{ color: getUtilizationColor(loadPct) }}>
                  {loadPct}% load
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <StopDetailModal
        stop={selectedStop}
        routes={routes}
        departures={upcomingDepartures}
        onClose={() => setSelectedStop(null)}
        onSelectRoute={(routeId) => setSelectedRouteId(routeId)}
      />

      <VehicleDetailModal
        vehicle={selectedVehicle}
        routes={routes}
        onClose={() => setSelectedVehicle(null)}
        onUpdateVehicleRoute={onUpdateVehicleRoute}
      />
    </div>
  );
};
