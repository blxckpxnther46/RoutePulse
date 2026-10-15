import { Request, Response } from 'express';
import { SimulationService } from '../services/simulationService.js';

export class DashboardController {
  private simulationService: SimulationService;

  constructor() {
    this.simulationService = new SimulationService();
  }

  public getDashboard = (req: Request, res: Response): void => {
    try {
      const data = this.simulationService.getDashboardData();
      res.json({
        success: true,
        data,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch dashboard data',
      });
    }
  };
}
