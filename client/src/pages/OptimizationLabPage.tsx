import React, { useState } from 'react';
import { 
  ComparisonReport, 
  OptimizationRecommendation, 
  Scenario, 
  ScenarioType, 
  SimulationState 
} from '../types/index.js';
import { OptimizationLabControls } from '../components/optimization/OptimizationLabControls.js';
import { ComparisonTable } from '../components/optimization/ComparisonTable.js';
import { RecommendationCard } from '../components/optimization/RecommendationCard.js';
import { Cpu, ShieldCheck, Zap, Sparkles, CheckCircle, FileText, Download } from 'lucide-react';
import { api } from '../services/api.js';

interface OptimizationLabPageProps {
  simulationState: SimulationState;
  scenarios: Scenario[];
  comparison: ComparisonReport | null;
  recommendations: OptimizationRecommendation[];
  onRefreshOptimization: (options?: any) => Promise<void>;
  onApplyRecommendation: (recId: string) => Promise<void>;
  isOptimizing: boolean;
}

export const OptimizationLabPage: React.FC<OptimizationLabPageProps> = ({
  simulationState,
  scenarios,
  comparison,
  recommendations,
  onRefreshOptimization,
  onApplyRecommendation,
  isOptimizing,
}) => {
  const [demandMultiplier, setDemandMultiplier] = useState<number>(simulationState.demandMultiplier);
  const [trafficMultiplier, setTrafficMultiplier] = useState<number>(simulationState.trafficMultiplier);
  const [maxWaitThreshold, setMaxWaitThreshold] = useState<number>(10);
  const [priority, setPriority] = useState<string>('eliminate_overcrowding');
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const handleRunOptimizer = async () => {
    await onRefreshOptimization({
      demandMultiplier,
      trafficMultiplier,
      maxAcceptableWaitTimeMin: maxWaitThreshold,
      priority,
    });
  };

  const handleApply = async (id: string) => {
    setApplyingId(id);
    try {
      await onApplyRecommendation(id);
    } catch (err) {
      console.error('Failed to apply recommendation:', err);
    } finally {
      setApplyingId(null);
    }
  };

  const activeScenario = scenarios.find(s => s.id === simulationState.currentScenario) || scenarios[0];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-blue-600" /> Constraint-Aware Optimization Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">Deterministic Algorithm • Active</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Optimization Lab & Policy Synthesis</h2>
          <p className="text-xs text-slate-500">
            Generate mathematically feasible fleet reallocations, headway adjustments, and timetable synchronizations
          </p>
        </div>

        {/* Action Header Button */}
        <div className="flex items-center gap-2">
          <a
            href={api.getExportCsvUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Plan CSV</span>
          </a>
        </div>
      </div>

      {/* Parameter Controls */}
      <OptimizationLabControls
        demandMultiplier={demandMultiplier}
        trafficMultiplier={trafficMultiplier}
        maxWaitThreshold={maxWaitThreshold}
        priority={priority}
        onDemandChange={setDemandMultiplier}
        onTrafficChange={setTrafficMultiplier}
        onMaxWaitChange={setMaxWaitThreshold}
        onPriorityChange={setPriority}
        onRunOptimization={handleRunOptimizer}
        isOptimizing={isOptimizing}
      />

      {/* Side-by-Side Comparison Table */}
      {comparison && (
        <ComparisonTable comparison={comparison} />
      )}

      {/* Generated Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Synthesized Optimization Recommendations ({recommendations.length})
            </h3>
            <p className="text-xs text-slate-500">
              Formulated under strict vehicle availability, capacity, road clearance, and timetable constraints
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            All Hard Constraints Respected
          </span>
        </div>

        {recommendations.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
            No active optimizations required. Current timetable satisfies all capacity constraints.
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map(rec => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onApply={handleApply}
                isApplying={applyingId === rec.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
