import { DataStore } from './dataStore.js';
import { EtaCalculator } from './etaCalculator.js';
import { 
  SimulationState, 
  Vehicle, 
  Stop, 
  Route, 
  Departure, 
  Alert, 
  DashboardData, 
  DemandAnalyticsData 
} from '../types/index.js';

export class SimulationService {
  private dataStore: DataStore;

  constructor() {
    this.dataStore = DataStore.getInstance();
  }

  /**
   * Advance the simulation by deltaMinutes (default 2 minutes)
   */
  public advanceSimulation(deltaMinutes: number = 2): DashboardData {
    const state = this.dataStore.getSimulationState();
    const stops = this.dataStore.getStops();
    const routes = this.dataStore.getRoutes();
    const vehicles = this.dataStore.getVehicles();

    const newTimeSec = (state.timeSeconds + deltaMinutes * 60) % 86400;
    const hours = Math.floor(newTimeSec / 3600);
    const mins = Math.floor((newTimeSec % 3600) / 60);
    const newTimeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

    // Update simulation state
    this.dataStore.updateSimulationState({
      timeSeconds: newTimeSec,
      currentTime: newTimeString,
    });

    const stopsMap = new Map(stops.map(s => [s.id, s]));
    const routesMap = new Map(routes.map(r => [r.id, r]));

    // 1. Advance Vehicles along route paths
    vehicles.forEach(vehicle => {
      if (!vehicle.assignedRouteId || vehicle.status === 'maintenance' || vehicle.status === 'idle') {
        return;
      }

      const route = routesMap.get(vehicle.assignedRouteId);
      if (!route || route.stops.length === 0) return;

      const currentStopIndex = vehicle.currentSegmentIndex % route.stops.length;
      const nextStopIndex = (currentStopIndex + 1) % route.stops.length;
      const currentRouteStop = route.stops[currentStopIndex];
      const nextRouteStop = route.stops[nextStopIndex];

      const segmentBaseTimeMin = nextRouteStop.scheduledTravelTimeFromPrevMin || 3;
      const effectiveTravelTimeMin = segmentBaseTimeMin * state.trafficMultiplier;

      // Progress increment for this step
      const progressDelta = (deltaMinutes / Math.max(1, effectiveTravelTimeMin)) * 100;
      let newProgress = vehicle.segmentProgressPct + progressDelta;

      if (newProgress >= 100) {
        // Vehicle reached next stop!
        newProgress = newProgress - 100;
        vehicle.currentSegmentIndex = nextStopIndex;
        const reachedStop = stopsMap.get(nextRouteStop.stopId);

        if (reachedStop) {
          // Passenger alighting (15% - 40% alight at destination stops, especially academic/transfer)
          const alightRate = reachedStop.isTransferHub ? 0.45 : reachedStop.zone === 'academic' ? 0.35 : 0.2;
          const alightingCount = Math.min(vehicle.currentPassengers, Math.floor(vehicle.currentPassengers * alightRate));
          vehicle.currentPassengers -= alightingCount;

          // Passenger boarding from stop waiting queue
          const availableSeats = Math.max(0, vehicle.capacity - vehicle.currentPassengers);
          const boarders = Math.min(availableSeats, reachedStop.waitingPassengers);
          vehicle.currentPassengers += boarders;
          reachedStop.waitingPassengers = Math.max(0, reachedStop.waitingPassengers - boarders);
        }

        // Adjust schedule deviation
        if (state.trafficMultiplier > 1.2) {
          vehicle.scheduleDeviationMinutes = Math.min(15, vehicle.scheduleDeviationMinutes + 1);
        } else if (vehicle.scheduleDeviationMinutes > 0 && Math.random() > 0.6) {
          vehicle.scheduleDeviationMinutes = Math.max(0, vehicle.scheduleDeviationMinutes - 1);
        }
      }

      vehicle.segmentProgressPct = Math.round(newProgress * 10) / 10;

      // Calculate realistic interpolated geographic location from route waypoints
      const fromStop = stopsMap.get(route.stops[vehicle.currentSegmentIndex % route.stops.length].stopId);
      const toStop = stopsMap.get(route.stops[(vehicle.currentSegmentIndex + 1) % route.stops.length].stopId);

      if (fromStop && toStop) {
        const factor = Math.min(1, Math.max(0, vehicle.segmentProgressPct / 100));
        const lat = fromStop.lat + (toStop.lat - fromStop.lat) * factor;
        const lng = fromStop.lng + (toStop.lng - fromStop.lng) * factor;

        // Calculate heading degrees
        const dLng = toStop.lng - fromStop.lng;
        const dLat = toStop.lat - fromStop.lat;
        const headingDeg = Math.round(((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360);

        vehicle.currentLocation = {
          lat: Math.round(lat * 100000) / 100000,
          lng: Math.round(lng * 100000) / 100000,
          nearestStopId: factor > 0.5 ? toStop.id : fromStop.id,
          headingDeg,
          currentSpeedKmh: state.trafficMultiplier > 1.3 ? 16 : 24,
        };
      }
    });

    // 2. Accumulate passenger arrivals at stops
    stops.forEach(stop => {
      const isPeakHour = (hours >= 8 && hours <= 10) || (hours >= 17 && hours <= 19);
      const peakBoost = isPeakHour ? 1.4 : 1.0;
      const arrivalRatePerMinute = (stop.currentDemandRate * state.demandMultiplier * peakBoost) / 60;
      const newArrivals = Math.round(arrivalRatePerMinute * deltaMinutes + (Math.random() * 2 - 1));
      stop.waitingPassengers = Math.max(0, stop.waitingPassengers + Math.max(0, newArrivals));
    });

    this.dataStore.persist();
    return this.getDashboardData();
  }

  /**
   * Aggregate complete dashboard data model
   */
  public getDashboardData(): DashboardData {
    const state = this.dataStore.getSimulationState();
    const stops = this.dataStore.getStops();
    const routes = this.dataStore.getRoutes();
    const vehicles = this.dataStore.getVehicles();

    const stopsMap = new Map(stops.map(s => [s.id, s]));
    const activeVehicles = vehicles.filter(v => v.status === 'in_service' || v.status === 'in_transit');

    // Calculate upcoming departures for all active vehicles
    const upcomingDepartures: Departure[] = [];
    vehicles.forEach(vehicle => {
      if (vehicle.assignedRouteId) {
        const route = routes.find(r => r.id === vehicle.assignedRouteId);
        if (route) {
          const deps = EtaCalculator.calculateVehicleEta(
            vehicle,
            route,
            stopsMap,
            state.trafficMultiplier,
            state.timeSeconds
          );
          upcomingDepartures.push(...deps);
        }
      }
    });

    // Sort upcoming departures by estimated minutes
    upcomingDepartures.sort((a, b) => a.estimatedTime.localeCompare(b.estimatedTime));

    // Dynamic alerts generation
    const alerts: Alert[] = [];
    let capacityViolationsCount = 0;
    let routesAtRiskCount = 0;

    // Check vehicles for capacity violations
    vehicles.forEach(v => {
      if (v.status === 'maintenance') {
        alerts.push({
          id: `ALT-BRK-${v.id}`,
          type: 'vehicle_breakdown',
          severity: 'critical',
          vehicleId: v.id,
          title: `Vehicle Disabled: ${v.name}`,
          message: `${v.name} reported battery/traction failure. Route ${v.assignedRouteId || 'N/A'} is running below planned capacity.`,
          timestamp: state.currentTime,
        });
      }

      const load = v.capacity > 0 ? (v.currentPassengers / v.capacity) * 100 : 0;
      if (load >= 100) {
        capacityViolationsCount++;
        alerts.push({
          id: `ALT-CAP-${v.id}`,
          type: 'capacity_violation',
          severity: 'critical',
          vehicleId: v.id,
          routeId: v.assignedRouteId || undefined,
          title: `Capacity Exceeded on ${v.name}`,
          message: `Vehicle load at ${Math.round(load)}% (${v.currentPassengers}/${v.capacity} pax). Passengers left behind at upcoming stops.`,
          metricValue: `${Math.round(load)}% load`,
          timestamp: state.currentTime,
        });
      } else if (load >= 90) {
        alerts.push({
          id: `ALT-CRW-${v.id}`,
          type: 'route_overload',
          severity: 'warning',
          vehicleId: v.id,
          routeId: v.assignedRouteId || undefined,
          title: `High Crowding on ${v.name}`,
          message: `Vehicle nearing capacity (${v.currentPassengers}/${v.capacity} pax). Additional demand surge will cause boarding failures.`,
          metricValue: `${Math.round(load)}% load`,
          timestamp: state.currentTime,
        });
      }

      if (v.scheduleDeviationMinutes >= 4) {
        alerts.push({
          id: `ALT-LAT-${v.id}`,
          type: 'late_arrival',
          severity: 'warning',
          vehicleId: v.id,
          title: `Late Arrival: ${v.name}`,
          message: `Running ${v.scheduleDeviationMinutes} minutes behind schedule due to transit corridor delays.`,
          metricValue: `+${v.scheduleDeviationMinutes}m late`,
          timestamp: state.currentTime,
        });
      }
    });

    // Check stops for queue build-up and missed connections
    stops.forEach(s => {
      if (s.waitingPassengers >= 45) {
        capacityViolationsCount++;
        alerts.push({
          id: `ALT-STP-${s.id}`,
          type: 'capacity_violation',
          severity: 'critical',
          stopId: s.id,
          title: `Severe Queue Build-up at ${s.name}`,
          message: `${s.waitingPassengers} passengers waiting. Current shuttle frequency is insufficient to clear queue.`,
          metricValue: `${s.waitingPassengers} waiting`,
          timestamp: state.currentTime,
        });
      }

      if (s.isTransferHub && state.trafficMultiplier >= 1.35) {
        alerts.push({
          id: `ALT-HUB-${s.id}`,
          type: 'missed_connection',
          severity: 'warning',
          stopId: s.id,
          title: `Transfer Window at Risk: ${s.name}`,
          message: `Connecting shuttles experiencing arrival drift. Passenger transfer connection buffer under 3 minutes.`,
          timestamp: state.currentTime,
        });
      }
    });

    // Check routes at risk
    routes.forEach(r => {
      const assigned = vehicles.filter(v => v.assignedRouteId === r.id);
      const totalCap = assigned.reduce((sum, v) => sum + (v.status !== 'maintenance' ? v.capacity : 0), 0);
      const isOverloaded = assigned.some(v => v.currentPassengers / Math.max(1, v.capacity) > 0.9);
      if (isOverloaded || assigned.length === 0 || totalCap < 30) {
        routesAtRiskCount++;
      }
    });

    // Compute key metrics
    const totalPassengerDemand = stops.reduce((sum, s) => sum + s.waitingPassengers, 0) +
      vehicles.reduce((sum, v) => sum + v.currentPassengers, 0);

    const baseWaitingMin = 5.2;
    const congestionWaitBonus = (state.trafficMultiplier - 1.0) * 4.5 + (state.demandMultiplier - 1.0) * 3.8;
    const averageWaitingTimeMinutes = Math.round((baseWaitingMin + congestionWaitBonus) * 10) / 10;

    const onTimeVehicles = vehicles.filter(v => v.scheduleDeviationMinutes <= 2 && v.status !== 'maintenance');
    const onTimePerformancePct = vehicles.length > 0
      ? Math.round((onTimeVehicles.length / vehicles.length) * 100)
      : 100;

    // Hourly demand curve
    const hourlyDemand = [
      { hour: '07:00', normalDemand: 180, peakDemand: 220, servedCapacity: 260 },
      { hour: '08:00', normalDemand: 340, peakDemand: 580, servedCapacity: 380 },
      { hour: '09:00', normalDemand: 420, peakDemand: 720, servedCapacity: 410 },
      { hour: '10:00', normalDemand: 290, peakDemand: 460, servedCapacity: 380 },
      { hour: '11:00', normalDemand: 210, peakDemand: 260, servedCapacity: 320 },
      { hour: '12:00', normalDemand: 310, peakDemand: 390, servedCapacity: 340 },
      { hour: '13:00', normalDemand: 380, peakDemand: 480, servedCapacity: 360 },
      { hour: '14:00', normalDemand: 240, peakDemand: 290, servedCapacity: 320 },
      { hour: '15:00', normalDemand: 260, peakDemand: 310, servedCapacity: 320 },
      { hour: '16:00', normalDemand: 330, peakDemand: 430, servedCapacity: 360 },
      { hour: '17:00', normalDemand: 450, peakDemand: 680, servedCapacity: 410 },
      { hour: '18:00', normalDemand: 390, peakDemand: 590, servedCapacity: 380 },
      { hour: '19:00', normalDemand: 250, peakDemand: 320, servedCapacity: 320 },
      { hour: '20:00', normalDemand: 160, peakDemand: 190, servedCapacity: 240 },
    ];

    return {
      metrics: {
        activeVehicles: activeVehicles.length,
        totalPassengerDemand,
        averageWaitingTimeMinutes,
        capacityViolations: capacityViolationsCount,
        routesAtRisk: routesAtRiskCount,
        onTimePerformancePct,
      },
      simulationState: state,
      routes,
      stops,
      vehicles,
      upcomingDepartures: upcomingDepartures.slice(0, 10),
      alerts: alerts.slice(0, 8),
      hourlyDemand,
    };
  }

  /**
   * Get demand analytics breakdown
   */
  public getDemandAnalytics(): DemandAnalyticsData {
    const state = this.dataStore.getSimulationState();
    const stops = this.dataStore.getStops();
    const routes = this.dataStore.getRoutes();
    const vehicles = this.dataStore.getVehicles();

    const hourlyTrends = [
      { hour: '06:00', totalDemand: 95, totalCapacity: 220, boardingCount: 90, alightingCount: 85, isPeak: false },
      { hour: '07:00', totalDemand: 240, totalCapacity: 310, boardingCount: 225, alightingCount: 210, isPeak: false },
      { hour: '08:00', totalDemand: 680, totalCapacity: 450, boardingCount: 450, alightingCount: 380, isPeak: true },
      { hour: '09:00', totalDemand: 820, totalCapacity: 490, boardingCount: 490, alightingCount: 470, isPeak: true },
      { hour: '10:00', totalDemand: 490, totalCapacity: 450, boardingCount: 440, alightingCount: 460, isPeak: false },
      { hour: '11:00', totalDemand: 280, totalCapacity: 380, boardingCount: 275, alightingCount: 280, isPeak: false },
      { hour: '12:00', totalDemand: 410, totalCapacity: 380, boardingCount: 380, alightingCount: 370, isPeak: false },
      { hour: '13:00', totalDemand: 520, totalCapacity: 420, boardingCount: 420, alightingCount: 415, isPeak: false },
      { hour: '14:00', totalDemand: 310, totalCapacity: 380, boardingCount: 300, alightingCount: 310, isPeak: false },
      { hour: '15:00', totalDemand: 340, totalCapacity: 380, boardingCount: 335, alightingCount: 340, isPeak: false },
      { hour: '16:00', totalDemand: 480, totalCapacity: 420, boardingCount: 420, alightingCount: 410, isPeak: false },
      { hour: '17:00', totalDemand: 760, totalCapacity: 480, boardingCount: 480, alightingCount: 460, isPeak: true },
      { hour: '18:00', totalDemand: 650, totalCapacity: 450, boardingCount: 450, alightingCount: 440, isPeak: true },
      { hour: '19:00', totalDemand: 360, totalCapacity: 380, boardingCount: 355, alightingCount: 360, isPeak: false },
      { hour: '20:00', totalDemand: 210, totalCapacity: 310, boardingCount: 205, alightingCount: 210, isPeak: false },
      { hour: '21:00', totalDemand: 130, totalCapacity: 220, boardingCount: 125, alightingCount: 130, isPeak: false },
    ].map(item => ({
      ...item,
      totalDemand: Math.round(item.totalDemand * state.demandMultiplier),
      boardingCount: Math.round(item.boardingCount * Math.min(1.2, state.demandMultiplier)),
    }));

    const routeDemand = routes.map(r => {
      const assigned = vehicles.filter(v => v.assignedRouteId === r.id && v.status !== 'maintenance');
      const allocatedCapacity = assigned.reduce((sum, v) => sum + v.capacity, 0);
      const activePassengers = assigned.reduce((sum, v) => sum + v.currentPassengers, 0);
      const stopsDemand = r.stops.reduce((sum, rs) => {
        const s = stops.find(stp => stp.id === rs.stopId);
        return sum + (s ? s.waitingPassengers : 0);
      }, 0);

      const totalRouteDemand = Math.round((activePassengers + stopsDemand) * state.demandMultiplier);
      const utilizationPct = allocatedCapacity > 0 ? Math.round((totalRouteDemand / (allocatedCapacity * 2.5)) * 100) : 0;
      
      let status: 'underutilized' | 'balanced' | 'overcrowded' = 'balanced';
      if (utilizationPct > 90) status = 'overcrowded';
      else if (utilizationPct < 35) status = 'underutilized';

      return {
        routeId: r.id,
        routeName: r.name,
        routeColor: r.color,
        hourlyDemand: totalRouteDemand,
        allocatedCapacity: allocatedCapacity * 3, // hourly capacity ~3 runs
        utilizationPct,
        status,
      };
    });

    const stopDemandRanked = [...stops]
      .map(s => {
        let risk: 'low' | 'moderate' | 'high' | 'severe' = 'low';
        if (s.waitingPassengers >= 45) risk = 'severe';
        else if (s.waitingPassengers >= 30) risk = 'high';
        else if (s.waitingPassengers >= 15) risk = 'moderate';

        return {
          stopId: s.id,
          stopName: s.name,
          zone: s.zone,
          hourlyBoardings: Math.round(s.currentDemandRate * state.demandMultiplier),
          waitingQueue: s.waitingPassengers,
          congestionRisk: risk,
        };
      })
      .sort((a, b) => b.waitingQueue - a.waitingQueue);

    return {
      hourlyTrends,
      routeDemand,
      stopDemandRanked,
      peakHours: ['08:00 - 10:00 (Morning Rush)', '17:00 - 19:00 (Evening Departure)'],
      overcrowdedHours: ['08:30 - 09:30', '17:30 - 18:30'],
    };
  }
}
