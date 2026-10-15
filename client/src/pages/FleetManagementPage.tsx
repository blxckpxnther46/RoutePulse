import React, { useState } from 'react';
import { Vehicle, Route } from '../types/index.js';
import { 
  Bus, 
  Filter, 
  BatteryCharging, 
  User, 
  Gauge, 
  ShieldCheck, 
  AlertOctagon, 
  AlertTriangle, 
  ArrowUpRight,
  SlidersHorizontal 
} from 'lucide-react';
import { getStatusBadgeClass, getUtilizationColor } from '../utils/formatters.js';
import { VehicleDetailModal } from '../components/map/VehicleDetailModal.js';

interface FleetManagementPageProps {
  vehicles: Vehicle[];
  routes: Route[];
  onUpdateVehicleRoute: (vehicleId: string, newRouteId: string | null) => Promise<void>;
}

export const FleetManagementPage: React.FC<FleetManagementPageProps> = ({
  vehicles,
  routes,
  onUpdateVehicleRoute,
}) => {
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedCapacityFilter, setSelectedCapacityFilter] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const routesMap = new Map(routes.map(r => [r.id, r]));

  // Filtering logic
  const filteredVehicles = vehicles.filter(v => {
    if (selectedRouteFilter !== 'all' && v.assignedRouteId !== selectedRouteFilter) return false;
    if (selectedStatusFilter !== 'all' && v.status !== selectedStatusFilter) return false;
    
    const utilPct = v.capacity > 0 ? (v.currentPassengers / v.capacity) * 100 : 0;
    if (selectedCapacityFilter === 'overcrowded' && utilPct < 100) return false;
    if (selectedCapacityFilter === 'nearing' && (utilPct < 85 || utilPct >= 100)) return false;
    if (selectedCapacityFilter === 'underutilized' && utilPct >= 40) return false;

    return true;
  });

  const totalSeats = vehicles.reduce((sum, v) => sum + v.capacity, 0);
  const totalOccupied = vehicles.reduce((sum, v) => sum + v.currentPassengers, 0);
  const overallFleetLoadPct = totalSeats > 0 ? Math.round((totalOccupied / totalSeats) * 100) : 0;
  const activeCount = vehicles.filter(v => v.status === 'in_service' || v.status === 'in_transit').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'maintenance').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Fleet Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Campus Fleet Inventory & Real-Time Status</h2>
          <p className="text-xs text-slate-500">
            Monitor vehicle capacities, live passenger occupancy load, driver rosters, and route corridor allocations
          </p>
        </div>

        {/* Aggregate Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
            Total Fleet Capacity: <span className="font-mono font-bold text-slate-900">{totalOccupied} / {totalSeats} seats ({overallFleetLoadPct}%)</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800">
            {activeCount} Active In Service
          </div>
          {maintenanceCount > 0 && (
            <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700 animate-pulse">
              {maintenanceCount} In Maintenance
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Route Filter */}
          <select
            value={selectedRouteFilter}
            onChange={(e) => setSelectedRouteFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Routes</option>
            {routes.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Service Statuses</option>
            <option value="in_service">In Service</option>
            <option value="in_transit">In Transit</option>
            <option value="idle">Idle / Standby</option>
            <option value="maintenance">Maintenance / Breakdown</option>
          </select>

          {/* Capacity Utilization Filter */}
          <select
            value={selectedCapacityFilter}
            onChange={(e) => setSelectedCapacityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Capacity Loads</option>
            <option value="overcrowded">Overcrowded (&gt;= 100%)</option>
            <option value="nearing">Near Capacity (85% - 99%)</option>
            <option value="underutilized">Underutilized (&lt; 40%)</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Showing {filteredVehicles.length} of {vehicles.length} vehicles
        </span>
      </div>

      {/* Fleet Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Vehicle ID & Name</th>
                <th className="py-3 px-4">Type & Model</th>
                <th className="py-3 px-4">Corridor Route</th>
                <th className="py-3 px-4">Occupancy Load</th>
                <th className="py-3 px-4">Schedule Deviation</th>
                <th className="py-3 px-4">Driver & Battery</th>
                <th className="py-3 px-4">Service Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredVehicles.map(vehicle => {
                const route = vehicle.assignedRouteId ? routesMap.get(vehicle.assignedRouteId) : null;
                const utilPct = vehicle.capacity > 0 ? Math.round((vehicle.currentPassengers / vehicle.capacity) * 100) : 0;
                const isOvercrowded = utilPct >= 100;
                const isNearing = utilPct >= 85 && utilPct < 100;

                return (
                  <tr
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                          {vehicle.id}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{vehicle.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">{vehicle.licensePlate}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 capitalize block">
                        {vehicle.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-500">{vehicle.model}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      {route ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: route.color }}></span>
                          <span className="font-semibold text-slate-800">{route.name}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Standby Reserve
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-slate-800">
                            {vehicle.currentPassengers}/{vehicle.capacity} seats
                          </span>
                          <span className="font-mono font-bold" style={{ color: getUtilizationColor(utilPct) }}>
                            {utilPct}%
                          </span>
                        </div>
                        <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, utilPct)}%`,
                              backgroundColor: getUtilizationColor(utilPct),
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold">
                      {vehicle.scheduleDeviationMinutes === 0 ? (
                        <span className="text-emerald-700">On Time (0m)</span>
                      ) : vehicle.scheduleDeviationMinutes > 0 ? (
                        <span className={vehicle.scheduleDeviationMinutes >= 4 ? 'text-rose-600 font-bold' : 'text-amber-600'}>
                          +{vehicle.scheduleDeviationMinutes}m Late
                        </span>
                      ) : (
                        <span className="text-blue-600">{vehicle.scheduleDeviationMinutes}m Ahead</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{vehicle.driverName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 font-mono">
                        <BatteryCharging className="w-3 h-3 text-slate-400" />
                        <span>{vehicle.batteryLevelPct !== undefined ? `${vehicle.batteryLevelPct}% charge` : 'CNG Eco'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadgeClass(vehicle.status)}`}>
                        {vehicle.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVehicle(vehicle);
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5"
                      >
                        <span>Reassign / Inspect</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle Detail Modal */}
      <VehicleDetailModal
        vehicle={selectedVehicle}
        routes={routes}
        onClose={() => setSelectedVehicle(null)}
        onUpdateVehicleRoute={onUpdateVehicleRoute}
      />
    </div>
  );
};
