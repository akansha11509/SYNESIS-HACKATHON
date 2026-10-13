import React from 'react';
import { UserRole, SystemAlert, SurgeScenario } from '../types';
import { ShieldAlert, Users, Building2, Eye, Bell, Play, Pause, Flame, Zap } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  alerts: SystemAlert[];
  onOpenAlerts: () => void;
  activeScenario: SurgeScenario;
  onOpenScenarioModal: () => void;
  isSimRunning: boolean;
  onToggleSim: () => void;
  simSpeed: number;
  onSetSimSpeed: (speed: number) => void;
  onQuickSurgeToggle: () => void;
  isSurgeActive: boolean;
  onOpenOptimizerModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  alerts,
  onOpenAlerts,
  activeScenario,
  onOpenScenarioModal,
  isSimRunning,
  onToggleSim,
  simSpeed,
  onSetSimSpeed,
  onQuickSurgeToggle,
  isSurgeActive,
  onOpenOptimizerModal,
}) => {
  const pendingAlertCount = alerts.filter((a) => !a.dispatched).length;

  return (
    <header className="border-b border-slate-800 bg-slate-950 text-slate-100 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Brand & Hospital Node */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-lg text-white">AegisFlow</span>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                    M/M/c + LP
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span>Central Metropolitan Hospital</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Telemetry Active
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Alert Icon */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={onOpenAlerts}
                className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
              >
                <Bell className="w-5 h-5" />
                {pendingAlertCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                    {pendingAlertCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Role Navigation Switcher */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl self-start lg:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => onRoleChange('ADMINISTRATOR')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                currentRole === 'ADMINISTRATOR'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Hospital Ops</span>
            </button>
            <button
              onClick={() => onRoleChange('TRIAGE_NURSE')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                currentRole === 'TRIAGE_NURSE'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>ER Charge & Triage</span>
            </button>
            <button
              onClick={() => onRoleChange('PUBLIC_VIEW')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                currentRole === 'PUBLIC_VIEW'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Public Diversion</span>
            </button>
          </div>

          {/* Action Center: Simulation Controls & Surge Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Crisis Injector Button */}
            <button
              onClick={onQuickSurgeToggle}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                isSurgeActive
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-950 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="Click to instantly inject a 60% influx surge and trigger LP optimization"
            >
              <Flame className={`w-3.5 h-3.5 ${isSurgeActive ? 'text-rose-400' : 'text-amber-400'}`} />
              <span>{isSurgeActive ? 'Surge Crisis Injected (+60%)' : 'Simulate Crisis Surge'}</span>
            </button>

            {/* Scenario Picker */}
            <button
              onClick={onOpenScenarioModal}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              <span className="text-slate-400">Mode:</span>
              <span className="font-medium text-white">{activeScenario.badge}</span>
            </button>

            {/* LP Optimizer Trigger */}
            <button
              onClick={onOpenOptimizerModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Solve Allocation</span>
            </button>

            {/* Sim Speed & Playback */}
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={onToggleSim}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                title={isSimRunning ? 'Pause simulation clock' : 'Resume simulation clock'}
              >
                {isSimRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              <button
                onClick={() => onSetSimSpeed(simSpeed === 1 ? 5 : simSpeed === 5 ? 20 : 1)}
                className="px-2 py-0.5 text-[11px] font-mono text-slate-300 hover:text-white"
                title="Change simulation speed multiplier"
              >
                {simSpeed}x
              </button>
            </div>

            {/* Desktop Alert Bell */}
            <button
              onClick={onOpenAlerts}
              className="hidden lg:flex relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 border border-slate-800"
            >
              <Bell className="w-4 h-4" />
              {pendingAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                  {pendingAlertCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
