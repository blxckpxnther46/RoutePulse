import { Request, Response } from 'express';
import { SimulationService } from '../services/simulationService.js';

export class DemandController {
  private simulationService: SimulationService;

  constructor() {
    this.simulationService = new SimulationService();
  }

  public getDemand = (req: Request, res: Response): void => {
    try {
      const data = this.simulationService.getDemandAnalytics();
      res.json({
        success: true,
        data,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
}
