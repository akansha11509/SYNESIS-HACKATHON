import React from 'react';
import { SurgeScenario } from '../types';
import { SURGE_SCENARIOS } from '../data/initialData';
import { X, Flame, ShieldAlert, Sparkles, Check } from 'lucide-react';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeScenarioId: string;
  onSelectScenario: (scenario: SurgeScenario) => void;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  activeScenarioId,
  onSelectScenario,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 text-slate-200 shadow-2xl relative">
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white text-base">Select Surge & Crisis Scenario</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant synthetic stress testing to evaluate M/M/c queue stability and LP resource reallocations.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {SURGE_SCENARIOS.map((sc) => {
            const isSelected = sc.id === activeScenarioId;

            return (
              <div
                key={sc.id}
                onClick={() => {
                  onSelectScenario(sc);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{sc.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      {sc.badge}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                </div>

                <p className="text-xs text-slate-400 mt-1">{sc.description}</p>

                <div className="mt-2 pt-2 border-t border-slate-900 flex items-center gap-4 text-[11px] font-mono text-slate-400">
                  <span>Arrival Mult: <strong className="text-slate-200">{sc.arrivalMultiplier}x</strong></span>
                  <span>Staffing Delta: <strong className="text-rose-400">{sc.staffReduction > 0 ? `-${sc.staffReduction} RNs` : 'Nominal'}</strong></span>
                  <span>Discharge Lag: <strong className="text-amber-400">+{sc.dischargeLagPercent}%</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
