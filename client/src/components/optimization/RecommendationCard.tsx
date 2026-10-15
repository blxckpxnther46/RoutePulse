import React from 'react';
import { OptimizationRecommendation } from '../../types/index.js';
import { CheckCircle2, ShieldCheck, ArrowRight, Zap, AlertTriangle } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: OptimizationRecommendation;
  onApply: (id: string) => void;
  isApplying?: boolean;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onApply,
  isApplying = false,
}) => {
  const isApplied = recommendation.applied;

  return (
    <div className={`p-6 rounded-xl border transition-all ${
      isApplied 
        ? 'bg-emerald-50/30 border-emerald-300 ring-1 ring-emerald-500/20' 
        : 'bg-white border-slate-200 shadow-xs hover:shadow-md'
    }`}>
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              recommendation.priority === 'critical'
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : recommendation.priority === 'high'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {recommendation.priority} Priority
            </span>

            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              {recommendation.feasibilityStatus}
            </span>

            {isApplied && (
              <span className="text-[10px] font-bold text-white bg-emerald-600 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Active in Schedule
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-slate-900">{recommendation.title}</h3>
        </div>

        <button
          onClick={() => onApply(recommendation.id)}
          disabled={isApplied || isApplying}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
            isApplied
              ? 'bg-emerald-100 text-emerald-800 cursor-default'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow cursor-pointer'
          }`}
        >
          {isApplied ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Applied</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-blue-200 fill-current" />
              <span>{isApplying ? 'Applying...' : 'Apply to Fleet'}</span>
            </>
          )}
        </button>
      </div>

      {/* Grid of Situation and Proposed Change */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Current Situation
          </span>
          <p className="text-xs text-slate-700 leading-relaxed">{recommendation.currentSituation}</p>
        </div>

        <div className="p-3.5 rounded-lg bg-blue-50/40 border border-blue-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
            Proposed Action
          </span>
          <p className="text-xs text-slate-800 leading-relaxed font-medium">{recommendation.proposedChange}</p>
        </div>
      </div>

      {/* Benefits and Trade-offs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
        <div>
          <span className="font-bold text-emerald-700 flex items-center gap-1 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Expected Benefit
          </span>
          <p className="text-slate-600 leading-relaxed">{recommendation.expectedBenefit}</p>
        </div>

        <div>
          <span className="font-bold text-amber-700 flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Operational Trade-Offs
          </span>
          <p className="text-slate-600 leading-relaxed">{recommendation.tradeOffs}</p>
        </div>
      </div>

      {/* Constraints Checked Badge List */}
      <div className="pt-3 border-t border-slate-100">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Deterministic Constraints Enforced & Passed:
        </span>
        <div className="flex flex-wrap gap-2">
          {recommendation.constraintsChecked.map((constraint, i) => (
            <span
              key={i}
              className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-mono"
            >
              ✓ {constraint}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
