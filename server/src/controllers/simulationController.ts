import { Request, Response } from 'express';
import { SimulationService } from '../services/simulationService.js';
import { DataStore } from '../services/dataStore.js';
import { ScenarioType } from '../types/index.js';

export class SimulationController {
  private simulationService: SimulationService;
  private dataStore: DataStore;

  constructor() {
    this.simulationService = new SimulationService();
    this.dataStore = DataStore.getInstance();
  }

  public getState = (req: Request, res: Response): void => {
    try {
      const state = this.dataStore.getSimulationState();
      const scenarios = this.dataStore.getScenarios();
      res.json({
        success: true,
        data: {
          state,
          scenarios,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  public step = (req: Request, res: Response): void => {
    try {
      const deltaMinutes = Number(req.body.deltaMinutes) || 2;
      const dashboardData = this.simulationService.advanceSimulation(deltaMinutes);
      res.json({
        success: true,
        data: dashboardData,
        message: `Simulation advanced by ${deltaMinutes} minutes.`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  public applyScenario = (req: Request, res: Response): void => {
    try {
      const { scenarioId } = req.body;
      if (!scenarioId) {
        res.status(400).json({ success: false, message: 'scenarioId is required' });
        return;
      }

      const result = this.dataStore.applyScenario(scenarioId as ScenarioType);
      const dashboardData = this.simulationService.getDashboardData();
      res.json({
        success: true,
        data: {
          ...result,
          dashboard: dashboardData,
        },
        message: `Applied scenario: ${result.scenario.name}`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  public reset = (req: Request, res: Response): void => {
    try {
      this.dataStore.resetToDefaults(true);
      const dashboardData = this.simulationService.getDashboardData();
      res.json({
        success: true,
        data: dashboardData,
        message: 'Simulation reset to baseline configuration.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
}
