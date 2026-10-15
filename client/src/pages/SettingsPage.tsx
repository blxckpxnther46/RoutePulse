import React, { useState } from 'react';
import { Settings, RotateCcw, Database, Shield, CheckCircle, Info, Server, Cpu } from 'lucide-react';
import { api } from '../services/api.js';

interface SettingsPageProps {
  onResetSimulation: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onResetSimulation }) => {
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!window.confirm('Reset the transport network, vehicle allocations, and schedules back to original initial seed baseline?')) {
      return;
    }
    setIsResetting(true);
    try {
      await onResetSimulation();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to reset simulation:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-base font-bold text-slate-900">Platform Settings & System Configuration</h2>
        <p className="text-xs text-slate-500">
          Manage simulation engine parameters, persistence stores, and optimization constraints
        </p>
      </div>

      {/* System Status Overview */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          RoutePulse System Diagnostics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Backend API Status</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Express v4.21 (Connected)
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Optimization Engine</span>
            <span className="font-bold text-blue-700 flex items-center gap-1.5 mt-1">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              TypeScript Deterministic Solver
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">GIS Mapping Layer</span>
            <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-1">
              Leaflet 1.9 + OpenStreetMap
            </span>
          </div>
        </div>
      </div>

      {/* Campus Configuration */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Configured Campus Network
        </h3>
        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="font-semibold text-slate-800">Campus Facility</span>
            <span>Chennai Institute of Advanced Technology & Research (CIATR)</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="font-semibold text-slate-800">Geographic Center</span>
            <span className="font-mono">12.8398° N, 80.1550° E (OMR Corridor, Chennai)</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="font-semibold text-slate-800">Enforced Minimum Transfer Buffer</span>
            <span className="font-mono font-bold text-blue-700">3.0 minutes</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="font-semibold text-slate-800">Maximum Vehicle Headway Threshold</span>
            <span className="font-mono font-bold text-blue-700">20.0 minutes</span>
          </div>
        </div>
      </div>

      {/* Data Store & Reset */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Persistence & Seed Calibration
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Operational changes (created routes, re-assigned shuttles, calibrated stop queues) are persisted to the backend JSON repository. Resetting restores the baseline timetable with known morning peak bottlenecks.
        </p>

        <div className="pt-2">
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>{isResetting ? 'Restoring Baseline...' : 'Reset Transport Network to Factory Baseline'}</span>
          </button>

          {resetSuccess && (
            <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Transport network successfully reset to baseline seed dataset.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
