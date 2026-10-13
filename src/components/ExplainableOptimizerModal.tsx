import React from 'react';
import { LPOptimizationResult, LPDecisionVariable } from '../types';
import { Zap, X, Check, TrendingDown, DollarSign, ShieldAlert, Cpu, ArrowRight, HelpCircle } from 'lucide-react';

interface ExplainableOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lpResult: LPOptimizationResult;
  onApplyOptimization: () => void;
  isApplied: boolean;
}

export const ExplainableOptimizerModal: React.FC<ExplainableOptimizerModalProps> = ({
  isOpen,
  onClose,
  lpResult,
  onApplyOptimization,
  isApplied,
}) => {
  const [activeTab, setActiveTab] = React.useState<'actions' | 'math' | 'shadow_prices'>('actions');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative text-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Linear Programming Optimization Engine</h3>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Primal-Dual Solver
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mathematical multi-variable resource allocation minimizing wait times and staffing ratio violations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="my-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-center">
          <div>
            <div className="text-[10px] text-slate-500">Wait Reduction</div>
            <div className="text-lg font-bold text-emerald-400">
              -{lpResult.percentageImprovement}%
            </div>
            <div className="text-[10px] text-slate-400">
              {lpResult.averageWaitBeforeMin}m → {lpResult.averageWaitAfterMin}m
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Objective Z</div>
            <div className="text-lg font-bold text-cyan-400">
              {lpResult.objectiveValueBaseline} → {lpResult.objectiveValueOptimized}
            </div>
            <div className="text-[10px] text-slate-400">Loss Minimization</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">ICU Downstream</div>
            <div className="text-lg font-bold text-emerald-400">Resolved</div>
            <div className="text-[10px] text-slate-400">Step-Down Flow Freed</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Shift Value / Cost Avoidance</div>
            <div className="text-lg font-bold text-emerald-400">
              ${(lpResult.costAvoidanceDollars / 1000).toFixed(1)}k
            </div>
            <div className="text-[10px] text-slate-400">Averted Penalties</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-800 pb-2 text-xs">
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'actions' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Recommended Reallocations ({lpResult.decisions.length})
          </button>
          <button
            onClick={() => setActiveTab('math')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'math' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            LP Formulation & Constraints
          </button>
          <button
            onClick={() => setActiveTab('shadow_prices')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'shadow_prices' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dual Variables / Shadow Prices
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
          {activeTab === 'actions' && (
            <div className="space-y-3">
              {lpResult.decisions.map((decision, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-100 text-sm">
                        {decision.actionType.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded text-[11px] border border-emerald-800">
                        Qty: {decision.quantity}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-emerald-400 font-bold">
                        -{decision.estimatedWaitReductionMinutes} min
                      </span>
                      <div className="text-[10px] text-slate-500 font-mono">est. department impact</div>
                    </div>
                  </div>

                  <div className="mt-2.5 text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-400 font-semibold shrink-0">Why this decision?</span>
                      <span>{decision.clinicalRationale}</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1 font-mono text-cyan-400">
                      <span>Shadow Price:</span>
                      <span>{decision.mathShadowPrice}</span>
                    </div>
                    <div className="text-slate-500 font-mono">
                      Confidence: {Math.round(decision.confidenceScore * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'math' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <div>
                <h4 className="font-bold text-slate-200 text-xs mb-1 font-mono">Objective Function Formulation</h4>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-emerald-400 text-xs overflow-x-auto">
                  {lpResult.mathematicalFormulation.objective}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Minimizes systemic patient wait time weighted by Emergency Severity Index, penalties for exceeding nurse ratios, and ambulance diversion overhead.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 text-xs mb-1.5 font-mono">Hard & Soft Operational Constraints</h4>
                <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                  {lpResult.mathematicalFormulation.keyConstraints.map((c, i) => (
                    <li key={i} className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'shadow_prices' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs">
                In Linear Programming, <strong>Shadow Prices (Dual Multipliers $\lambda^*$)</strong> quantify exactly how much the objective function (patient waiting time) improves if one additional unit of a constrained resource is added.
              </p>
              {lpResult.mathematicalFormulation.dualVariables.map((dv, idx) => (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-emerald-400 text-xs">{dv.name}</span>
                    <span className="bg-slate-900 px-2 py-0.5 rounded text-white font-bold border border-slate-800">
                      {dv.shadowPrice}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-300 text-xs">{dv.interpretation}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {isApplied ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Reallocation plan currently executing in live telemetry
              </span>
            ) : (
              <span>Ready to dispatch resource reallocations</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onApplyOptimization();
                onClose();
              }}
              disabled={isApplied}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition-colors cursor-pointer ${
                isApplied
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isApplied ? 'Optimization Active' : 'Execute LP Allocation'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
