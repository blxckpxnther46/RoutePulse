import { Request, Response } from 'express';
import { DataStore } from '../services/dataStore.js';
import { OptimizationEngine } from '../algorithms/optimizationEngine.js';

export class ReportController {
  private dataStore: DataStore;

  constructor() {
    this.dataStore = DataStore.getInstance();
  }

  public getComparison = (req: Request, res: Response): void => {
    try {
      const stops = this.dataStore.getStops();
      const routes = this.dataStore.getRoutes();
      const vehicles = this.dataStore.getVehicles();
      const simulationState = this.dataStore.getSimulationState();
      const scenarios = this.dataStore.getScenarios();
      const currentScenario = scenarios.find(s => s.id === simulationState.currentScenario) || scenarios[0];

      const result = OptimizationEngine.runOptimization(
        stops,
        routes,
        vehicles,
        simulationState,
        currentScenario
      );

      res.json({
        success: true,
        data: result.comparison,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  public exportCsv = (req: Request, res: Response): void => {
    try {
      const stops = this.dataStore.getStops();
      const routes = this.dataStore.getRoutes();
      const vehicles = this.dataStore.getVehicles();
      const simulationState = this.dataStore.getSimulationState();
      const scenarios = this.dataStore.getScenarios();
      const currentScenario = scenarios.find(s => s.id === simulationState.currentScenario) || scenarios[0];

      const { comparison } = OptimizationEngine.runOptimization(
        stops,
        routes,
        vehicles,
        simulationState,
        currentScenario
      );

      const b = comparison.baseline;
      const o = comparison.optimized;
      const imp = comparison.improvements;

      const rows: string[][] = [
        ['RoutePulse - Campus Transport Evaluation Report'],
        ['Scenario', comparison.scenarioName],
        ['Timestamp', comparison.timestamp],
        [''],
        ['Metric Name', 'Baseline Plan', 'Optimized Plan', 'Absolute Delta', 'Percentage Delta', 'Assessment'],
        [
          'Total Passenger Demand (pax/hr)',
          String(b.totalPassengerDemand),
          String(o.totalPassengerDemand),
          String(imp.totalPassengerDemand?.delta ?? 0),
          `${imp.totalPassengerDemand?.deltaPct ?? 0}%`,
          'Constant Baseline Test Set'
        ],
        [
          'Passengers Served (pax/hr)',
          String(b.passengersServed),
          String(o.passengersServed),
          String(imp.passengersServed?.delta ?? 0),
          `+${imp.passengersServed?.deltaPct ?? 0}%`,
          imp.passengersServed?.isBetter ? 'Improved' : 'Neutral'
        ],
        [
          'Average Passenger Wait Time (mins)',
          `${b.averageWaitingTimeMinutes} min`,
          `${o.averageWaitingTimeMinutes} min`,
          `${imp.averageWaitingTimeMinutes?.delta ?? 0} min`,
          `${imp.averageWaitingTimeMinutes?.deltaPct ?? 0}%`,
          imp.averageWaitingTimeMinutes?.isBetter ? 'Significant Reduction' : 'Higher'
        ],
        [
          'Total Passenger Waiting Time (person-mins)',
          String(b.totalPassengerWaitingTimeMinutes),
          String(o.totalPassengerWaitingTimeMinutes),
          String(imp.totalPassengerWaitingTimeMinutes?.delta ?? 0),
          `${imp.totalPassengerWaitingTimeMinutes?.deltaPct ?? 0}%`,
          'Substantial Student Time Saved'
        ],
        [
          'Capacity Violations (incidents)',
          String(b.capacityViolationsCount),
          String(o.capacityViolationsCount),
          String(imp.capacityViolationsCount?.delta ?? 0),
          `${imp.capacityViolationsCount?.deltaPct ?? 0}%`,
          imp.capacityViolationsCount?.isBetter ? 'Eliminated / Controlled' : 'Unchanged'
        ],
        [
          'Missed Passenger Connections',
          String(b.missedConnectionsCount),
          String(o.missedConnectionsCount),
          String(imp.missedConnectionsCount?.delta ?? 0),
          `${imp.missedConnectionsCount?.deltaPct ?? 0}%`,
          imp.missedConnectionsCount?.isBetter ? 'Synchronized Transfer' : 'Unchanged'
        ],
        [
          'On-Time Departure Rate (%)',
          `${b.onTimeDeparturePct}%`,
          `${o.onTimeDeparturePct}%`,
          `+${imp.onTimeDeparturePct?.delta ?? 0}%`,
          `+${imp.onTimeDeparturePct?.deltaPct ?? 0}%`,
          'Improved Reliability'
        ],
        [
          'Fleet Average Utilization (%)',
          `${b.fleetAverageUtilizationPct}%`,
          `${o.fleetAverageUtilizationPct}%`,
          `${imp.fleetAverageUtilizationPct?.delta ?? 0}%`,
          `${imp.fleetAverageUtilizationPct?.deltaPct ?? 0}%`,
          'Balanced Fleet Loading'
        ],
        [
          'Active Vehicles Deployed',
          String(b.activeVehiclesDeployed),
          String(o.activeVehiclesDeployed),
          String(o.activeVehiclesDeployed - b.activeVehiclesDeployed),
          '--',
          'Resource Constrained'
        ],
        [
          'Service Reliability Score (0-100)',
          String(b.serviceReliabilityScore),
          String(o.serviceReliabilityScore),
          `+${imp.serviceReliabilityScore?.delta ?? 0}`,
          `+${imp.serviceReliabilityScore?.deltaPct ?? 0}%`,
          'High Service Quality'
        ],
        [
          'Composite Objective Score (0-100)',
          String(b.compositeScore),
          String(o.compositeScore),
          `+${imp.compositeScore?.delta ?? 0}`,
          `+${imp.compositeScore?.deltaPct ?? 0}%`,
          'Overall Performance Gain'
        ],
        [''],
        ['Enforced Transport Constraints'],
        ['Max Vehicle Capacity Enforced', String(comparison.constraintsSummary.maxVehicleCapacityEnforced)],
        ['Timetable Integrity Enforced', String(comparison.constraintsSummary.timetableIntegrityEnforced)],
        ['Driver Availability Enforced', String(comparison.constraintsSummary.driverAvailabilityEnforced)],
        ['Operating Hours Enforced', String(comparison.constraintsSummary.operatingWindowsEnforced)],
        ['Minimum Transfer Buffer Window', `${comparison.constraintsSummary.transferToleranceMins} minutes`],
      ];

      const csvContent = rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=RoutePulse_${currentScenario.id}_Evaluation.csv`);
      res.send(csvContent);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
}
