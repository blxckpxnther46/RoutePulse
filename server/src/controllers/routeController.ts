import { Request, Response } from 'express';
import { DataStore } from '../services/dataStore.js';

export class RouteController {
  private dataStore: DataStore;

  constructor() {
    this.dataStore = DataStore.getInstance();
  }

  public getRoutes = (req: Request, res: Response): void => {
    try {
      const routes = this.dataStore.getRoutes();
      const stops = this.dataStore.getStops();
      res.json({
        success: true,
        data: {
          routes,
          stops,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  public createRoute = (req: Request, res: Response): void => {
    try {
      const { name, code, color, description, stops, headwayMinutes, operatingWindow, assignedVehicleIds } = req.body;
      if (!name || !stops || !Array.isArray(stops) || stops.length < 2) {
        res.status(400).json({
          success: false,
          message: 'Route name and at least 2 stops are required for valid route sequence.',
        });
        return;
      }

      // Generate waypoints from stop coordinates if not provided
      const allStops = this.dataStore.getStops();
      const stopsMap = new Map(allStops.map(s => [s.id, s]));
      const waypoints = (req.body.waypoints && req.body.waypoints.length > 0)
        ? req.body.waypoints
        : stops.map((rs: any) => {
            const stp = stopsMap.get(rs.stopId);
            return stp ? [stp.lat, stp.lng] : [12.84, 80.15];
          });

      const newRoute = this.dataStore.createRoute({
        name,
        code: code || `R-${Date.now().toString().slice(-4)}`,
        color: color || '#3b82f6',
        description: description || 'Custom campus shuttle connection',
        stops,
        waypoints,
        headwayMinutes: Number(headwayMinutes) || 15,
        operatingWindow: operatingWindow || { start: '07:00', end: '22:00' },
        assignedVehicleIds: assignedVehicleIds || [],
        active: true,
      });

      res.status(201).json({
        success: true,
        data: newRoute,
        message: 'Route created successfully',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  public updateRoute = (req: Request, res: Response): void => {
    try {
      const id = String(req.params.id);
      const updated = this.dataStore.updateRoute(id, req.body);
      res.json({
        success: true,
        data: updated,
        message: 'Route updated successfully',
      });
    } catch (err: any) {
      res.status(err.message.includes('not found') ? 404 : 500).json({
        success: false,
        message: err.message,
      });
    }
  };

  public deleteRoute = (req: Request, res: Response): void => {
    try {
      const id = String(req.params.id);
      const deleted = this.dataStore.deleteRoute(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: `Route ${id} not found` });
        return;
      }
      res.json({
        success: true,
        message: 'Route deleted successfully',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  public updateStop = (req: Request, res: Response): void => {
    try {
      const id = String(req.params.id);
      const updated = this.dataStore.updateStop(id, req.body);
      res.json({
        success: true,
        data: updated,
        message: 'Stop updated successfully',
      });
    } catch (err: any) {
      res.status(err.message.includes('not found') ? 404 : 500).json({
        success: false,
        message: err.message,
      });
    }
  };
}
