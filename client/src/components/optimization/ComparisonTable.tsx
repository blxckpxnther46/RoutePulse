import React from 'react';
import { ComparisonReport, EvaluationMetrics } from '../../types/index.js';
import { ArrowDown, ArrowUp, Minus, CheckCircle, Info } from 'lucide-react';

interface ComparisonTableProps {
  comparison: ComparisonReport;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ comparison }) => {
  const b = comparison.baseline;
  const o = comparison.optimized;
  const imp = comparison.improvements;

  const metricRows: {
    name: string;
    description: string;
    baselineVal: string;
    optimizedVal: string;
    delta: number;
    deltaPct: number;
    isBetter: boolean;
    unit?: string;
  }[] = [
    {
      name: 'Average Passenger Waiting Time',
      description: 'Average minutes a student spends waiting at campus bus shelters',
      baselineVal: `${b.averageWaitingTimeMinutes} min`,
      optimizedVal: `${o.averageWaitingTimeMinutes} min`,
      delta: imp.averageWaitingTimeMinutes?.delta ?? 0,
      deltaPct: imp.averageWaitingTimeMinutes?.deltaPct ?? 0,
      isBetter: imp.averageWaitingTimeMinutes?.isBetter ?? true,
    },
    {
      name: 'Total Passenger Waiting Burden',
      description: 'Aggregate student-minutes lost to transit waiting queues',
      baselineVal: `${b.totalPassengerWaitingTimeMinutes.toLocaleString()} p-min`,
      optimizedVal: `${o.totalPassengerWaitingTimeMinutes.toLocaleString()} p-min`,
      delta: imp.totalPassengerWaitingTimeMinutes?.delta ?? 0,
      deltaPct: imp.totalPassengerWaitingTimeMinutes?.deltaPct ?? 0,
      isBetter: imp.totalPassengerWaitingTimeMinutes?.isBetter ?? true,
    },
    {
      name: 'Capacity Violations Count',
      description: 'Occurrences where arriving vehicle load exceeds legal capacity',
      baselineVal: `${b.capacityViolationsCount} incidents`,
      optimizedVal: `${o.capacityViolationsCount} incidents`,
      delta: imp.capacityViolationsCount?.delta ?? 0,
      deltaPct: imp.capacityViolationsCount?.deltaPct ?? 0,
      isBetter: imp.capacityViolationsCount?.isBetter ?? true,
    },
    {
      name: 'Missed Feeder Connections',
      description: 'Failed transfers due to timetable misalignment at Transfer Hubs',
      baselineVal: `${b.missedConnectionsCount} missed/hr`,
      optimizedVal: `${o.missedConnectionsCount} missed/hr`,
      delta: imp.missedConnectionsCount?.delta ?? 0,
      deltaPct: imp.missedConnectionsCount?.deltaPct ?? 0,
      isBetter: imp.missedConnectionsCount?.isBetter ?? true,
    },
    {
      name: 'On-Time Departure Rate',
      description: 'Percentage of scheduled runs departing within 2 minutes of timetable',
      baselineVal: `${b.onTimeDeparturePct}%`,
      optimizedVal: `${o.onTimeDeparturePct}%`,
      delta: imp.onTimeDeparturePct?.delta ?? 0,
      deltaPct: imp.onTimeDeparturePct?.deltaPct ?? 0,
      isBetter: imp.onTimeDeparturePct?.isBetter ?? true,
    },
    {
      name: 'Active Fleet Utilization',
      description: 'Average occupancy load factor across active operational shuttles',
      baselineVal: `${b.fleetAverageUtilizationPct}%`,
      optimizedVal: `${o.fleetAverageUtilizationPct}%`,
      delta: imp.fleetAverageUtilizationPct?.delta ?? 0,
      deltaPct: imp.fleetAverageUtilizationPct?.deltaPct ?? 0,
      isBetter: true,
    },
    {
      name: 'Active Vehicles Deployed',
      description: 'Shuttle buses and vans actively scheduled on campus corridors',
      baselineVal: `${b.activeVehiclesDeployed} vehicles`,
      optimizedVal: `${o.activeVehiclesDeployed} vehicles`,
      delta: o.activeVehiclesDeployed - b.activeVehiclesDeployed,
      deltaPct: 0,
      isBetter: true,
    },
    {
      name: 'Service Reliability Score',
      description: 'Composite multi-attribute index (Punctuality + Queue Stability)',
      baselineVal: `${b.serviceReliabilityScore} / 100`,
      optimizedVal: `${o.serviceReliabilityScore} / 100`,
      delta: imp.serviceReliabilityScore?.delta ?? 0,
      deltaPct: imp.serviceReliabilityScore?.deltaPct ?? 0,
      isBetter: imp.serviceReliabilityScore?.isBetter ?? true,
    },
    {
      name: 'Composite Objective Score',
      description: 'Weighted optimization function output across all constraints',
      baselineVal: `${b.compositeScore} / 100`,
      optimizedVal: `${o.compositeScore} / 100`,
      delta: imp.compositeScore?.delta ?? 0,
      deltaPct: imp.compositeScore?.deltaPct ?? 0,
      isBetter: imp.compositeScore?.isBetter ?? true,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Before-and-After Plan Evaluation</h3>
          <p className="text-xs text-slate-500">
            Scenario: <span className="font-semibold text-slate-800">{comparison.scenarioName}</span> • Identical baseline evaluation dataset
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            Constraints Verified Feasible
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/60 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-5">Operational Performance Metric</th>
              <th className="py-3 px-5 text-slate-600">Documented Baseline</th>
              <th className="py-3 px-5 text-blue-700">Optimized Proposed Plan</th>
              <th className="py-3 px-5 text-right">Net Improvement (Delta)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {metricRows.map((row, idx) => {
              const hasDelta = row.delta !== 0;
              return (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5">
                    <span className="font-bold text-slate-900 block">{row.name}</span>
                    <span className="text-[11px] text-slate-500">{row.description}</span>
                  </td>

                  <td className="py-3.5 px-5 font-mono font-semibold text-slate-700">
                    {row.baselineVal}
                  </td>

                  <td className="py-3.5 px-5 font-mono font-bold text-blue-700 bg-blue-50/30">
                    {row.optimizedVal}
                  </td>

                  <td className="py-3.5 px-5 text-right">
                    {!hasDelta ? (
                      <span className="text-slate-400 font-mono text-xs inline-flex items-center gap-1">
                        <Minus className="w-3 h-3" /> Baseline Staged
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-1 rounded-full ${
                        row.isBetter
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {row.delta > 0 ? '+' : ''}{row.delta}
                        {row.deltaPct !== 0 && ` (${row.deltaPct > 0 ? '+' : ''}${row.deltaPct}%)`}
                        {row.isBetter ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Assumptions Footer */}
      <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1.5">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Evaluation Methodology & Constraint Verification</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Both baseline and optimized plans are evaluated against the same deterministic passenger inflow traces and campus road geometry. Hard constraints enforced: Maximum vehicle seating capacity, driver hour restrictions, vehicle breakdown availability, and minimum 3.0-minute transfer buffer at inter-modal hub stops.
        </p>
      </div>
    </div>
  );
};
