import React from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  GitFork, 
  Bus, 
  BarChart3, 
  Cpu, 
  FileText, 
  Settings, 
  Compass, 
  Activity,
  Layers
} from 'lucide-react';

export type PageId = 
  | 'overview' 
  | 'live_map' 
  | 'routes_stops' 
  | 'fleet' 
  | 'demand' 
  | 'optimization' 
  | 'reports' 
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  activeAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  activeAlertsCount = 0,
}) => {
  const navItems = [
    { id: 'overview' as PageId, label: 'Overview', icon: LayoutDashboard },
    { id: 'live_map' as PageId, label: 'Live Map', icon: MapIcon },
    { id: 'routes_stops' as PageId, label: 'Routes & Stops', icon: GitFork },
    { id: 'fleet' as PageId, label: 'Fleet Management', icon: Bus },
    { id: 'demand' as PageId, label: 'Demand Analytics', icon: BarChart3 },
    { id: 'optimization' as PageId, label: 'Optimization Lab', icon: Cpu, badge: 'AI Core' },
    { id: 'reports' as PageId, label: 'Reports & Evaluation', icon: FileText },
    { id: 'settings' as PageId, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Compass className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold tracking-tight text-white">RoutePulse</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PS 06
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Intelligent Campus Mobility</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Transport Planning
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {item.badge}
                </span>
              )}

              {item.id === 'overview' && activeAlertsCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'
                }`}>
                  {activeAlertsCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Campus Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-slate-200 text-[11px]">CIATR Chennai Campus</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal">
          5 Routes • 14 Stops • 8 Shuttles
          <br />
          Synthetic Simulation Engine Active
        </p>
      </div>
    </aside>
  );
};
