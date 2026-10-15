import React from 'react';
import { Sliders, Zap, Shield, Clock, Users } from 'lucide-react';

interface OptimizationLabControlsProps {
  demandMultiplier: number;
  trafficMultiplier: number;
  maxWaitThreshold: number;
  priority: string;
  onDemandChange: (val: number) => void;
  onTrafficChange: (val: number) => void;
  onMaxWaitChange: (val: number) => void;
  onPriorityChange: (val: string) => void;
  onRunOptimization: () => void;
  isOptimizing: boolean;
}

export const OptimizationLabControls: React.FC<OptimizationLabControlsProps> = ({
  demandMultiplier,
  trafficMultiplier,
  maxWaitThreshold,
  priority,
  onDemandChange,
  onTrafficChange,
  onMaxWaitChange,
  onPriorityChange,
  onRunOptimization,
  isOptimizing,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Optimization Parameter Workspace</h2>
            <p className="text-xs text-slate-500">Tune operational stress factors and objective weights for algorithm execution</p>
          </div>
        </div>

        <button
          onClick={onRunOptimization}
          disabled={isOptimizing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2"
        >
          <Zap className="w-4 h-4 text-blue-200 fill-current" />
          <span>{isOptimizing ? 'Evaluating Constraints...' : 'Execute Optimizer Engine'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Demand Multiplier Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" /> Demand Multiplier
            </span>
            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {demandMultiplier.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            value={demandMultiplier}
            onChange={(e) => onDemandChange(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0.5x (Night)</span>
            <span>1.0x (Normal)</span>
            <span>2.5x (Event)</span>
          </div>
        </div>

        {/* Traffic Delay Multiplier */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Traffic Delay Factor
            </span>
            <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {trafficMultiplier.toFixed(2)}x (+{Math.round((trafficMultiplier - 1.0) * 100)}%)
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="2.2"
            step="0.05"
            value={trafficMultiplier}
            onChange={(e) => onTrafficChange(parseFloat(e.target.value))}
            className="w-full accent-amber-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>1.0x (Free flow)</span>
            <span>1.5x (+50% delay)</span>
            <span>2.2x (Gridlock)</span>
          </div>
        </div>

        {/* Max Acceptable Waiting Time */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" /> Max Wait Threshold
            </span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {maxWaitThreshold} mins
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="20"
            step="1"
            value={maxWaitThreshold}
            onChange={(e) => onMaxWaitChange(parseInt(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>5 min (Strict)</span>
            <span>10 min (Std)</span>
            <span>20 min (Relaxed)</span>
          </div>
        </div>

        {/* Optimization Objective Priority */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Primary Objective Weight
          </label>
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="eliminate_overcrowding">Eliminate Capacity Violations</option>
            <option value="reduce_waiting">Minimize Average Wait Time</option>
            <option value="improve_punctuality">Maximize Timetable Punctuality</option>
            <option value="balance_resources">Balance Fleet Resource Utilization</option>
          </select>
          <p className="text-[10px] text-slate-400">
            Constrained by vehicle capacity limits and driver shift limits
          </p>
        </div>
      </div>
    </div>
  );
};
