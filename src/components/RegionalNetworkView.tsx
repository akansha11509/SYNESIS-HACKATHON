import React from 'react';
import { RegionalHospital } from '../types';
import { Building2, Navigation, AlertCircle, CheckCircle, ArrowRight, Ambulance, Radio, ShieldCheck } from 'lucide-react';

interface RegionalNetworkViewProps {
  hospitals: RegionalHospital[];
  onTriggerDiversion: (targetHospitalId: string) => void;
  isDivertActive: boolean;
}

export const RegionalNetworkView: React.FC<RegionalNetworkViewProps> = ({
  hospitals,
  onTriggerDiversion,
  isDivertActive,
}) => {
  const centralHospital = hospitals.find((h) => h.id === 'hosp-metro') || hospitals[0];
  const partnerHospitals = hospitals.filter((h) => h.id !== 'hosp-metro');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">
              Regional Health Network & EMS Capacity Load-Balancing
            </h3>
            <p className="text-xs text-slate-400">
              Inter-facility bed census synchronization and smart ambulance diversion to avert catastrophic department lockup.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Regional District 4 Telemetry</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </div>

      {/* Primary Hospital Banner */}
      <div className="mt-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">{centralHospital.name}</span>
              <span className="text-xs font-mono text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                {centralHospital.traumaLevel}
              </span>
              <span className="text-xs text-slate-400">Local Facility</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs font-mono text-slate-300">
              <div>
                Occupancy: <strong className="text-rose-400">{centralHospital.occupancyPercent}%</strong>
              </div>
              <div>
                ER Wait: <strong className="text-rose-400">{centralHospital.erWaitTimeMinutes}m</strong>
              </div>
              <div>
                ICU Available: <strong className="text-amber-400">{centralHospital.icuAvailableBeds} Beds</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <div className="text-slate-400">EMS Receiving Status:</div>
              <div className="font-bold font-mono text-rose-400">
                {isDivertActive ? 'Level-2 Advisory Divert Active' : 'Accepting (Overcrowded)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Hospitals Grid */}
      <div className="mt-4">
        <h4 className="text-xs font-semibold text-slate-300 mb-2.5">
          Surrounding Healthcare Network Capacities
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {partnerHospitals.map((hosp) => {
            const timeToCareOurHosp = centralHospital.erWaitTimeMinutes;
            const timeToCarePartner = hosp.driveTimeMinutes + hosp.erWaitTimeMinutes;
            const timeSaved = timeToCareOurHosp - timeToCarePartner;

            return (
              <div
                key={hosp.id}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-slate-100 text-xs">{hosp.name}</h5>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {hosp.traumaLevel} · {hosp.distanceMiles} mi ({hosp.driveTimeMinutes} min drive)
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      {hosp.occupancyPercent}% Occ
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-slate-900 rounded-lg text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-slate-500">ER Wait Time</div>
                      <div className="font-bold text-slate-200">{hosp.erWaitTimeMinutes} min</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">ICU Open Beds</div>
                      <div className="font-bold text-emerald-400">{hosp.icuAvailableBeds} Open</div>
                    </div>
                  </div>

                  {/* Net Time to Care Comparison */}
                  <div className="mt-2.5 text-[11px] text-slate-300 bg-emerald-950/30 p-2 rounded border border-emerald-800/40">
                    <div className="flex items-center justify-between font-mono">
                      <span>Total Time to Care:</span>
                      <strong className="text-emerald-400">{timeToCarePartner} min</strong>
                    </div>
                    {timeSaved > 0 && (
                      <div className="text-[10px] text-emerald-400 mt-0.5 font-mono">
                        Diverting saves ~{timeSaved} minutes for non-critical patient!
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                    {hosp.status.replace(/_/g, ' ')}
                  </span>
                  <button
                    onClick={() => onTriggerDiversion(hosp.id)}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                  >
                    <span>Route Ambulances</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Regional Load Balancing Concept Note */}
      <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200">Regional Scalability Architecture: </strong>
            During regional crises (earthquakes, pandemics, mass casualties), no single facility can absorb the load alone. AegisFlow exposes an inter-hospital API mesh calculating real-time dynamic travel+wait times, automatically directing incoming EMS fleets to facilities with available capacity reserves before bottlenecks form.
          </div>
        </div>
      </div>
    </div>
  );
};
