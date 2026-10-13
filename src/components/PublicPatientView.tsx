import React from 'react';
import { RegionalHospital } from '../types';
import { Clock, ShieldAlert, Navigation, CheckCircle2, AlertTriangle, ArrowRight, MapPin, HeartPulse } from 'lucide-react';

interface PublicPatientViewProps {
  baseWaitMinutes: number;
  partnerHospitals: RegionalHospital[];
}

export const PublicPatientView: React.FC<PublicPatientViewProps> = ({
  baseWaitMinutes,
  partnerHospitals,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Critical Emergency Banner */}
      <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-4 sm:p-5 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-white text-base">Experiencing a Life-Threatening Emergency?</h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            If you are experiencing severe chest pain, stroke symptoms (facial drooping, slurred speech), severe difficulty breathing, or catastrophic bleeding, <strong>call 911 or come immediately</strong>. Critical patients (ESI 1 & 2) receive instantaneous resuscitation with <strong>zero waiting time</strong>.
          </p>
        </div>
      </div>

      {/* Main Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md text-center">
        <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
          Live Emergency Department Status
        </span>
        <h2 className="text-2xl font-bold text-white mt-2">Central Metropolitan Emergency Room</h2>
        <p className="text-xs text-slate-400 mt-1">
          Wait times are dynamically refreshed using predictive hospital queue models.
        </p>

        {/* Big Wait Clock */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Clock className="w-8 h-8 text-amber-400" />
          <div className="text-5xl sm:text-6xl font-extrabold font-mono text-white">
            {baseWaitMinutes}
          </div>
          <div className="text-left font-mono">
            <div className="text-lg font-bold text-slate-200">Minutes</div>
            <div className="text-xs text-slate-400">Estimated Door-to-Doctor</div>
          </div>
        </div>

        {/* Wait Breakdown by Common Conditions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 pt-6 border-t border-slate-800 text-left">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="text-xs text-rose-400 font-bold">Severe & Critical (Chest pain, Stroke)</div>
            <div className="text-xl font-bold font-mono text-white mt-1">0 - 5 min</div>
            <p className="text-[11px] text-slate-400 mt-1">Immediate resuscitation bay triage</p>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="text-xs text-amber-400 font-bold">Urgent (Severe abdominal pain, Asthma)</div>
            <div className="text-xl font-bold font-mono text-white mt-1">~{Math.round(baseWaitMinutes * 0.75)} min</div>
            <p className="text-[11px] text-slate-400 mt-1">Prioritized clinical acute care</p>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="text-xs text-emerald-400 font-bold">Minor Injuries (Sprains, Cuts, Rashes)</div>
            <div className="text-xl font-bold font-mono text-white mt-1">~{Math.round(baseWaitMinutes * 1.35)} min</div>
            <p className="text-[11px] text-slate-400 mt-1">Fast Track ambulatory care</p>
          </div>
        </div>
      </div>

      {/* Alternative Less Congested Facilities */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Faster Alternatives for Non-Critical Needs</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              If your condition is non-life-threatening, visiting a nearby partner clinic can significantly reduce your total time to receive medical care.
            </p>
          </div>
          <span className="text-xs text-cyan-400 bg-cyan-950 px-2 py-1 rounded border border-cyan-800 font-mono">
            Smart Diversion Active
          </span>
        </div>

        <div className="space-y-3">
          {partnerHospitals.map((hosp) => {
            const totalCareTime = hosp.driveTimeMinutes + hosp.erWaitTimeMinutes;
            const minutesSaved = baseWaitMinutes - totalCareTime;

            return (
              <div
                key={hosp.id}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{hosp.name}</h4>
                    <span className="text-xs text-slate-400 font-mono">
                      {hosp.distanceMiles} miles ({hosp.driveTimeMinutes} min drive)
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-300 mt-1.5">
                    <span>Current Wait: <strong className="text-emerald-400">{hosp.erWaitTimeMinutes} min</strong></span>
                    <span>Total Door-to-Doctor (inc. drive): <strong className="text-cyan-400">{totalCareTime} min</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {minutesSaved > 0 && (
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
                      Save ~{minutesSaved} mins
                    </span>
                  )}
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer">
                    <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Get Directions</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
