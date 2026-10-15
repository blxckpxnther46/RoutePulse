import React from 'react';
import { 
  Play, 
  Pause, 
  FastForward, 
  RotateCcw, 
  Sparkles, 
  Sliders, 
  Clock, 
  ShieldAlert,
  Building2
} from 'lucide-react';
import { ScenarioType, Scenario, SimulationState } from '../../types/index.js';

interface HeaderProps {
  title: string;
  subtitle?: string;
  simulationState: SimulationState;
  scenarios: Scenario[];
  onSelectScenario: (scenarioId: ScenarioType) => void;
  onStepSimulation: () => void;
  onTogglePlay: () => void;
  onResetSimulation: () => void;
  onRunOptimization: () => void;
  isOptimizing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  simulationState,
  scenarios,
  onSelectScenario,
  onStepSimulation,
  onTogglePlay,
  onResetSimulation,
  onRunOptimization,
  isOptimizing = false,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-20 flex-shrink-0 shadow-xs">
      {/* Title & Campus Indicator */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>{title}</span>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 hidden sm:inline-flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" /> CIATR Chennai Campus
            </span>
          </h1>
          {subtitle && <p className="text-xs text-slate-500 -mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Center / Controls Toolbar */}
      <div className="flex items-center gap-3">
        {/* Simulated Time & Playback Controls */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 font-mono font-bold text-slate-800">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{simulationState.currentTime} IST</span>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          <button
            onClick={onTogglePlay}
            className={`p-1.5 rounded transition-colors ${
              simulationState.isPlaying
                ? 'bg-amber-100 text-amber-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title={simulationState.isPlaying ? 'Pause Simulation' : 'Auto Play Simulation (every 2.5s)'}
          >
            {simulationState.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>

          <button
            onClick={onStepSimulation}
            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-200 rounded transition-colors"
            title="Advance Simulation Step (+2 mins)"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onResetSimulation}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded transition-colors"
            title="Reset Simulation to Baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Operational Scenario Selector */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-semibold text-slate-500 hidden md:inline">Scenario:</label>
          <select
            value={simulationState.currentScenario}
            onChange={(e) => onSelectScenario(e.target.value as ScenarioType)}
            className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-2xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {scenarios.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Run Optimization Primary Action Button */}
        <button
          onClick={onRunOptimization}
          disabled={isOptimizing}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm shadow-blue-500/20 transition-all hover:shadow-md cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-200 animate-pulse" />
          <span>{isOptimizing ? 'Optimizing...' : 'Run Optimization'}</span>
        </button>
      </div>
    </header>
  );
};
