import React from 'react';
import { QueueMetrics, LPOptimizationResult } from '../types';
import { Clock, Activity, Users, DollarSign, TrendingDown, AlertCircle } from 'lucide-react';

interface MetricCardsProps {
  queueMetrics: QueueMetrics;
  lpResult: LPOptimizationResult;
  totalBeds: number;
  occupiedBeds: number;
  nurseRatioViolations: number;
  onOpenOptimizer: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  queueMetrics,
  lpResult,
  totalBeds,
  occupiedBeds,
  nurseRatioViolations,
  onOpenOptimizer,
}) => {
  const occupancyPct = Math.round((occupiedBeds / Math.max(1, totalBeds)) * 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. System Bed Occupancy */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Bed Occupancy</span>
          <Activity className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold font-mono ${occupancyPct > 90 ? 'text-rose-400' : occupancyPct > 80 ? 'text-amber-400' : 'text-slate-100'}`}>
              {occupancyPct}%
            </span>
            <span className="text-xs text-slate-500">
              {occupiedBeds}/{totalBeds}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyPct > 90 ? 'bg-rose-500' : occupancyPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, occupancyPct)}%` }}
            />
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-400">
          {occupancyPct >= 88 ? 'Near saturation limit' : 'Operational reserve OK'}
        </div>
      </div>

      {/* 2. Erlang-C Average Wait Time */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Wait Time (W_q)</span>
          <Clock className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold font-mono ${queueMetrics.avgWaitTimeMinutesWq > 60 ? 'text-rose-400' : 'text-slate-100'}`}>
              {queueMetrics.avgWaitTimeMinutesWq}
            </span>
            <span className="text-xs text-slate-500">min</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
            <TrendingDown className="w-3 h-3" />
            <span>Opt: {lpResult.averageWaitAfterMin}m (-{lpResult.percentageImprovement}%)</span>
          </div>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          M/M/c Erlang-C model
        </div>
      </div>

      {/* 3. Triage Queue Length (L_q) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Queue Size (L_q)</span>
          <Users className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {queueMetrics.avgQueueLengthLq}
            </span>
            <span className="text-xs text-slate-500">patients</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Arrivals: <span className="font-mono text-slate-200">{queueMetrics.arrivalRateLambda}/hr</span>
          </div>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          Waiting in triage hall
        </div>
      </div>

      {/* 4. Traffic Intensity (rho) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Traffic Intensity (ρ)</span>
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold font-mono ${queueMetrics.trafficIntensityRho >= 0.95 ? 'text-rose-400' : 'text-slate-100'}`}>
              {queueMetrics.trafficIntensityRho}
            </span>
            <span className="text-xs text-slate-500">λ / c·μ</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            P(Delay): <span className="font-mono text-slate-200">{Math.round(queueMetrics.erlangCProbDelay * 100)}%</span>
          </div>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          {queueMetrics.trafficIntensityRho >= 1 ? 'Unstable / Influx build-up' : 'Sub-critical flow'}
        </div>
      </div>

      {/* 5. Safe Staffing Ratios */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Nurse Staffing</span>
          <AlertCircle className={`w-3.5 h-3.5 ${nurseRatioViolations > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold font-mono ${nurseRatioViolations > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {nurseRatioViolations > 0 ? `${nurseRatioViolations} alerts` : '100% OK'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {nurseRatioViolations > 0 ? 'Ratio thresholds breached' : 'Mandated ratios met'}
          </div>
        </div>
        <button
          onClick={onOpenOptimizer}
          className="mt-1 text-[11px] text-emerald-400 hover:text-emerald-300 underline text-left cursor-pointer"
        >
          Auto-balance float RNs →
        </button>
      </div>

      {/* 6. Economic Value / Cost Avoidance */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Est. Cost Avoidance</span>
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              ${(lpResult.costAvoidanceDollars / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-slate-500">/shift</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Boarding penalties averted
          </div>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          Averted ambulance diversion
        </div>
      </div>
    </div>
  );
};
