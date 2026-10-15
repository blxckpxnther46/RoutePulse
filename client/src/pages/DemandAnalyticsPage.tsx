import React, { useState } from 'react';
import { DemandAnalyticsData, Scenario, ScenarioType, Route } from '../types/index.js';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  Calendar,
  Layers,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

interface DemandAnalyticsPageProps {
  demandData: DemandAnalyticsData;
  scenarios: Scenario[];
  activeScenarioId: ScenarioType;
  onSelectScenario: (id: ScenarioType) => void;
  routes: Route[];
}

export const DemandAnalyticsPage: React.FC<DemandAnalyticsPageProps> = ({
  demandData,
  scenarios,
  activeScenarioId,
  onSelectScenario,
  routes,
}) => {
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('all');
  const [timeWindowFilter, setTimeWindowFilter] = useState<'all' | 'peak' | 'evening'>('all');

  const { hourlyTrends, routeDemand, stopDemandRanked, peakHours, overcrowdedHours } = demandData;

  const filteredTrends = hourlyTrends.filter(item => {
    if (timeWindowFilter === 'peak' && !item.isPeak) return false;
    if (timeWindowFilter === 'evening' && parseInt(item.hour.split(':')[0]) < 16) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Passenger Demand Modeling & Capacity Analytics</h2>
          <p className="text-xs text-slate-500">
            Temporal demand profiles, platform accumulation rates, and capacity allocation balance
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Academic Term Weekday</span>
          </div>

          <select
            value={timeWindowFilter}
            onChange={(e) => setTimeWindowFilter(e.target.value as any)}
            className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Full Day (06:00 - 21:00)</option>
            <option value="peak">Peak Hours Only</option>
            <option value="evening">Afternoon & Evening (16:00+)</option>
          </select>

          <select
            value={activeScenarioId}
            onChange={(e) => onSelectScenario(e.target.value as ScenarioType)}
            className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {scenarios.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Peak Identification & Alert Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4 text-orange-600" />
            <span>Identified Peak Congestion Windows</span>
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2 space-y-1">
            {peakHours.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                <span>{h}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Driven by class changeovers and Chennai Metro commuter train arrivals
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200 shadow-2xs">
          <div className="flex items-center gap-2 text-rose-800 text-xs font-bold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Capacity Deficit Alert Windows</span>
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2 space-y-1">
            {overcrowdedHours.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-rose-700">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                <span>{h} (Offered seats &lt; Inflow)</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Optimizer reallocations required to prevent students being left behind
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-2xs">
          <div className="flex items-center gap-2 text-blue-800 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Transfer Connection Vulnerability</span>
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2">
            Stop S3 (Library Hub) & Stop S1 (Metro Gate)
          </div>
          <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
            Feeder R3 passenger transfers suffer an average 12-minute penalty when schedule drifts exceed 3 minutes.
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Passenger Demand vs Offered Capacity (Area Chart) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Temporal Passenger Demand vs Offered Fleet Capacity</h3>
              <p className="text-xs text-slate-500">Hourly student volume comparing total demand vs scheduled seats</p>
            </div>
            <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Pax / Hour
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="demandAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="capAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="totalDemand" name="Simulated Passenger Demand" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#demandAreaGrad)" />
                <Area type="monotone" dataKey="totalCapacity" name="Allocated Seat Capacity" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#capAreaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Route-Wise Demand vs Capacity Comparison (Bar Chart) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Route Corridor Demand Load Distribution</h3>
              <p className="text-xs text-slate-500">Hourly demand volume against offered seat bandwidth</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeDemand} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="routeId" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="hourlyDemand" name="Corridor Demand" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="allocatedCapacity" name="Offered Capacity" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stop Boarding Ranking & Queue Heatmap Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Station Boarding Ranking & Queue Bottleneck Analysis</h3>
            <p className="text-xs text-slate-500">Ranked by current platform passenger queue accumulation</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
            14 Station Platforms
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Rank & Stop Station</th>
                <th className="py-3 px-4">Campus Zone</th>
                <th className="py-3 px-4">Waiting Queue</th>
                <th className="py-3 px-4">Hourly Inflow Rate</th>
                <th className="py-3 px-4">Congestion Risk Tier</th>
                <th className="py-3 px-4">Platform Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {stopDemandRanked.map((stop, index) => (
                <tr key={stop.stopId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        index < 3 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-bold text-slate-900">{stop.stopName}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 capitalize font-medium text-slate-600">
                    {stop.zone}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                      stop.congestionRisk === 'severe'
                        ? 'bg-rose-100 text-rose-800'
                        : stop.congestionRisk === 'high'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {stop.waitingQueue} queued
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                    {stop.hourlyBoardings} pax/hr
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      stop.congestionRisk === 'severe'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : stop.congestionRisk === 'high'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : stop.congestionRisk === 'moderate'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {stop.congestionRisk} Risk
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {stop.congestionRisk === 'severe'
                      ? 'Severe passenger spillover; urgent shuttle injection recommended.'
                      : stop.congestionRisk === 'high'
                      ? 'Elevated peak arrivals nearing shelter queue limit.'
                      : 'Platform flow operating within design tolerance.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
