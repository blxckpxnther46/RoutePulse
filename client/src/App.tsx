import React, { useState, useEffect, useRef } from 'react';
import { 
  DashboardData, 
  Scenario, 
  ScenarioType, 
  DemandAnalyticsData, 
  ComparisonReport, 
  OptimizationRecommendation 
} from './types/index.js';
import { api } from './services/api.js';
import { Sidebar, PageId } from './components/layout/Sidebar.js';
import { Header } from './components/layout/Header.js';
import { OverviewPage } from './pages/OverviewPage.js';
import { LiveMapPage } from './pages/LiveMapPage.js';
import { RoutesStopsPage } from './pages/RoutesStopsPage.js';
import { FleetManagementPage } from './pages/FleetManagementPage.js';
import { DemandAnalyticsPage } from './pages/DemandAnalyticsPage.js';
import { OptimizationLabPage } from './pages/OptimizationLabPage.js';
import { ReportsEvaluationPage } from './pages/ReportsEvaluationPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { Compass, AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [demandData, setDemandData] = useState<DemandAnalyticsData | null>(null);
  const [comparison, setComparison] = useState<ComparisonReport | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const playbackTimerRef = useRef<any>(null);

  // Load initial data from backend API
  const loadData = async () => {
    try {
      setErrorMessage(null);
      const [dash, simStateRes, dem, optResults] = await Promise.all([
        api.getDashboard(),
        api.getSimulationState(),
        api.getDemand(),
        api.getOptimizationResults(),
      ]);

      setDashboardData(dash);
      setScenarios(simStateRes.scenarios);
      setDemandData(dem);
      setComparison(optResults.comparison);
      setRecommendations(optResults.recommendations);
    } catch (err: any) {
      console.error('Failed to load application data:', err);
      setErrorMessage(err.message || 'Unable to connect to RoutePulse backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle auto simulation playback
  useEffect(() => {
    if (dashboardData?.simulationState.isPlaying) {
      playbackTimerRef.current = setInterval(async () => {
        try {
          const updatedDash = await api.stepSimulation(2);
          setDashboardData(updatedDash);
        } catch (err) {
          console.error('Playback step error:', err);
        }
      }, 2500);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [dashboardData?.simulationState.isPlaying]);

  // Actions
  const handleStepSimulation = async () => {
    try {
      const updated = await api.stepSimulation(2);
      setDashboardData(updated);
    } catch (err: any) {
      alert(`Simulation step error: ${err.message}`);
    }
  };

  const handleTogglePlay = () => {
    if (!dashboardData) return;
    const currentPlaying = dashboardData.simulationState.isPlaying;
    setDashboardData({
      ...dashboardData,
      simulationState: {
        ...dashboardData.simulationState,
        isPlaying: !currentPlaying,
      },
    });
  };

  const handleSelectScenario = async (scenarioId: ScenarioType) => {
    try {
      setIsLoading(true);
      const res = await api.applyScenario(scenarioId);
      setDashboardData(res.dashboard);
      
      // Auto run optimization for the newly selected scenario to have fresh comparison
      const optRes = await api.runOptimization();
      setComparison(optRes.comparison);
      setRecommendations(optRes.recommendations);
      
      const updatedDemand = await api.getDemand();
      setDemandData(updatedDemand);
    } catch (err: any) {
      alert(`Failed to apply scenario: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSimulation = async () => {
    try {
      setIsLoading(true);
      const resetDash = await api.resetSimulation();
      setDashboardData(resetDash);
      const optRes = await api.runOptimization();
      setComparison(optRes.comparison);
      setRecommendations(optRes.recommendations);
      const updatedDemand = await api.getDemand();
      setDemandData(updatedDemand);
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunOptimization = async (options?: any) => {
    setIsOptimizing(true);
    try {
      const result = await api.runOptimization(options);
      setComparison(result.comparison);
      setRecommendations(result.recommendations);
      
      // If triggered from another page, navigate to optimization lab to view results
      if (currentPage !== 'optimization' && currentPage !== 'reports') {
        setCurrentPage('optimization');
      }
    } catch (err: any) {
      alert(`Optimization error: ${err.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyRecommendation = async (recId: string) => {
    try {
      await api.applyRecommendation(recId);
      // Refresh dashboard & optimization results
      const [updatedDash, updatedOpt] = await Promise.all([
        api.getDashboard(),
        api.getOptimizationResults(),
      ]);
      setDashboardData(updatedDash);
      setComparison(updatedOpt.comparison);
      setRecommendations(updatedOpt.recommendations);
    } catch (err: any) {
      alert(`Failed to apply recommendation: ${err.message}`);
    }
  };

  const handleUpdateVehicleRoute = async (vehicleId: string, newRouteId: string | null) => {
    try {
      await api.updateVehicle(vehicleId, { assignedRouteId: newRouteId });
      const updatedDash = await api.getDashboard();
      setDashboardData(updatedDash);
    } catch (err: any) {
      alert(`Failed to update vehicle route: ${err.message}`);
    }
  };

  // Loading Screen
  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/30 animate-bounce">
          <Compass className="w-6 h-6 text-white animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-base font-bold">RoutePulse Engine Initializing</h2>
          <p className="text-xs text-slate-400 mt-1">
            Loading CIATR campus GIS network and calibrating timetable constraints...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (errorMessage && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Backend Connection Error</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{errorMessage}</p>
          <button
            onClick={() => {
              setIsLoading(true);
              loadData();
            }}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const pageTitles: Record<PageId, { title: string; subtitle: string }> = {
    overview: {
      title: 'Operations Dashboard',
      subtitle: 'Real-time simulated campus network overview, alerts, and platform departure ETA feeds',
    },
    live_map: {
      title: 'Live Campus GIS Radar',
      subtitle: 'Full-scale interactive corridor map with active vehicle telemetry and stop queues',
    },
    routes_stops: {
      title: 'Corridor & Stop Management',
      subtitle: 'Configure stop sequences, operating hours, scheduled headways, and station facilities',
    },
    fleet: {
      title: 'Fleet Management & Rosters',
      subtitle: 'Inspect shuttle capacities, real-time occupancy load factors, and driver assignments',
    },
    demand: {
      title: 'Demand Analytics & Heatmaps',
      subtitle: 'Temporal passenger inflow modeling, peak hour surge detection, and capacity balance',
    },
    optimization: {
      title: 'Optimization Lab',
      subtitle: 'Constraint-aware solver testing: reallocations, headway tuning, and transfer synchronization',
    },
    reports: {
      title: 'Evaluation & Audit Reports',
      subtitle: 'Executive before-and-after assessment table, mathematical formulas, and CSV export',
    },
    settings: {
      title: 'System Settings',
      subtitle: 'Platform parameters, benchmark resets, and backend diagnostic information',
    },
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(p) => setCurrentPage(p)}
        activeAlertsCount={dashboardData.alerts.filter(a => a.severity === 'critical').length}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          title={pageTitles[currentPage].title}
          subtitle={pageTitles[currentPage].subtitle}
          simulationState={dashboardData.simulationState}
          scenarios={scenarios}
          onSelectScenario={handleSelectScenario}
          onStepSimulation={handleStepSimulation}
          onTogglePlay={handleTogglePlay}
          onResetSimulation={handleResetSimulation}
          onRunOptimization={() => handleRunOptimization()}
          isOptimizing={isOptimizing}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto">
          {currentPage === 'overview' && (
            <OverviewPage
              data={dashboardData}
              onUpdateVehicleRoute={handleUpdateVehicleRoute}
              onNavigateToOptimization={() => setCurrentPage('optimization')}
            />
          )}

          {currentPage === 'live_map' && (
            <LiveMapPage
              routes={dashboardData.routes}
              stops={dashboardData.stops}
              vehicles={dashboardData.vehicles}
              upcomingDepartures={dashboardData.upcomingDepartures}
              onUpdateVehicleRoute={handleUpdateVehicleRoute}
            />
          )}

          {currentPage === 'routes_stops' && (
            <RoutesStopsPage
              routes={dashboardData.routes}
              stops={dashboardData.stops}
              vehicles={dashboardData.vehicles}
              onRefresh={loadData}
            />
          )}

          {currentPage === 'fleet' && (
            <FleetManagementPage
              vehicles={dashboardData.vehicles}
              routes={dashboardData.routes}
              onUpdateVehicleRoute={handleUpdateVehicleRoute}
            />
          )}

          {currentPage === 'demand' && demandData && (
            <DemandAnalyticsPage
              demandData={demandData}
              scenarios={scenarios}
              activeScenarioId={dashboardData.simulationState.currentScenario}
              onSelectScenario={handleSelectScenario}
              routes={dashboardData.routes}
            />
          )}

          {currentPage === 'optimization' && (
            <OptimizationLabPage
              simulationState={dashboardData.simulationState}
              scenarios={scenarios}
              comparison={comparison}
              recommendations={recommendations}
              onRefreshOptimization={handleRunOptimization}
              onApplyRecommendation={handleApplyRecommendation}
              isOptimizing={isOptimizing}
            />
          )}

          {currentPage === 'reports' && (
            <ReportsEvaluationPage
              comparison={comparison}
              scenarios={scenarios}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              onResetSimulation={handleResetSimulation}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
