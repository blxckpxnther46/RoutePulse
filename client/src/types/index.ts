export type ScenarioType = 
  | 'normal' 
  | 'morning_peak' 
  | 'traffic_disruption' 
  | 'vehicle_breakdown' 
  | 'event_surge';

export interface Stop {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  zone: 'academic' | 'hostel' | 'research' | 'transit' | 'sports';
  shelterType: 'covered_terminal' | 'canopy' | 'pole_only';
  waitingPassengers: number;
  currentDemandRate: number; // passengers per hour
  isAccessible: boolean;
  isTransferHub: boolean;
}

export interface RouteStop {
  stopId: string;
  sequence: number;
  scheduledTravelTimeFromPrevMin: number;
  dwellTimeSec: number;
}

export interface Route {
  id: string;
  name: string;
  code: string;
  color: string;
  description: string;
  stops: RouteStop[];
  waypoints: [number, number][]; // lat/lng pairs
  headwayMinutes: number;
  operatingWindow: {
    start: string;
    end: string;
  };
  assignedVehicleIds: string[];
  active: boolean;
}

export type VehicleStatus = 'in_service' | 'in_transit' | 'delayed' | 'maintenance' | 'idle';

export interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  model: string;
  type: 'electric_bus' | 'standard_shuttle' | 'minibus' | 'feeder_van';
  capacity: number;
  currentPassengers: number;
  assignedRouteId: string | null;
  status: VehicleStatus;
  currentLocation: {
    lat: number;
    lng: number;
    nearestStopId: string;
    headingDeg: number;
    currentSpeedKmh: number;
  };
  currentSegmentIndex: number;
  segmentProgressPct: number;
  scheduleDeviationMinutes: number;
  isAccessible: boolean;
  batteryLevelPct?: number;
  driverName: string;
  routeName?: string;
  routeColor?: string;
  utilizationPct?: number;
  capacityStatus?: 'normal' | 'nearing_capacity' | 'exceeded';
}

export interface Departure {
  id: string;
  routeId: string;
  routeName: string;
  routeColor: string;
  vehicleId: string;
  vehicleName: string;
  stopId: string;
  stopName: string;
  scheduledTime: string;
  estimatedTime: string;
  etaWindow: string;
  status: 'on_time' | 'delayed' | 'approaching' | 'boarding';
  availableCapacity: number;
  crowdingLevel: 'low' | 'moderate' | 'high' | 'overcrowded';
}

export interface Alert {
  id: string;
  type: 'capacity_violation' | 'late_arrival' | 'missed_connection' | 'route_overload' | 'vehicle_breakdown';
  severity: 'critical' | 'warning' | 'info';
  routeId?: string;
  vehicleId?: string;
  stopId?: string;
  title: string;
  message: string;
  metricValue?: string;
  timestamp: string;
}

export interface Scenario {
  id: ScenarioType;
  name: string;
  tagline: string;
  description: string;
  demandMultiplier: number;
  trafficMultiplier: number;
  disabledVehicleIds?: string[];
  blockedRouteIds?: string[];
  routeSpecificDelays?: Record<string, number>;
  peakStops?: string[];
}

export interface OptimizationRecommendation {
  id: string;
  type: 'vehicle_reallocation' | 'frequency_adjustment' | 'extra_departure' | 'schedule_offset' | 'capacity_swap';
  priority: 'critical' | 'high' | 'medium';
  title: string;
  currentSituation: string;
  proposedChange: string;
  reason: string;
  expectedBenefit: string;
  tradeOffs: string;
  constraintsChecked: string[];
  feasibilityStatus: 'FEASIBLE' | 'BLOCKED_BY_CONSTRAINT' | 'OPTIMAL';
  targetRouteId?: string;
  sourceRouteId?: string;
  targetVehicleId?: string;
  applied: boolean;
}

export interface EvaluationMetrics {
  totalPassengerDemand: number;
  passengersServed: number;
  unmetDemand: number;
  totalPassengerWaitingTimeMinutes: number;
  averageWaitingTimeMinutes: number;
  capacityViolationsCount: number;
  missedConnectionsCount: number;
  onTimeDeparturePct: number;
  fleetAverageUtilizationPct: number;
  activeVehiclesDeployed: number;
  totalOperatingCostIndex: number;
  serviceReliabilityScore: number;
  compositeScore: number;
}

export interface ComparisonReport {
  scenarioId: ScenarioType;
  scenarioName: string;
  timestamp: string;
  baseline: EvaluationMetrics;
  optimized: EvaluationMetrics;
  improvements: {
    [key in keyof EvaluationMetrics]?: {
      delta: number;
      deltaPct: number;
      isBetter: boolean;
    };
  };
  recommendations: OptimizationRecommendation[];
  assumptions: string[];
  constraintsSummary: {
    maxVehicleCapacityEnforced: boolean;
    timetableIntegrityEnforced: boolean;
    operatingWindowsEnforced: boolean;
    driverAvailabilityEnforced: boolean;
    transferToleranceMins: number;
  };
}

export interface SimulationState {
  currentTime: string;
  timeSeconds: number;
  isPlaying: boolean;
  playbackSpeed: number;
  currentScenario: ScenarioType;
  trafficMultiplier: number;
  demandMultiplier: number;
  weatherCondition: string;
  activeAlertsCount: number;
}

export interface DashboardData {
  metrics: {
    activeVehicles: number;
    totalPassengerDemand: number;
    averageWaitingTimeMinutes: number;
    capacityViolations: number;
    routesAtRisk: number;
    onTimePerformancePct: number;
  };
  simulationState: SimulationState;
  routes: Route[];
  stops: Stop[];
  vehicles: Vehicle[];
  upcomingDepartures: Departure[];
  alerts: Alert[];
  hourlyDemand: {
    hour: string;
    normalDemand: number;
    peakDemand: number;
    servedCapacity: number;
  }[];
}

export interface DemandAnalyticsData {
  hourlyTrends: {
    hour: string;
    totalDemand: number;
    totalCapacity: number;
    boardingCount: number;
    alightingCount: number;
    isPeak: boolean;
  }[];
  routeDemand: {
    routeId: string;
    routeName: string;
    routeColor: string;
    hourlyDemand: number;
    allocatedCapacity: number;
    utilizationPct: number;
    status: 'underutilized' | 'balanced' | 'overcrowded';
  }[];
  stopDemandRanked: {
    stopId: string;
    stopName: string;
    zone: string;
    hourlyBoardings: number;
    waitingQueue: number;
    congestionRisk: 'low' | 'moderate' | 'high' | 'severe';
  }[];
  peakHours: string[];
  overcrowdedHours: string[];
}
