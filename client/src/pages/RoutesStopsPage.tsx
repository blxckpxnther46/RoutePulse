import React, { useState } from 'react';
import { Route, Stop, Vehicle, RouteStop } from '../types/index.js';
import { 
  GitFork, 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  Bus, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  CornerDownRight, 
  Check, 
  X 
} from 'lucide-react';
import { api } from '../services/api.js';

interface RoutesStopsPageProps {
  routes: Route[];
  stops: Stop[];
  vehicles: Vehicle[];
  onRefresh: () => Promise<void>;
}

export const RoutesStopsPage: React.FC<RoutesStopsPageProps> = ({
  routes,
  stops,
  vehicles,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'routes' | 'stops'>('routes');
  
  // Route Modal State
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [routeName, setRouteName] = useState('');
  const [routeCode, setRouteCode] = useState('');
  const [routeColor, setRouteColor] = useState('#2563eb');
  const [routeDescription, setRouteDescription] = useState('');
  const [routeHeadway, setRouteHeadway] = useState(15);
  const [selectedStopIds, setSelectedStopIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Stop Modal State
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [stopWaiting, setStopWaiting] = useState(0);
  const [stopDemandRate, setStopDemandRate] = useState(100);
  const [stopIsTransferHub, setStopIsTransferHub] = useState(false);

  const openCreateRouteModal = () => {
    setEditingRoute(null);
    setRouteName('');
    setRouteCode(`R${routes.length + 1}-EXPRESS`);
    setRouteColor('#2563eb');
    setRouteDescription('');
    setRouteHeadway(15);
    setSelectedStopIds(stops.slice(0, 4).map(s => s.id));
    setErrorMessage('');
    setIsRouteModalOpen(true);
  };

  const openEditRouteModal = (route: Route) => {
    setEditingRoute(route);
    setRouteName(route.name);
    setRouteCode(route.code);
    setRouteColor(route.color);
    setRouteDescription(route.description);
    setRouteHeadway(route.headwayMinutes);
    setSelectedStopIds(route.stops.map(rs => rs.stopId));
    setErrorMessage('');
    setIsRouteModalOpen(true);
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName.trim()) {
      setErrorMessage('Route name is required.');
      return;
    }
    if (selectedStopIds.length < 2) {
      setErrorMessage('Select at least 2 stops to form an operational route sequence.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const stopsMap = new Map(stops.map(s => [s.id, s]));
      const formattedStops: RouteStop[] = selectedStopIds.map((sId, index) => ({
        stopId: sId,
        sequence: index + 1,
        scheduledTravelTimeFromPrevMin: index === 0 ? 0 : 4,
        dwellTimeSec: 45,
      }));

      const waypoints = selectedStopIds.map(sId => {
        const stp = stopsMap.get(sId);
        return stp ? [stp.lat, stp.lng] as [number, number] : [12.84, 80.15] as [number, number];
      });

      if (editingRoute) {
        await api.updateRoute(editingRoute.id, {
          name: routeName,
          code: routeCode,
          color: routeColor,
          description: routeDescription,
          headwayMinutes: routeHeadway,
          stops: formattedStops,
          waypoints,
        });
      } else {
        await api.createRoute({
          name: routeName,
          code: routeCode,
          color: routeColor,
          description: routeDescription,
          headwayMinutes: routeHeadway,
          stops: formattedStops,
          waypoints,
          operatingWindow: { start: '07:00', end: '22:00' },
          assignedVehicleIds: [],
        });
      }

      await onRefresh();
      setIsRouteModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save route');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!window.confirm(`Are you sure you want to delete route ${routeId}? Assigned vehicles will be returned to standby pool.`)) {
      return;
    }

    try {
      await api.deleteRoute(routeId);
      await onRefresh();
    } catch (err: any) {
      alert(`Error deleting route: ${err.message}`);
    }
  };

  const openEditStopModal = (stop: Stop) => {
    setEditingStop(stop);
    setStopWaiting(stop.waitingPassengers);
    setStopDemandRate(stop.currentDemandRate);
    setStopIsTransferHub(stop.isTransferHub);
    setIsStopModalOpen(true);
  };

  const handleSaveStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStop) return;

    setIsSubmitting(true);
    try {
      await api.updateStop(editingStop.id, {
        waitingPassengers: Number(stopWaiting),
        currentDemandRate: Number(stopDemandRate),
        isTransferHub: stopIsTransferHub,
      });
      await onRefresh();
      setIsStopModalOpen(false);
    } catch (err: any) {
      alert(`Error updating stop: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStopInSequence = (stopId: string) => {
    if (selectedStopIds.includes(stopId)) {
      setSelectedStopIds(selectedStopIds.filter(id => id !== stopId));
    } else {
      setSelectedStopIds([...selectedStopIds, stopId]);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Tab Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Campus Corridors & Stops Management</h2>
          <p className="text-xs text-slate-500">
            Define stop sequences, schedule travel times, allocate vehicles and calibrate station queue demands
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('routes')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'routes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <GitFork className="w-3.5 h-3.5 text-blue-600" />
              <span>Routes ({routes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('stops')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'stops' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-purple-600" />
              <span>Stops & Terminals ({stops.length})</span>
            </button>
          </div>

          {activeTab === 'routes' && (
            <button
              onClick={openCreateRouteModal}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Route</span>
            </button>
          )}
        </div>
      </div>

      {/* Routes View */}
      {activeTab === 'routes' && (
        <div className="grid grid-cols-1 gap-4">
          {routes.map(route => {
            const assigned = vehicles.filter(v => v.assignedRouteId === route.id);
            const totalCapacity = assigned.reduce((sum, v) => sum + v.capacity, 0);

            return (
              <div key={route.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: route.color }}></span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{route.name}</h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {route.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{route.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditRouteModal(route)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Route"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoute(route.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Delete Route"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Route Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100 my-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Scheduled Frequency</span>
                    <span className="font-mono font-bold text-slate-800">{route.headwayMinutes} min headway</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Operating Hours</span>
                    <span className="font-mono font-bold text-slate-800">{route.operatingWindow.start} - {route.operatingWindow.end}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Fleet</span>
                    <span className="font-bold text-slate-800">{assigned.length} shuttles ({totalCapacity} seats)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Stops in Loop</span>
                    <span className="font-bold text-slate-800">{route.stops.length} stations</span>
                  </div>
                </div>

                {/* Ordered Stops Sequence */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Station Sequence Order
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {route.stops.map((rs, idx) => {
                      const stopInfo = stops.find(s => s.id === rs.stopId);
                      return (
                        <React.Fragment key={rs.stopId + idx}>
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-800">
                            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                              {rs.sequence}
                            </span>
                            <span>{stopInfo ? stopInfo.name : rs.stopId}</span>
                            <span className="text-[10px] font-mono text-slate-400">({rs.scheduledTravelTimeFromPrevMin}m)</span>
                          </div>
                          {idx < route.stops.length - 1 && (
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stops View */}
      {activeTab === 'stops' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Stop Name & Code</th>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4">Waiting Passengers</th>
                  <th className="py-3 px-4">Inflow Demand</th>
                  <th className="py-3 px-4">Station Facilities</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {stops.map(stop => (
                  <tr key={stop.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 block">{stop.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{stop.code}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 capitalize font-medium text-slate-700">
                      {stop.zone}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                        stop.waitingPassengers >= 40
                          ? 'bg-rose-100 text-rose-800'
                          : stop.waitingPassengers >= 25
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {stop.waitingPassengers} waiting
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {stop.currentDemandRate} pax/hr
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {stop.isTransferHub && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                            Transfer Hub
                          </span>
                        )}
                        {stop.isAccessible ? (
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            Accessible
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Standard</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditStopModal(stop)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Edit Parameters
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Route Create / Edit Modal */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingRoute ? 'Edit Route Corridor' : 'Create New Campus Route'}
              </h3>
              <button
                onClick={() => setIsRouteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoute} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Route Name</label>
                <input
                  type="text"
                  required
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="e.g. Gold Line: Hostel-Library Direct"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Route Code</label>
                  <input
                    type="text"
                    required
                    value={routeCode}
                    onChange={(e) => setRouteCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Headway (Frequency)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="5"
                      max="60"
                      required
                      value={routeHeadway}
                      onChange={(e) => setRouteHeadway(parseInt(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-500 font-semibold">min</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Corridor Theme Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={routeColor}
                    onChange={(e) => setRouteColor(e.target.value)}
                    className="w-10 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                  />
                  <span className="text-xs font-mono font-semibold text-slate-600">{routeColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Corridor Purpose</label>
                <textarea
                  rows={2}
                  value={routeDescription}
                  onChange={(e) => setRouteDescription(e.target.value)}
                  placeholder="Short description of stops connected..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Stop Sequence Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Stops for Ordered Sequence ({selectedStopIds.length} selected)
                </label>
                <div className="border border-slate-200 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                  {stops.map(s => {
                    const isSelected = selectedStopIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleStopInSequence(s.id)}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors text-xs ${
                          isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>{s.name} ({s.code})</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRouteModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : editingRoute ? 'Save Changes' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stop Edit Modal */}
      {isStopModalOpen && editingStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure Stop Parameters</h3>
                <span className="text-xs text-slate-500 font-medium">{editingStop.name}</span>
              </div>
              <button onClick={() => setIsStopModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStop} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Waiting Passengers Queue</label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={stopWaiting}
                  onChange={(e) => setStopWaiting(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Demand Inflow Rate (pax/hr)</label>
                <input
                  type="number"
                  min="0"
                  max="800"
                  value={stopDemandRate}
                  onChange={(e) => setStopDemandRate(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="transferCheck"
                  checked={stopIsTransferHub}
                  onChange={(e) => setStopIsTransferHub(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="transferCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Designate as Inter-Modal Transfer Hub
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStopModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  {isSubmitting ? 'Updating...' : 'Save Parameters'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
