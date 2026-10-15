import React from 'react';
import { Stop, Route, Departure } from '../../types/index.js';
import { X, MapPin, Users, Clock, ShieldCheck, ArrowRight, CornerDownRight } from 'lucide-react';
import { getStatusBadgeClass } from '../../utils/formatters.js';

interface StopDetailModalProps {
  stop: Stop | null;
  routes: Route[];
  departures: Departure[];
  onClose: () => void;
  onSelectRoute?: (routeId: string) => void;
}

export const StopDetailModal: React.FC<StopDetailModalProps> = ({
  stop,
  routes,
  departures,
  onClose,
  onSelectRoute,
}) => {
  if (!stop) return null;

  const servingRoutes = routes.filter(r => r.stops.some(rs => rs.stopId === stop.id));
  const upcomingDeparturesForStop = departures.filter(d => d.stopId === stop.id);

  const isOvercrowded = stop.waitingPassengers >= 40;
  const isWarning = stop.waitingPassengers >= 25;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold font-mono text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                {stop.code}
              </span>
              {stop.isTransferHub && (
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <CornerDownRight className="w-3 h-3" /> Transfer Hub
                </span>
              )}
              {stop.isAccessible && (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Accessible
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{stop.name}</h2>
            <p className="text-xs text-slate-500 capitalize">Zone: {stop.zone} • Shelter: {stop.shelterType.replace('_', ' ')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Passenger Queue Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border ${
              isOvercrowded ? 'bg-rose-50 border-rose-200' : isWarning ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
                <span>Waiting Passengers</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-extrabold ${
                  isOvercrowded ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-900'
                }`}>
                  {stop.waitingPassengers}
                </span>
                <span className="text-xs text-slate-500">students queued</span>
              </div>
              <div className="mt-2 text-[11px]">
                {isOvercrowded && <span className="font-semibold text-rose-600">Capacity alert: Queue exceeds platform threshold!</span>}
                {isWarning && !isOvercrowded && <span className="font-semibold text-amber-700">Elevated waiting queue during peak</span>}
                {!isWarning && <span className="text-emerald-700">Normal platform queue</span>}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
                <span>Current Inflow Demand</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">{stop.currentDemandRate}</span>
                <span className="text-xs text-slate-500">passengers / hour</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Peak inflow correlated with lecture bell schedules
              </div>
            </div>
          </div>

          {/* Serving Routes */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Serving Shuttle Routes ({servingRoutes.length})
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {servingRoutes.map(route => (
                <div
                  key={route.id}
                  onClick={() => onSelectRoute?.(route.id)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }}></span>
                    <div>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 block">{route.name}</span>
                      <span className="text-[11px] text-slate-500">{route.headwayMinutes} min scheduled headway</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Departures */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Scheduled & Estimated Arrivals
            </h3>
            {upcomingDeparturesForStop.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                No active shuttles in immediate approach sequence for this stop.
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingDeparturesForStop.map(dep => (
                  <div key={dep.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dep.routeColor }}></span>
                        <span className="text-xs font-bold text-slate-900">{dep.vehicleName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getStatusBadgeClass(dep.status)}`}>
                          {dep.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Route: {dep.routeName} • {dep.availableCapacity} seats open
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-slate-900 block">{dep.etaWindow}</span>
                      <span className="text-[10px] text-slate-500">sched. {dep.scheduledTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
