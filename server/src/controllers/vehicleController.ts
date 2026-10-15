import { Request, Response } from 'express';
import { DataStore } from '../services/dataStore.js';

export class VehicleController {
  private dataStore: DataStore;

  constructor() {
    this.dataStore = DataStore.getInstance();
  }

  public getVehicles = (req: Request, res: Response): void => {
    try {
      const vehicles = this.dataStore.getVehicles();
      const routes = this.dataStore.getRoutes();
      const routesMap = new Map(routes.map(r => [r.id, r]));

      const enriched = vehicles.map(v => {
        const route = v.assignedRouteId ? routesMap.get(v.assignedRouteId) : null;
        const utilizationPct = v.capacity > 0 ? Math.round((v.currentPassengers / v.capacity) * 100) : 0;
        let capacityStatus: 'normal' | 'nearing_capacity' | 'exceeded' = 'normal';
        if (utilizationPct >= 100) capacityStatus = 'exceeded';
        else if (utilizationPct >= 85) capacityStatus = 'nearing_capacity';

        return {
          ...v,
          routeName: route ? route.name : 'Unassigned',
          routeColor: route ? route.color : '#94a3b8',
          utilizationPct,
          capacityStatus,
        };
      });

      res.json({
        success: true,
        data: enriched,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  public updateVehicle = (req: Request, res: Response): void => {
    try {
      const id = String(req.params.id);
      const updated = this.dataStore.updateVehicle(id, req.body);
      res.json({
        success: true,
        data: updated,
        message: 'Vehicle updated successfully',
      });
    } catch (err: any) {
      res.status(err.message.includes('not found') ? 404 : 500).json({
        success: false,
        message: err.message,
      });
    }
  };
}
