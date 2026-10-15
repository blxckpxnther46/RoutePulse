export function formatTime(timeStr?: string): string {
  if (!timeStr) return '--:--';
  return timeStr;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatMinutes(mins: number): string {
  return `${Math.round(mins * 10) / 10} min`;
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'in_service':
    case 'in_transit':
    case 'on_time':
    case 'normal':
    case 'FEASIBLE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20';
    case 'delayed':
    case 'nearing_capacity':
    case 'approaching':
    case 'warning':
    case 'high':
      return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20';
    case 'maintenance':
    case 'exceeded':
    case 'overcrowded':
    case 'critical':
    case 'severe':
      return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20';
    case 'idle':
      return 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/20';
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20';
  }
}

export function getUtilizationColor(utilizationPct: number): string {
  if (utilizationPct >= 100) return '#ef4444'; // Red
  if (utilizationPct >= 85) return '#f59e0b'; // Amber
  if (utilizationPct >= 40) return '#10b981'; // Green
  return '#64748b'; // Slate (underutilized)
}
