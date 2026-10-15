import { Request, Response } from 'express';
import { DataStore } from '../services/dataStore.js';
import { OptimizationEngine } from '../algorithms/optimizationEngine.js';
import { ComparisonReport, OptimizationRecommendation } from '../types/index.js';

let latestOptimizationResult: {
  recommendations: OptimizationRecommendation[];
  comparison: ComparisonReport;
} | null = null;

export class OptimizationController {
  private dataStore: DataStore;

  constructor() {
    this.dataStore = DataStore.getInstance();
  }

  public runOptimization = (req: Request, res: Response): void => {
    try {
      const stops = this.dataStore.getStops();
      const routes = this.dataStore.getRoutes();
      const vehicles = this.dataStore.getVehicles();
      const simulationState = this.dataStore.getSimulationState();
      const scenarios = this.dataStore.getScenarios();
      const currentScenario = scenarios.find(s => s.id === simulationState.currentScenario) || scenarios[0];

      const options = {
        demandMultiplier: req.body.demandMultiplier ? Number(req.body.demandMultiplier) : undefined,
        trafficMultiplier: req.body.trafficMultiplier ? Number(req.body.trafficMultiplier) : undefined,
        maxAcceptableWaitTimeMin: req.body.maxAcceptableWaitTimeMin ? Number(req.body.maxAcceptableWaitTimeMin) : undefined,
        priority: req.body.priority || 'eliminate_overcrowding',
      };

      const result = OptimizationEngine.runOptimization(
        stops,
        routes,
        vehicles,
        simulationState,
        currentScenario,
        options
      );

      // Check which recommendations are already applied
      const appliedList = this.dataStore.getAppliedRecommendations();
      result.recommendations.forEach(rec => {
        if (appliedList.includes(rec.id)) {
          rec.applied = true;
        }
      });

      latestOptimizationResult = {
        recommendations: result.recommendations,
        comparison: result.comparison,
      };

      res.json({
        success: true,
        data: result,
        message: 'Optimization completed successfully.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  public getResults = (req: Request, res: Response): void => {
    try {
      if (!latestOptimizationResult) {
        // Run initial optimization if none has been run yet
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

        latestOptimizationResult = {
          recommendations: result.recommendations,
          comparison: result.comparison,
        };
      }

      const appliedList = this.dataStore.getAppliedRecommendations();
      latestOptimizationResult.recommendations.forEach(rec => {
        rec.applied = appliedList.includes(rec.id);
      });

      res.json({
        success: true,
        data: latestOptimizationResult,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  public applyRecommendation = (req: Request, res: Response): void => {
    try {
      const { recommendationId } = req.body;
      if (!recommendationId) {
        res.status(400).json({ success: false, message: 'recommendationId is required' });
        return;
      }

      if (!latestOptimizationResult) {
        res.status(400).json({ success: false, message: 'No active optimization plan to apply from' });
        return;
      }

      const rec = latestOptimizationResult.recommendations.find(r => r.id === recommendationId);
      if (!rec) {
        res.status(404).json({ success: false, message: 'Recommendation not found' });
        return;
      }

      // Execute the recommendation on live fleet & routes
      if (rec.type === 'vehicle_reallocation' && rec.targetVehicleId && rec.targetRouteId) {
        this.dataStore.updateVehicle(rec.targetVehicleId, {
          assignedRouteId: rec.targetRouteId,
          status: 'in_service',
          scheduleDeviationMinutes: 0,
        });
      } else if (rec.type === 'frequency_adjustment' && rec.targetRouteId) {
        const route = this.dataStore.getRoute(rec.targetRouteId);
        if (route) {
          const newHeadway = Math.max(6, Math.round(route.headwayMinutes * 0.7));
          this.dataStore.updateRoute(rec.targetRouteId, { headwayMinutes: newHeadway });
        }
      }

      rec.applied = true;
      this.dataStore.addAppliedRecommendation(rec.id);

      res.json({
        success: true,
        data: rec,
        message: `Recommendation "${rec.title}" successfully applied to campus operations.`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
}
