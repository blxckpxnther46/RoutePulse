import React from 'react';
import { Departure } from '../../types/index.js';
import { Clock, ArrowUpRight, Bus, AlertCircle } from 'lucide-react';
import { getStatusBadgeClass } from '../../utils/formatters.js';

interface UpcomingDeparturesPanelProps {
  departures: Departure[];
  onSelectDeparture?: (dep: Departure) => void;
}

export const UpcomingDeparturesPanel: React.FC<UpcomingDeparturesPanelProps> = ({
  departures,
  onSelectDeparture,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Upcoming Campus Departures</h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          Live Feed • Next 10
        </span>
      </div>

      {departures.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No departures scheduled in current operating window.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {departures.map(dep => (
            <div
              key={dep.id}
              onClick={() => onSelectDeparture?.(dep)}
              className="p-3 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dep.routeColor }}></span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      {dep.stopName}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getStatusBadgeClass(dep.status)}`}>
                      {dep.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1 font-medium">
                      <Bus className="w-3 h-3 text-slate-400" />
                      {dep.vehicleName} ({dep.routeId})
                    </span>
                    <span>•</span>
                    <span className={dep.availableCapacity <= 2 ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                      {dep.availableCapacity} seats open
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-xs font-bold font-mono text-slate-900 group-hover:text-blue-700">
                    {dep.etaWindow}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  sched. {dep.scheduledTime}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
