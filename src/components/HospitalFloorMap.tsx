import React, { useState } from 'react';
import { Bed, Patient, NurseStaff, UnitType } from '../types';
import { Bed as BedIcon, AlertTriangle, Shield, CheckCircle2, Wind, Sparkles, X, HeartPulse, User } from 'lucide-react';

interface HospitalFloorMapProps {
  beds: Bed[];
  patients: Patient[];
  nurses: NurseStaff[];
  onDischargePatient: (patientId: string) => void;
  onAccelerateCleaning: (bedId: string) => void;
  onSelectBedForTransfer?: (bedId: string) => void;
}

export const HospitalFloorMap: React.FC<HospitalFloorMapProps> = ({
  beds,
  patients,
  nurses,
  onDischargePatient,
  onAccelerateCleaning,
}) => {
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');

  const selectedBed = beds.find((b) => b.id === selectedBedId);
  const patientInSelectedBed = selectedBed ? patients.find((p) => p.assignedBedId === selectedBed.id) : null;
  const nurseForSelectedBed = selectedBed ? nurses.find((n) => n.assignedBedIds.includes(selectedBed.id)) : null;

  // Group beds by unit
  const units: { key: UnitType; title: string; subtitle: string; iconColor: string }[] = [
    { key: 'ER_RESUS', title: 'ER Resuscitation', subtitle: 'ESI-1 Immediate Hemodynamic Stabilization', iconColor: 'text-rose-400' },
    { key: 'ER_ACUTE', title: 'ER Acute Care', subtitle: 'ESI-2/3 Urgent Emergency Bays', iconColor: 'text-amber-400' },
    { key: 'FAST_TRACK', title: 'Fast Track Ambulatory', subtitle: 'ESI-4/5 Minor Illness & Injury', iconColor: 'text-emerald-400' },
    { key: 'ICU', title: 'Intensive Care Unit (ICU)', subtitle: 'Critical Care Telemetry & Ventilation', iconColor: 'text-purple-400' },
    { key: 'STEP_DOWN', title: 'Progressive Care (PCU)', subtitle: 'Step-Down Monitored Beds', iconColor: 'text-blue-400' },
    { key: 'MED_SURG', title: 'Med-Surg Inpatient 3F', subtitle: 'General Acute Inpatient Beds', iconColor: 'text-teal-400' },
    { key: 'OBSERVATION', title: 'Clinical Decision (CDU)', subtitle: '12-24h Observation & Surge Flex Reserve', iconColor: 'text-indigo-400' },
  ];

  const getUnitSaturation = (unitKey: UnitType) => {
    const unitBeds = beds.filter((b) => b.unit === unitKey);
    const occupied = unitBeds.filter((b) => b.status === 'occupied' || b.status === 'isolation').length;
    return {
      total: unitBeds.length,
      occupied,
      pct: unitBeds.length > 0 ? Math.round((occupied / unitBeds.length) * 100) : 0,
    };
  };

  const filteredUnits = selectedUnitFilter === 'ALL' ? units : units.filter((u) => u.key === selectedUnitFilter);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-100 text-sm tracking-wide">
              Spatial Bed Allocation & Ward Saturation Map
            </h3>
            <span className="text-xs text-slate-400 font-mono">Live Physical Schematic</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time census by care pod. Select any bed to inspect clinical acuity, length-of-stay, and discharge pathways.
          </p>
        </div>

        {/* Unit Selector Filter */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedUnitFilter('ALL')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              selectedUnitFilter === 'ALL'
                ? 'bg-slate-800 text-white font-medium border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Pods
          </button>
          <button
            onClick={() => setSelectedUnitFilter('ER_ACUTE')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              selectedUnitFilter === 'ER_ACUTE'
                ? 'bg-slate-800 text-white font-medium border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ER Acute
          </button>
          <button
            onClick={() => setSelectedUnitFilter('ICU')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              selectedUnitFilter === 'ICU'
                ? 'bg-slate-800 text-white font-medium border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ICU
          </button>
          <button
            onClick={() => setSelectedUnitFilter('MED_SURG')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              selectedUnitFilter === 'MED_SURG'
                ? 'bg-slate-800 text-white font-medium border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Med-Surg
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center flex-wrap gap-4 py-2.5 text-xs text-slate-400 border-b border-slate-800/60">
        <span className="text-slate-500 font-medium">Bed Status:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          <span>Negative Pressure Isolation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span>EVS Cleaning / Turnaround</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>Discharge Ready (Unlocking Flow)</span>
        </div>
      </div>

      {/* Unit Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
        {filteredUnits.map((u) => {
          const unitBeds = beds.filter((b) => b.unit === u.key);
          const sat = getUnitSaturation(u.key);

          return (
            <div
              key={u.key}
              className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between"
            >
              <div>
                {/* Unit Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <BedIcon className={`w-4 h-4 ${u.iconColor}`} />
                      <h4 className="font-semibold text-xs text-slate-200">{u.title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{u.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-mono font-bold ${
                        sat.pct >= 90 ? 'text-rose-400' : sat.pct >= 75 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {sat.pct}%
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {sat.occupied}/{sat.total} Beds
                    </div>
                  </div>
                </div>

                {/* Saturation Progress Bar */}
                <div className="w-full bg-slate-800 h-1 rounded-full mb-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      sat.pct >= 90 ? 'bg-rose-500' : sat.pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${sat.pct}%` }}
                  />
                </div>

                {/* Bed Matrices */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {unitBeds.map((b) => {
                    const patient = patients.find((p) => p.assignedBedId === b.id);
                    const isDischargeReady = patient?.dischargeReady;

                    let statusBg = 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300 hover:border-emerald-500';
                    let statusDot = 'bg-emerald-400';

                    if (b.status === 'occupied') {
                      if (b.isNegativePressure && patient?.isolationRequired) {
                        statusBg = 'bg-purple-950/40 border-purple-800/50 text-purple-300 hover:border-purple-500';
                        statusDot = 'bg-purple-400';
                      } else if (isDischargeReady) {
                        statusBg = 'bg-blue-950/50 border-blue-700/60 text-blue-300 hover:border-blue-400';
                        statusDot = 'bg-blue-400 animate-pulse';
                      } else {
                        statusBg = 'bg-rose-950/40 border-rose-800/50 text-rose-300 hover:border-rose-500';
                        statusDot = 'bg-rose-400';
                      }
                    } else if (b.status === 'cleaning') {
                      statusBg = 'bg-amber-950/40 border-amber-800/50 text-amber-300 hover:border-amber-500';
                      statusDot = 'bg-amber-400 animate-pulse';
                    }

                    const isSelected = selectedBedId === b.id;

                    return (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBedId(b.id)}
                        className={`text-left p-2 rounded-lg border text-xs transition-all cursor-pointer relative ${statusBg} ${
                          isSelected ? 'ring-2 ring-emerald-400 scale-[1.02]' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-[11px] text-white tracking-tight">
                            {b.code}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
                        </div>

                        {patient ? (
                          <div className="truncate">
                            <div className="truncate font-medium text-[11px] text-slate-200">
                              {patient.name.split(' ')[0]}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <span>ESI-{patient.esi}</span>
                              {isDischargeReady && <span className="text-blue-400 font-bold">· Ready</span>}
                            </div>
                          </div>
                        ) : b.status === 'cleaning' ? (
                          <div className="text-[10px] text-amber-400 font-mono">
                            Turnaround {b.cleaningMinutesRemaining}m
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-400 font-mono">
                            Open Bay
                          </div>
                        )}

                        {b.isNegativePressure && (
                          <div className="absolute bottom-1 right-1" title="Negative Pressure Suite">
                            <Wind className="w-2.5 h-2.5 text-purple-400" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Unit Footnote */}
              <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Safe Ratio: 1:{u.key === 'ICU' ? '2' : u.key === 'ER_RESUS' ? '1' : u.key === 'ER_ACUTE' ? '3' : '5'}</span>
                {sat.pct >= 90 && <span className="text-rose-400 font-medium">Overcrowding Alert</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bed Inspection Drawer / Modal */}
      {selectedBed && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl relative text-slate-200">
            <button
              onClick={() => setSelectedBedId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Bed Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
                <BedIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base font-mono">{selectedBed.code}</h3>
                  <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {selectedBed.unitName}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>Status: <span className="text-white capitalize">{selectedBed.status}</span></span>
                  {selectedBed.isNegativePressure && (
                    <span className="text-purple-400 flex items-center gap-0.5">
                      <Wind className="w-3 h-3" /> Airborne Isolation
                    </span>
                  )}
                  {selectedBed.isTelemetryEquipped && (
                    <span className="text-cyan-400 flex items-center gap-0.5">
                      <HeartPulse className="w-3 h-3" /> Telemetry
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Patient Clinical Profile */}
            {patientInSelectedBed ? (
              <div className="mt-4 space-y-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-white text-sm">{patientInSelectedBed.name}</span>
                      <span className="text-xs text-slate-400 font-mono">
                        {patientInSelectedBed.age}y / {patientInSelectedBed.gender}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs px-2 py-0.5 font-bold rounded font-mono ${
                          patientInSelectedBed.esi === 1
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                            : patientInSelectedBed.esi === 2
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                        }`}
                      >
                        ESI Level {patientInSelectedBed.esi}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-300">
                    <span className="text-slate-500">Chief Complaint: </span>
                    <span className="font-medium text-slate-100">{patientInSelectedBed.chiefComplaint}</span>
                  </div>

                  {/* Vitals Telemetry */}
                  <div className="grid grid-cols-5 gap-2 mt-3 pt-2 border-t border-slate-900 text-center font-mono">
                    <div className="bg-slate-900/80 p-1.5 rounded">
                      <div className="text-[10px] text-slate-500">HR</div>
                      <div className="text-xs font-bold text-white">{patientInSelectedBed.vitals.hr}</div>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded">
                      <div className="text-[10px] text-slate-500">BP</div>
                      <div className="text-xs font-bold text-white">{patientInSelectedBed.vitals.bp}</div>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded">
                      <div className="text-[10px] text-slate-500">SpO2</div>
                      <div className="text-xs font-bold text-cyan-400">{patientInSelectedBed.vitals.spo2}%</div>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded">
                      <div className="text-[10px] text-slate-500">RR</div>
                      <div className="text-xs font-bold text-white">{patientInSelectedBed.vitals.rr}</div>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded">
                      <div className="text-[10px] text-slate-500">Temp</div>
                      <div className="text-xs font-bold text-white">{patientInSelectedBed.vitals.temp}°C</div>
                    </div>
                  </div>

                  {/* Clinical Notes & Disposition */}
                  <div className="mt-2.5 text-xs text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
                    <span className="font-semibold text-slate-300">Care Plan: </span>
                    <span>{patientInSelectedBed.notes}</span>
                  </div>
                </div>

                {/* Assigned Nurse */}
                {nurseForSelectedBed && (
                  <div className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-slate-400">
                      Assigned Primary RN: <span className="font-medium text-white">{nurseForSelectedBed.name}</span>
                    </div>
                    <div className="text-slate-500 font-mono">
                      Current Load: {nurseForSelectedBed.assignedBedIds.length}/{nurseForSelectedBed.maxPatientRatio}
                    </div>
                  </div>
                )}

                {/* Actionable Clinical Actions */}
                <div className="flex items-center gap-2 pt-2">
                  {patientInSelectedBed.dischargeReady ? (
                    <button
                      onClick={() => {
                        onDischargePatient(patientInSelectedBed.id);
                        setSelectedBedId(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-xs shadow transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Execute Rapid Discharge (Freed for Bed Turnaround)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onDischargePatient(patientInSelectedBed.id);
                        setSelectedBedId(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Expedite Clinical Clearance & Order Meds</span>
                    </button>
                  )}
                </div>
              </div>
            ) : selectedBed.status === 'cleaning' ? (
              <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <div className="text-amber-400 text-sm font-semibold flex items-center justify-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4" /> Environmental Cleaning in Progress
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Terminal room sterilization countdown: {selectedBed.cleaningMinutesRemaining} mins remaining.
                </p>
                <button
                  onClick={() => {
                    onAccelerateCleaning(selectedBed.id);
                    setSelectedBedId(null);
                  }}
                  className="py-1.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Prioritize Rapid EVS Turnaround (Instant Clean)
                </button>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-slate-200 font-medium">This bed is sanitized and ready for patient intake.</p>
                <p className="text-slate-500 mt-1">Available for automatic assignment via Linear Programming solver.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
