import React, { useState } from 'react';
import { 
  Bus, 
  Users, 
  Clock, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { DashboardData, Route, Stop, Vehicle, Departure, Alert } from '../types/index.js';
import { MetricCard } from '../components/dashboard/MetricCard.js';
import { TransportMap } from '../components/map/TransportMap.js';
import { UpcomingDeparturesPanel } from '../components/dashboard/UpcomingDeparturesPanel.js';
import { AlertsPanel } from '../components/dashboard/AlertsPanel.js';
import { RoutePerformanceTable } from '../components/dashboard/RoutePerformanceTable.js';
import { StopDetailModal } from '../components/map/StopDetailModal.js';
import { VehicleDetailModal } from '../components/map/VehicleDetailModal.js';

interface OverviewPageProps {
  data: DashboardData;
  onUpdateVehicleRoute: (vehicleId: string, newRouteId: string | null) => Promise<void>;
  onNavigateToOptimization: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  data,
  onUpdateVehicleRoute,
  onNavigateToOptimization,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);

  const { metrics, simulationState, routes, stops, vehicles, upcomingDepartures, alerts, hourlyDemand } = data;

  const handleSelectDeparture = (dep: Departure) => {
    setSelectedRouteId(dep.routeId);
    const stop = stops.find(s => s.id === dep.stopId);
    if (stop) setSelectedStop(stop);
  };

  const handleSelectAlert = (alert: Alert) => {
    if (alert.routeId) setSelectedRouteId(alert.routeId);
    if (alert.vehicleId) {
      const veh = vehicles.find(v => v.id === alert.vehicleId);
      if (veh) setSelectedVehicle(veh);
    }
    if (alert.stopId) {
      const stop = stops.find(s => s.id === alert.stopId);
      if (stop) setSelectedStop(stop);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top 6 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Active Fleet"
          value={`${metrics.activeVehicles} / ${vehicles.length}`}
          subtitle="Shuttles in service"
          icon={Bus}
          badge={`${Math.round((metrics.activeVehicles / vehicles.length) * 100)}% active`}
          badgeColor="blue"
        />

        <MetricCard
          title="Total Demand"
          value={metrics.totalPassengerDemand}
          subtitle="Students & staff in system"
          icon={Users}
          badge={`${simulationState.demandMultiplier.toFixed(1)}x load`}
          badgeColor="emerald"
        />

        <MetricCard
          title="Avg. Wait Time"
          value={`${metrics.averageWaitingTimeMinutes}m`}
          subtitle="Estimated platform wait"
          icon={Clock}
          badge={metrics.averageWaitingTimeMinutes > 8 ? 'High Wait' : 'Nominal'}
          badgeColor={metrics.averageWaitingTimeMinutes > 8 ? 'amber' : 'emerald'}
          highlightStatus={metrics.averageWaitingTimeMinutes > 9 ? 'warning' : 'healthy'}
        />

        <MetricCard
          title="Capacity Alerts"
          value={metrics.capacityViolations}
          subtitle="Overcrowded incidents"
          icon={AlertOctagon}
          badge={metrics.capacityViolations > 0 ? 'Action Needed' : 'Zero Violations'}
          badgeColor={metrics.capacityViolations > 0 ? 'rose' : 'emerald'}
          highlightStatus={metrics.capacityViolations > 0 ? 'critical' : 'healthy'}
        />

        <MetricCard
          title="Routes At Risk"
          value={metrics.routesAtRisk}
          subtitle="Bottlenecks detected"
          icon={AlertTriangle}
          badge={metrics.routesAtRisk > 0 ? 'At Risk' : 'All Clear'}
          badgeColor={metrics.routesAtRisk > 0 ? 'amber' : 'emerald'}
          highlightStatus={metrics.routesAtRisk > 0 ? 'warning' : 'healthy'}
        />

        <MetricCard
          title="On-Time Rate"
          value={`${metrics.onTimePerformancePct}%`}
          subtitle="Timetable punctuality"
          icon={CheckCircle2}
          badge={metrics.onTimePerformancePct >= 85 ? 'Healthy' : 'Degraded'}
          badgeColor={metrics.onTimePerformancePct >= 85 ? 'emerald' : 'rose'}
          highlightStatus={metrics.onTimePerformancePct < 80 ? 'critical' : 'healthy'}
        />
      </div>

      {/* Main Map & Live Feeds Grid (Map occupies ~60% area) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Map (approx 65% width on large screens) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Campus Transport Network</h2>
              <p className="text-xs text-slate-500">Interactive corridor paths, stop queue densities, and simulated shuttle progress</p>
            </div>
            {selectedRouteId && (
              <button
                onClick={() => setSelectedRouteId(null)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200"
              >
                Clear Route Filter
              </button>
            )}
          </div>

          <TransportMap
            routes={routes}
            stops={stops}
            vehicles={vehicles}
            selectedRouteId={selectedRouteId}
            selectedVehicleId={selectedVehicle?.id}
            selectedStopId={selectedStop?.id}
            onSelectRoute={(id) => setSelectedRouteId(id)}
            onSelectVehicle={(v) => setSelectedVehicle(v)}
            onSelectStop={(s) => setSelectedStop(s)}
            heightClass="h-[520px]"
          />

          {/* Mini Demand Sparkline / Area Chart */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  Hourly Campus Transit Demand Profile
                </span>
                <span className="text-[11px] text-slate-500">
                  Simulated passenger inflow vs allocated shuttle capacity across hours
                </span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                07:00 – 20:00 IST
              </span>
            </div>

            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyDemand} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="peakDemand" name="Peak Demand" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#demandGrad)" />
                  <Area type="monotone" dataKey="servedCapacity" name="Offered Capacity" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#capGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Departures & Capacity Alerts (~35% width) */}
        <div className="lg:col-span-4 space-y-5">
          <UpcomingDeparturesPanel
            departures={upcomingDepartures}
            onSelectDeparture={handleSelectDeparture}
          />

          <AlertsPanel
            alerts={alerts}
            onSelectAlert={handleSelectAlert}
          />
        </div>
      </div>

      {/* Route Performance Matrix Table */}
      <RoutePerformanceTable
        routes={routes}
        vehicles={vehicles}
        stops={stops}
        onSelectRoute={(id) => setSelectedRouteId(id === selectedRouteId ? null : id)}
        selectedRouteId={selectedRouteId}
      />

      {/* Modals for Stop and Vehicle details */}
      <StopDetailModal
        stop={selectedStop}
        routes={routes}
        departures={upcomingDepartures}
        onClose={() => setSelectedStop(null)}
        onSelectRoute={(routeId) => setSelectedRouteId(routeId)}
      />

      <VehicleDetailModal
        vehicle={selectedVehicle}
        routes={routes}
        onClose={() => setSelectedVehicle(null)}
        onUpdateVehicleRoute={onUpdateVehicleRoute}
      />
    </div>
  );
};
