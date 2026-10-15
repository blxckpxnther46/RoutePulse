import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'rose' | 'blue';
  highlightStatus?: 'healthy' | 'warning' | 'critical';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'blue',
  highlightStatus = 'healthy',
  trend,
}) => {
  const getHighlightClass = () => {
    switch (highlightStatus) {
      case 'critical':
        return 'border-rose-300 bg-rose-50/20';
      case 'warning':
        return 'border-amber-300 bg-amber-50/20';
      default:
        return 'border-slate-200 bg-white';
    }
  };

  const getIconContainerClass = () => {
    switch (highlightStatus) {
      case 'critical':
        return 'bg-rose-100 text-rose-600';
      case 'warning':
        return 'bg-amber-100 text-amber-600';
      default:
        return 'bg-blue-50 text-blue-600';
    }
  };

  return (
    <div className={`p-4 rounded-xl border shadow-xs transition-all hover:shadow-md ${getHighlightClass()}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg ${getIconContainerClass()}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            badgeColor === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
            badgeColor === 'amber' ? 'bg-amber-100 text-amber-800' :
            badgeColor === 'rose' ? 'bg-rose-100 text-rose-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
      {trend && (
        <div className="mt-2 flex items-center gap-1 text-[11px]">
          <span className={trend.isPositive ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
            {trend.value}
          </span>
          <span className="text-slate-400">vs nominal baseline</span>
        </div>
      )}
    </div>
  );
};
