import fs from 'node:fs';
import path from 'node:path';
import { Stop, Route, Vehicle, Scenario, SimulationState, ScenarioType } from '../types/index.js';
import { INITIAL_STOPS, INITIAL_ROUTES, INITIAL_VEHICLES, SCENARIOS, INITIAL_SIMULATION_STATE } from '../data/initialData.js';

interface StorageSchema {
  stops: Stop[];
  routes: Route[];
  vehicles: Vehicle[];
  simulationState: SimulationState;
  appliedRecommendations: string[];
}

export class DataStore {
  private static instance: DataStore;
  private filePath: string;
  private stops: Stop[] = [];
  private routes: Route[] = [];
  private vehicles: Vehicle[] = [];
  private simulationState: SimulationState = { ...INITIAL_SIMULATION_STATE };
  private appliedRecommendations: string[] = [];

  private constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        console.warn('Could not create data dir, using in-memory store:', err);
      }
    }
    this.filePath = path.join(dataDir, 'routepulse_store.json');
    this.load();
  }

  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data: StorageSchema = JSON.parse(raw);
        this.stops = data.stops || [...INITIAL_STOPS];
        this.routes = data.routes || [...INITIAL_ROUTES];
        this.vehicles = data.vehicles || [...INITIAL_VEHICLES];
        this.simulationState = data.simulationState || { ...INITIAL_SIMULATION_STATE };
        this.appliedRecommendations = data.appliedRecommendations || [];
        return;
      }
    } catch (err) {
      console.warn('Failed to load persisted data store, falling back to seed data:', err);
    }
    this.resetToDefaults(false);
  }

  public persist(): void {
    try {
      const data: StorageSchema = {
        stops: this.stops,
        routes: this.routes,
        vehicles: this.vehicles,
        simulationState: this.simulationState,
        appliedRecommendations: this.appliedRecommendations,
      };
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write data store to file:', err);
    }
  }

  public resetToDefaults(shouldPersist = true): void {
    // Deep clone initial data
    this.stops = JSON.parse(JSON.stringify(INITIAL_STOPS));
    this.routes = JSON.parse(JSON.stringify(INITIAL_ROUTES));
    this.vehicles = JSON.parse(JSON.stringify(INITIAL_VEHICLES));
    this.simulationState = JSON.parse(JSON.stringify(INITIAL_SIMULATION_STATE));
    this.appliedRecommendations = [];
    if (shouldPersist) {
      this.persist();
    }
  }

  // --- Stops ---
  public getStops(): Stop[] {
    return this.stops;
  }

  public getStop(id: string): Stop | undefined {
    return this.stops.find(s => s.id === id);
  }

  public updateStop(id: string, updates: Partial<Stop>): Stop {
    const idx = this.stops.findIndex(s => s.id === id);
    if (idx === -1) throw new Error(`Stop ${id} not found`);
    this.stops[idx] = { ...this.stops[idx], ...updates };
    this.persist();
    return this.stops[idx];
  }

  // --- Routes ---
  public getRoutes(): Route[] {
    return this.routes;
  }

  public getRoute(id: string): Route | undefined {
    return this.routes.find(r => r.id === id);
  }

  public createRoute(newRoute: Omit<Route, 'id'> & { id?: string }): Route {
    const id = newRoute.id || `R${this.routes.length + 1}`;
    const route: Route = { ...newRoute, id };
    this.routes.push(route);
    this.persist();
    return route;
  }

  public updateRoute(id: string, updates: Partial<Route>): Route {
    const idx = this.routes.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Route ${id} not found`);
    this.routes[idx] = { ...this.routes[idx], ...updates };
    this.persist();
    return this.routes[idx];
  }

  public deleteRoute(id: string): boolean {
    const idx = this.routes.findIndex(r => r.id === id);
    if (idx === -1) return false;
    
    // Unassign vehicles assigned to this route
    this.vehicles.forEach(v => {
      if (v.assignedRouteId === id) {
        v.assignedRouteId = null;
        v.status = 'idle';
      }
    });

    this.routes.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- Vehicles ---
  public getVehicles(): Vehicle[] {
    return this.vehicles;
  }

  public getVehicle(id: string): Vehicle | undefined {
    return this.vehicles.find(v => v.id === id);
  }

  public updateVehicle(id: string, updates: Partial<Vehicle>): Vehicle {
    const idx = this.vehicles.findIndex(v => v.id === id);
    if (idx === -1) throw new Error(`Vehicle ${id} not found`);
    
    const prevRouteId = this.vehicles[idx].assignedRouteId;
    this.vehicles[idx] = { ...this.vehicles[idx], ...updates };

    // Update routes assignedVehicleIds if assignedRouteId changed
    if (updates.assignedRouteId !== undefined && updates.assignedRouteId !== prevRouteId) {
      if (prevRouteId) {
        const prevRoute = this.routes.find(r => r.id === prevRouteId);
        if (prevRoute) {
          prevRoute.assignedVehicleIds = prevRoute.assignedVehicleIds.filter(vId => vId !== id);
        }
      }
      if (updates.assignedRouteId) {
        const newRoute = this.routes.find(r => r.id === updates.assignedRouteId);
        if (newRoute && !newRoute.assignedVehicleIds.includes(id)) {
          newRoute.assignedVehicleIds.push(id);
        }
      }
    }

    this.persist();
    return this.vehicles[idx];
  }

  // --- Scenarios & Simulation State ---
  public getScenarios(): Scenario[] {
    return SCENARIOS;
  }

  public getSimulationState(): SimulationState {
    return this.simulationState;
  }

  public updateSimulationState(updates: Partial<SimulationState>): SimulationState {
    this.simulationState = { ...this.simulationState, ...updates };
    this.persist();
    return this.simulationState;
  }

  public applyScenario(scenarioId: ScenarioType): { state: SimulationState; scenario: Scenario } {
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) throw new Error(`Scenario ${scenarioId} not found`);

    this.simulationState.currentScenario = scenarioId;
    this.simulationState.demandMultiplier = scenario.demandMultiplier;
    this.simulationState.trafficMultiplier = scenario.trafficMultiplier;

    // Apply vehicle breakdowns / disabled states
    this.vehicles.forEach(v => {
      if (scenario.disabledVehicleIds?.includes(v.id)) {
        v.status = 'maintenance';
        v.currentPassengers = 0;
        v.scheduleDeviationMinutes = 25;
      } else if (v.status === 'maintenance') {
        v.status = v.assignedRouteId ? 'in_service' : 'idle';
      }
    });

    // Adjust stop waiting passengers and demand rates based on scenario
    this.stops.forEach(s => {
      const isPeak = scenario.peakStops?.includes(s.id);
      const mult = isPeak ? scenario.demandMultiplier * 1.3 : scenario.demandMultiplier;
      s.currentDemandRate = Math.round(s.currentDemandRate * (mult / (this.simulationState.demandMultiplier || 1)));
      s.waitingPassengers = Math.round(s.waitingPassengers * (mult / (this.simulationState.demandMultiplier || 1)));
    });

    this.persist();
    return { state: this.simulationState, scenario };
  }

  public getAppliedRecommendations(): string[] {
    return this.appliedRecommendations;
  }

  public addAppliedRecommendation(recId: string): void {
    if (!this.appliedRecommendations.includes(recId)) {
      this.appliedRecommendations.push(recId);
      this.persist();
    }
  }

  public clearAppliedRecommendations(): void {
    this.appliedRecommendations = [];
    this.persist();
  }
}
