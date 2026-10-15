import { Vehicle, Route, Stop, Departure } from '../types/index.js';

export interface EtaCalculationResult {
  vehicleId: string;
  routeId: string;
  upcomingDepartures: Departure[];
  assumptions: {
    trafficMultiplier: number;
    dwellTimeAccounted: boolean;
    uncertaintyModel: string;
    isSimulatedFeed: boolean;
  };
}

export class EtaCalculator {
  /**
   * Calculate upcoming arrival windows for a vehicle along its assigned route
   */
  public static calculateVehicleEta(
    vehicle: Vehicle,
    route: Route,
    stopsMap: Map<string, Stop>,
    trafficMultiplier: number = 1.0,
    currentSimulatedTimeSec: number = 31500 // 08:45:00
  ): Departure[] {
    if (!vehicle.assignedRouteId || vehicle.status === 'maintenance' || vehicle.status === 'idle') {
      return [];
    }

    const departures: Departure[] = [];
    const routeStops = route.stops;
    const totalStops = routeStops.length;
    if (totalStops === 0) return [];

    let accumulatedMinutes = 0;
    const startIndex = vehicle.currentSegmentIndex;
    const progress = Math.max(0, Math.min(100, vehicle.segmentProgressPct)) / 100;

    // Upcoming stops from (currentSegmentIndex + 1) onwards (and loop if circular)
    for (let offset = 1; offset <= Math.min(5, totalStops); offset++) {
      const targetStopIndex = (startIndex + offset) % totalStops;
      const routeStop = routeStops[targetStopIndex];
      const stopInfo = stopsMap.get(routeStop.stopId);
      if (!stopInfo) continue;

      if (offset === 1) {
        // Immediate next stop: only remaining fraction of current segment
        const baseSegmentTravelMin = routeStop.scheduledTravelTimeFromPrevMin || 3;
        const remainingTravelTime = baseSegmentTravelMin * (1 - progress) * trafficMultiplier;
        accumulatedMinutes += remainingTravelTime + (vehicle.scheduleDeviationMinutes * 0.4);
      } else {
        // Intermediate travel time plus dwell time at previous stop
        const prevRouteStop = routeStops[(targetStopIndex - 1 + totalStops) % totalStops];
        const dwellMin = (prevRouteStop.dwellTimeSec || 45) / 60;
        const segmentTime = (routeStop.scheduledTravelTimeFromPrevMin || 3) * trafficMultiplier;
        accumulatedMinutes += segmentTime + dwellMin;
      }

      accumulatedMinutes = Math.max(0.5, accumulatedMinutes);

      // Uncertainty window expands with time into future
      const uncertaintyMins = 0.8 + (accumulatedMinutes * 0.15);
      const estArrivalSec = currentSimulatedTimeSec + Math.round(accumulatedMinutes * 60);
      const minArrivalSec = Math.max(currentSimulatedTimeSec, estArrivalSec - Math.round(uncertaintyMins * 60));
      const maxArrivalSec = estArrivalSec + Math.round(uncertaintyMins * 60);

      const scheduledSec = currentSimulatedTimeSec + Math.round((offset * 4) * 60);

      const formatTime = (secs: number) => {
        const hours = Math.floor((secs % 86400) / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      };

      const scheduledTimeStr = formatTime(scheduledSec);
      const estimatedTimeStr = formatTime(estArrivalSec);
      const etaWindowStr = `${formatTime(minArrivalSec)} - ${formatTime(maxArrivalSec)} (${Math.ceil(accumulatedMinutes)}m)`;

      // Status determination
      let status: 'on_time' | 'delayed' | 'approaching' | 'boarding' = 'on_time';
      if (accumulatedMinutes <= 1.0) {
        status = 'boarding';
      } else if (accumulatedMinutes <= 3.0) {
        status = 'approaching';
      } else if (vehicle.scheduleDeviationMinutes >= 3) {
        status = 'delayed';
      }

      // Crowding level
      const loadFactor = vehicle.capacity > 0 ? vehicle.currentPassengers / vehicle.capacity : 0;
      let crowdingLevel: 'low' | 'moderate' | 'high' | 'overcrowded' = 'low';
      if (loadFactor >= 1.0) crowdingLevel = 'overcrowded';
      else if (loadFactor >= 0.85) crowdingLevel = 'high';
      else if (loadFactor >= 0.55) crowdingLevel = 'moderate';

      departures.push({
        id: `DEP-${vehicle.id}-${stopInfo.id}-${offset}`,
        routeId: route.id,
        routeName: route.name,
        routeColor: route.color,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        stopId: stopInfo.id,
        stopName: stopInfo.name,
        scheduledTime: scheduledTimeStr,
        estimatedTime: estimatedTimeStr,
        etaWindow: etaWindowStr,
        status,
        availableCapacity: Math.max(0, vehicle.capacity - vehicle.currentPassengers),
        crowdingLevel,
      });
    }

    return departures;
  }
}
