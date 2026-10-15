import { 
  DashboardData, 
  Route, 
  Stop, 
  Vehicle, 
  DemandAnalyticsData, 
  SimulationState, 
  Scenario, 
  ScenarioType, 
  OptimizationRecommendation, 
  EvaluationMetrics, 
  ComparisonReport 
} from '../types/index.js';

const BASE_URL = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `API request failed: ${res.statusText}`);
  }
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Health
  checkHealth: async () => {
    return fetchJson<{ status: string; service: string; version: string }>('/health');
  },

  // Dashboard Overview
  getDashboard: async (): Promise<DashboardData> => {
    return fetchJson<DashboardData>('/dashboard');
  },

  // Routes and Stops
  getRoutes: async (): Promise<{ routes: Route[]; stops: Stop[] }> => {
    return fetchJson<{ routes: Route[]; stops: Stop[] }>('/routes');
  },

  createRoute: async (routeData: Partial<Route>): Promise<Route> => {
    return fetchJson<Route>('/routes', {
      method: 'POST',
      body: JSON.stringify(routeData),
    });
  },

  updateRoute: async (id: string, updates: Partial<Route>): Promise<Route> => {
    return fetchJson<Route>(`/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteRoute: async (id: string): Promise<{ success: boolean }> => {
    return fetchJson<{ success: boolean }>(`/routes/${id}`, {
      method: 'DELETE',
    });
  },

  updateStop: async (id: string, updates: Partial<Stop>): Promise<Stop> => {
    return fetchJson<Stop>(`/stops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Fleet
  getVehicles: async (): Promise<Vehicle[]> => {
    return fetchJson<Vehicle[]>('/vehicles');
  },

  updateVehicle: async (id: string, updates: Partial<Vehicle>): Promise<Vehicle> => {
    return fetchJson<Vehicle>(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Demand Analytics
  getDemand: async (): Promise<DemandAnalyticsData> => {
    return fetchJson<DemandAnalyticsData>('/demand');
  },

  // Simulation Controls
  getSimulationState: async (): Promise<{ state: SimulationState; scenarios: Scenario[] }> => {
    return fetchJson<{ state: SimulationState; scenarios: Scenario[] }>('/simulation/state');
  },

  stepSimulation: async (deltaMinutes: number = 2): Promise<DashboardData> => {
    return fetchJson<DashboardData>('/simulation/step', {
      method: 'POST',
      body: JSON.stringify({ deltaMinutes }),
    });
  },

  applyScenario: async (scenarioId: ScenarioType): Promise<{ state: SimulationState; scenario: Scenario; dashboard: DashboardData }> => {
    return fetchJson<{ state: SimulationState; scenario: Scenario; dashboard: DashboardData }>('/simulation/scenario', {
      method: 'POST',
      body: JSON.stringify({ scenarioId }),
    });
  },

  resetSimulation: async (): Promise<DashboardData> => {
    return fetchJson<DashboardData>('/simulation/reset', {
      method: 'POST',
    });
  },

  // Optimization Engine
  runOptimization: async (options?: {
    demandMultiplier?: number;
    trafficMultiplier?: number;
    maxAcceptableWaitTimeMin?: number;
    priority?: string;
  }): Promise<{
    recommendations: OptimizationRecommendation[];
    baseline: EvaluationMetrics;
    optimized: EvaluationMetrics;
    comparison: ComparisonReport;
  }> => {
    return fetchJson<{
      recommendations: OptimizationRecommendation[];
      baseline: EvaluationMetrics;
      optimized: EvaluationMetrics;
      comparison: ComparisonReport;
    }>('/optimization/run', {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  },

  getOptimizationResults: async (): Promise<{
    recommendations: OptimizationRecommendation[];
    comparison: ComparisonReport;
  }> => {
    return fetchJson<{
      recommendations: OptimizationRecommendation[];
      comparison: ComparisonReport;
    }>('/optimization/results');
  },

  applyRecommendation: async (recommendationId: string): Promise<OptimizationRecommendation> => {
    return fetchJson<OptimizationRecommendation>('/optimization/apply', {
      method: 'POST',
      body: JSON.stringify({ recommendationId }),
    });
  },

  // Reports
  getComparisonReport: async (): Promise<ComparisonReport> => {
    return fetchJson<ComparisonReport>('/reports/comparison');
  },

  getExportCsvUrl: (): string => {
    return `${BASE_URL}/reports/export`;
  },
};
