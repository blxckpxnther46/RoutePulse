import React from 'react';
import { Route, Vehicle, Stop } from '../../types/index.js';
import { ChevronRight, Bus, Users, Clock, AlertCircle } from 'lucide-react';
import { getUtilizationColor } from '../../utils/formatters.js';

interface RoutePerformanceTableProps {
  routes: Route[];
  vehicles: Vehicle[];
  stops: Stop[];
  onSelectRoute?: (routeId: string) => void;
  selectedRouteId?: string | null;
}

export const RoutePerformanceTable: React.FC<RoutePerformanceTableProps> = ({
  routes,
  vehicles,
  stops,
  onSelectRoute,
  selectedRouteId,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Campus Route Operational Matrix</h3>
          <p className="text-xs text-slate-500">Live corridor load, frequency adherence, and vehicle allocations</p>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
          {routes.length} Active Corridors
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Route Name & Corridor</th>
              <th className="py-3 px-4">Headway</th>
              <th className="py-3 px-4">Operating Fleet</th>
              <th className="py-3 px-4">Active Pax Load</th>
              <th className="py-3 px-4">Corridor Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {routes.map(route => {
              const assigned = vehicles.filter(v => v.assignedRouteId === route.id);
              const totalCap = assigned.reduce((sum, v) => sum + v.capacity, 0);
              const currentPax = assigned.reduce((sum, v) => sum + v.currentPassengers, 0);
              const utilization = totalCap > 0 ? Math.round((currentPax / totalCap) * 100) : 0;
              const hasBrokenVehicle = assigned.some(v => v.status === 'maintenance');
              const isSelected = selectedRouteId === route.id;

              return (
                <tr
                  key={route.id}
                  onClick={() => onSelectRoute?.(route.id)}
                  className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/80 font-medium' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: route.color }}></span>
                      <div>
                        <span className="font-bold text-slate-900 block">{route.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{route.stops.length} stops • {route.operatingWindow.start} - {route.operatingWindow.end}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                    {route.headwayMinutes} min
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {assigned.length === 0 ? (
                        <span className="text-rose-600 font-semibold text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          No Vehicles Assigned
                        </span>
                      ) : (
                        assigned.map(v => (
                          <span
                            key={v.id}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              v.status === 'maintenance'
                                ? 'bg-rose-100 text-rose-700 border-rose-300'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            {v.id}
                          </span>
                        ))
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, utilization)}%`,
                            backgroundColor: getUtilizationColor(utilization),
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {currentPax}/{totalCap} ({utilization}%)
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {hasBrokenVehicle ? (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-600" /> Vehicle Down
                      </span>
                    ) : utilization >= 100 ? (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        Capacity Violated
                      </span>
                    ) : utilization >= 85 ? (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        Near Capacity
                      </span>
                    ) : utilization < 30 ? (
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        Underutilized
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Balanced Flow
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRoute?.(route.id);
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 group"
                    >
                      <span>Highlight</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
