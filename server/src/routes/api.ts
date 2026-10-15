import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.js';
import { RouteController } from '../controllers/routeController.js';
import { VehicleController } from '../controllers/vehicleController.js';
import { DemandController } from '../controllers/demandController.js';
import { SimulationController } from '../controllers/simulationController.js';
import { OptimizationController } from '../controllers/optimizationController.js';
import { ReportController } from '../controllers/reportController.js';

const router = Router();

const dashboardController = new DashboardController();
const routeController = new RouteController();
const vehicleController = new VehicleController();
const demandController = new DemandController();
const simulationController = new SimulationController();
const optimizationController = new OptimizationController();
const reportController = new ReportController();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RoutePulse Transport Optimization Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Dashboard
router.get('/dashboard', dashboardController.getDashboard);

// Routes & Stops
router.get('/routes', routeController.getRoutes);
router.post('/routes', routeController.createRoute);
router.put('/routes/:id', routeController.updateRoute);
router.delete('/routes/:id', routeController.deleteRoute);
router.put('/stops/:id', routeController.updateStop);

// Vehicles
router.get('/vehicles', vehicleController.getVehicles);
router.put('/vehicles/:id', vehicleController.updateVehicle);

// Demand Analytics
router.get('/demand', demandController.getDemand);

// Simulation
router.get('/simulation/state', simulationController.getState);
router.post('/simulation/step', simulationController.step);
router.post('/simulation/scenario', simulationController.applyScenario);
router.post('/simulation/reset', simulationController.reset);

// Optimization
router.post('/optimization/run', optimizationController.runOptimization);
router.get('/optimization/results', optimizationController.getResults);
router.post('/optimization/apply', optimizationController.applyRecommendation);

// Reports & Evaluation
router.get('/reports/comparison', reportController.getComparison);
router.get('/reports/export', reportController.exportCsv);

export default router;
