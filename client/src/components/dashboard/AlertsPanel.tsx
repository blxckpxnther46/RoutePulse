import React from 'react';
import { Alert } from '../../types/index.js';
import { AlertTriangle, AlertOctagon, Info, ArrowRight } from 'lucide-react';

interface AlertsPanelProps {
  alerts: Alert[];
  onSelectAlert?: (alert: Alert) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onSelectAlert,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-bold text-slate-900">Capacity & Operations Alerts</h3>
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
          alerts.some(a => a.severity === 'critical')
            ? 'bg-rose-100 text-rose-800 animate-pulse'
            : 'bg-amber-100 text-amber-800'
        }`}>
          {alerts.length} Active Notice{alerts.length === 1 ? '' : 's'}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="py-6 text-center text-xs text-emerald-600 font-semibold bg-emerald-50 rounded-lg border border-emerald-100">
          All routes operating within capacity limits and timetable tolerance.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {alerts.map(alert => {
            const isCritical = alert.severity === 'critical';
            return (
              <div
                key={alert.id}
                onClick={() => onSelectAlert?.(alert)}
                className={`p-3 rounded-lg border transition-all cursor-pointer group flex items-start justify-between gap-3 ${
                  isCritical
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400 hover:bg-rose-50'
                    : 'bg-amber-50/40 border-amber-200 hover:border-amber-400 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {isCritical ? (
                      <AlertOctagon className="w-4 h-4 text-rose-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                        {alert.title}
                      </span>
                      {alert.metricValue && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-700">
                          {alert.metricValue}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{alert.message}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Logged at {alert.timestamp} IST
                    </span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-1" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
