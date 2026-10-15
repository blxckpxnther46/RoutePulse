import React, { useState } from 'react';
import { Vehicle, Route } from '../../types/index.js';
import { X, Bus, User, BatteryCharging, Gauge, CheckCircle2, AlertOctagon } from 'lucide-react';
import { getStatusBadgeClass, getUtilizationColor } from '../../utils/formatters.js';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  routes: Route[];
  onClose: () => void;
  onUpdateVehicleRoute?: (vehicleId: string, newRouteId: string | null) => Promise<void>;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  routes,
  onClose,
  onUpdateVehicleRoute,
}) => {
  if (!vehicle) return null;

  const [selectedRouteId, setSelectedRouteId] = useState<string>(vehicle.assignedRouteId || 'unassigned');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const utilization = vehicle.capacity > 0 ? Math.round((vehicle.currentPassengers / vehicle.capacity) * 100) : 0;
  const isOvercrowded = utilization >= 100;
  const isNearCapacity = utilization >= 85 && utilization < 100;

  const handleSaveRoute = async () => {
    if (!onUpdateVehicleRoute) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const routeVal = selectedRouteId === 'unassigned' ? null : selectedRouteId;
      await onUpdateVehicleRoute(vehicle.id, routeVal);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update vehicle route assignment:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm shadow-md">
              {vehicle.id}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getStatusBadgeClass(vehicle.status)}`}>
                  {vehicle.status.replace('_', ' ')}
                </span>
                <span className="text-xs font-mono text-slate-500 font-semibold">{vehicle.licensePlate}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{vehicle.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Capacity and Occupancy Progress Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span>Passenger Capacity & Occupancy</span>
              <span className="font-mono text-xs">{vehicle.currentPassengers} / {vehicle.capacity} seats ({utilization}%)</span>
            </div>
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, utilization)}%`,
                  backgroundColor: getUtilizationColor(utilization),
                }}
              />
            </div>
            <div className="mt-2 text-[11px] flex items-center justify-between">
              {isOvercrowded && (
                <span className="font-bold text-rose-600 flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5" /> Capacity Violation: Vehicle overcrowded!
                </span>
              )}
              {isNearCapacity && (
                <span className="font-semibold text-amber-700">Warning: Nearing maximum legal seated load</span>
              )}
              {!isOvercrowded && !isNearCapacity && (
                <span className="text-emerald-700 font-medium">Safe operating capacity</span>
              )}
              <span className="text-slate-500 font-mono text-[10px]">
                {Math.max(0, vehicle.capacity - vehicle.currentPassengers)} open seats
              </span>
            </div>
          </div>

          {/* Operational Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Driver Assigned
              </div>
              <span className="text-xs font-bold text-slate-900 block">{vehicle.driverName}</span>
              <span className="text-[10px] text-slate-500">Shift active</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <Gauge className="w-3.5 h-3.5 text-slate-400" /> Schedule Status
              </div>
              <span className={`text-xs font-bold font-mono block ${
                vehicle.scheduleDeviationMinutes > 3 ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                {vehicle.scheduleDeviationMinutes === 0
                  ? 'On Time (0m)'
                  : vehicle.scheduleDeviationMinutes > 0
                  ? `+${vehicle.scheduleDeviationMinutes}m Delayed`
                  : `${vehicle.scheduleDeviationMinutes}m Ahead`}
              </span>
              <span className="text-[10px] text-slate-500">Speed: {vehicle.currentLocation.currentSpeedKmh} km/h</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <BatteryCharging className="w-3.5 h-3.5 text-slate-400" /> Battery / Fuel
              </div>
              <span className="text-xs font-bold font-mono text-slate-900 block">
                {vehicle.batteryLevelPct !== undefined ? `${vehicle.batteryLevelPct}% Charged` : 'Full Tank (CNG)'}
              </span>
              <span className="text-[10px] text-slate-500">Model: {vehicle.model}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <Bus className="w-3.5 h-3.5 text-slate-400" /> Type & Class
              </div>
              <span className="text-xs font-bold text-slate-900 capitalize block">
                {vehicle.type.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-slate-500">
                {vehicle.isAccessible ? 'Wheelchair Accessible Ramp' : 'Standard Boarding'}
              </span>
            </div>
          </div>

          {/* Route Re-assignment Control */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Corridor Route Assignment
            </label>
            <p className="text-[11px] text-slate-500 mb-3">
              Reassign this vehicle to another campus route or reserve standby pool. Updates map and simulation immediately.
            </p>
            <div className="flex items-center gap-2">
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="unassigned">-- Staged in Standby Reserve Pool (Idle) --</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
              <button
                onClick={handleSaveRoute}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Updated!</span>
                  </>
                ) : (
                  <span>{isSaving ? 'Saving...' : 'Reassign'}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
