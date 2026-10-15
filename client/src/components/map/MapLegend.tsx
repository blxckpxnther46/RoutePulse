import React, { useState } from 'react';
import { Route } from '../../types/index.js';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface MapLegendProps {
  routes: Route[];
}

export const MapLegend: React.FC<MapLegendProps> = ({ routes }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg text-xs overflow-hidden max-w-[280px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>Interactive Map Legend</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-3 space-y-3 max-h-[320px] overflow-y-auto">
          {/* Active Routes */}
          <div>
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1.5">
              Campus Shuttle Routes
            </span>
            <div className="space-y-1.5">
              {routes.map(r => (
                <div key={r.id} className="flex items-center gap-2">
                  <span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: r.color }}></span>
                  <span className="text-[11px] font-medium text-slate-800 truncate">{r.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* Stop Congestion */}
          <div>
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1.5">
              Stop Passenger Queue
            </span>
            <div className="grid grid-cols-1 gap-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600">&lt; 25 waiting (Normal flow)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-600">25 - 39 waiting (Approaching surge)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <span className="text-slate-600">40+ waiting (Severe bottleneck)</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* Vehicle Capacity */}
          <div>
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1.5">
              Vehicle Capacity Status
            </span>
            <div className="grid grid-cols-1 gap-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded text-[9px] font-bold">48/50</span>
                <span className="text-slate-600">Healthy occupancy (&lt; 85%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded text-[9px] font-bold">36/40</span>
                <span className="text-slate-600">Near capacity (85% - 99%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded text-[9px] font-bold">52/50</span>
                <span className="text-slate-600">Capacity violation (100%+)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
