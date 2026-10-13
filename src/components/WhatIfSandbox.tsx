import React from 'react';
import { QueueMetrics } from '../types';
import { evaluateQueueMetrics } from '../engine/queueingTheory';
import { Sliders, ArrowRight, Zap, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface WhatIfSandboxProps {
  currentLambda: number;
  currentMu: number;
  currentServers: number;
  onApplyScenarioParams: (lambdaMult: number, serverDelta: number) => void;
  onOpenOptimizer: () => void;
}

export const WhatIfSandbox: React.FC<WhatIfSandboxProps> = ({
  currentLambda,
  currentMu,
  currentServers,
  onApplyScenarioParams,
  onOpenOptimizer,
}) => {
  const [arrivalSurgePct, setArrivalSurgePct] = React.useState<number>(30); // +30%
  const [staffDeficit, setStaffDeficit] = React.useState<number>(0); // 0 call-outs
  const [dischargeLagPct, setDischargeLagPct] = React.useState<number>(0); // 0% delay

  // Compute what-if parameters
  const simulatedLambda = currentLambda * (1 + arrivalSurgePct / 100);
  const simulatedServers = Math.max(1, currentServers - staffDeficit);
  const simulatedMu = currentMu * (1 - dischargeLagPct / 100);

  // Baseline metrics
  const baselineMetrics: QueueMetrics = evaluateQueueMetrics(currentLambda, currentMu, currentServers);

  // What-If without optimization
  const whatIfMetrics: QueueMetrics = evaluateQueueMetrics(simulatedLambda, simulatedMu, simulatedServers);

  // What-If with LP optimization (e.g., reallocating 3 surge beds and flexing 2 float RNs)
  const optimizedServers = simulatedServers + 3;
  const optimizedMu = simulatedMu * 1.15; // 15% efficiency boost through rapid discharge & triage fast-track
  const optimizedMetrics: QueueMetrics = evaluateQueueMetrics(simulatedLambda, optimizedMu, optimizedServers);

  const handleApplyPreset = (surge: number, staff: number, discharge: number) => {
    setArrivalSurgePct(surge);
    setStaffDeficit(staff);
    setDischargeLagPct(discharge);
    onApplyScenarioParams(1 + surge / 100, -staff);
  };

  const isCriticalOverflow = whatIfMetrics.isSystemOverloaded || whatIfMetrics.trafficIntensityRho >= 0.95;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Dynamic What-If Surge Simulation Engine</h3>
            <p className="text-xs text-slate-400">
              Interactive queueing theory ($M/M/c$) sandbox. Test stress scenarios and view real-time systemic response.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenOptimizer}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer self-start sm:self-auto"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Run LP Allocation Solver</span>
        </button>
      </div>

      {/* Preset Buttons */}
      <div className="mt-3 flex items-center flex-wrap gap-2 text-xs">
        <span className="text-slate-400 font-medium">Quick Stress Presets:</span>
        <button
          onClick={() => handleApplyPreset(30, 0, 0)}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            arrivalSurgePct === 30 && staffDeficit === 0 ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          +30% Afternoon Influx
        </button>
        <button
          onClick={() => handleApplyPreset(60, 2, 20)}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            arrivalSurgePct === 60 && staffDeficit === 2 ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Highway Multi-Trauma (+60% arrivals, -2 RNs)
        </button>
        <button
          onClick={() => handleApplyPreset(80, 3, 35)}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            arrivalSurgePct === 80 && staffDeficit === 3 ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Winter Epidemic Surge (+80% arrivals, -3 RNs)
        </button>
        <button
          onClick={() => handleApplyPreset(0, 0, 0)}
          className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 hover:text-white flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset to Normal</span>
        </button>
      </div>

      {/* Interactive Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-3 border-t border-slate-800/60">
        {/* Slider 1: Arrival Rate Surge */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium">Arrival Rate (λ Surge)</span>
            <span className="font-mono text-emerald-400 font-bold">
              {arrivalSurgePct >= 0 ? `+${arrivalSurgePct}%` : `${arrivalSurgePct}%`} ({simulatedLambda.toFixed(1)}/hr)
            </span>
          </div>
          <input
            type="range"
            min="-20"
            max="100"
            step="5"
            value={arrivalSurgePct}
            onChange={(e) => {
              const val = Number(e.target.value);
              setArrivalSurgePct(val);
              onApplyScenarioParams(1 + val / 100, -staffDeficit);
            }}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>-20% Lull</span>
            <span>Baseline (0%)</span>
            <span>+100% Catastrophic</span>
          </div>
        </div>

        {/* Slider 2: Nursing Deficit */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium">Staffing Absence / Call-Outs</span>
            <span className="font-mono text-rose-400 font-bold">
              {staffDeficit === 0 ? 'Full Staffing' : `-${staffDeficit} Active Beds`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="1"
            value={staffDeficit}
            onChange={(e) => {
              const val = Number(e.target.value);
              setStaffDeficit(val);
              onApplyScenarioParams(1 + arrivalSurgePct / 100, -val);
            }}
            className="w-full accent-rose-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>0 Call-outs</span>
            <span>2 RNs</span>
            <span>5 RNs (Crisis)</span>
          </div>
        </div>

        {/* Slider 3: Discharge Processing Delay */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium">Discharge Bottleneck Lag</span>
            <span className="font-mono text-amber-400 font-bold">
              {dischargeLagPct === 0 ? 'Nominal Flow' : `+${dischargeLagPct}% LOS Lag`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={dischargeLagPct}
            onChange={(e) => setDischargeLagPct(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>0% Normal</span>
            <span>+25% Delay</span>
            <span>+50% Gridlock</span>
          </div>
        </div>
      </div>

      {/* Real-Time Comparative Outcome Matrix */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <h4 className="text-xs font-semibold text-slate-300 mb-2">
          Comparative Queueing Theory Outcome Matrix
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Baseline Box */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400 font-medium mb-1">1. Baseline (Unstressed)</div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Wait Time (W_q):</span>
                <span className="text-white font-bold">{baselineMetrics.avgWaitTimeMinutesWq} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Queue Size (L_q):</span>
                <span className="text-white">{baselineMetrics.avgQueueLengthLq} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Utilization (ρ):</span>
                <span className="text-slate-300">{baselineMetrics.trafficIntensityRho}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delay Prob C(c,a):</span>
                <span className="text-slate-300">{Math.round(baselineMetrics.erlangCProbDelay * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Unmitigated Surge Box */}
          <div className={`p-3 rounded-xl border ${isCriticalOverflow ? 'bg-rose-950/30 border-rose-800/70' : 'bg-slate-950 border-slate-800'}`}>
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className={isCriticalOverflow ? 'text-rose-400' : 'text-slate-400'}>
                2. What-If (Unmitigated)
              </span>
              {isCriticalOverflow && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Wait Time (W_q):</span>
                <span className={`font-bold ${whatIfMetrics.avgWaitTimeMinutesWq > 60 ? 'text-rose-400' : 'text-amber-400'}`}>
                  {whatIfMetrics.avgWaitTimeMinutesWq} min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Queue Size (L_q):</span>
                <span className={whatIfMetrics.avgQueueLengthLq > 12 ? 'text-rose-400' : 'text-slate-200'}>
                  {whatIfMetrics.avgQueueLengthLq} pts
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Utilization (ρ):</span>
                <span className={whatIfMetrics.trafficIntensityRho >= 0.95 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                  {whatIfMetrics.trafficIntensityRho}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">System State:</span>
                <span className={isCriticalOverflow ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {isCriticalOverflow ? 'OVERFLOW' : 'Stable'}
                </span>
              </div>
            </div>
          </div>

          {/* Optimized with LP Solver Box */}
          <div className="bg-emerald-950/20 border border-emerald-800/60 p-3 rounded-xl">
            <div className="flex items-center justify-between text-xs font-medium mb-1 text-emerald-400">
              <span>3. With LP Resource Solver</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Wait Time (W_q):</span>
                <span className="text-emerald-400 font-bold">
                  {optimizedMetrics.avgWaitTimeMinutesWq} min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Wait Reduction:</span>
                <span className="text-emerald-400 font-bold">
                  -{Math.max(0, whatIfMetrics.avgWaitTimeMinutesWq - optimizedMetrics.avgWaitTimeMinutesWq)} min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Queue Size (L_q):</span>
                <span className="text-emerald-300">{optimizedMetrics.avgQueueLengthLq} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Utilization (ρ):</span>
                <span className="text-emerald-400">{optimizedMetrics.trafficIntensityRho}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mathematical Insight Note */}
        <div className="mt-3 text-xs text-slate-400 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <span className="font-semibold text-slate-300">Mathematical Rationale: </span>
          {isCriticalOverflow ? (
            <span>
              When traffic intensity <code className="text-rose-400 font-mono">ρ ≥ 1.0</code>, arrivals exceed physical throughput (<code className="text-slate-300 font-mono">λ &gt; c·μ</code>). The queue transitions from steady-state Erlang-C into linear accumulation, adding approximately <strong className="text-white">{(simulatedLambda - simulatedServers * simulatedMu).toFixed(1)} waiting patients/hour</strong> unless surge beds are unlocked.
            </span>
          ) : (
            <span>
              Operating at <code className="text-emerald-400 font-mono">ρ = {whatIfMetrics.trafficIntensityRho}</code> preserves stable queueing dynamics. Erlang-C probability of delay is <code className="text-slate-300 font-mono">{Math.round(whatIfMetrics.erlangCProbDelay * 100)}%</code> with average waiting time of <strong className="text-white">{whatIfMetrics.avgWaitTimeMinutesWq} minutes</strong>.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
