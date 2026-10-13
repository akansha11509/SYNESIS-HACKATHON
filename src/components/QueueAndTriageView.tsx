import React, { useState } from 'react';
import { Patient, Bed, ESILevel } from '../types';
import { calculateAcuityWaitTime } from '../engine/queueingTheory';
import { Users, Clock, AlertTriangle, ArrowRight, Bed as BedIcon, Plus, UserPlus, HeartPulse, Sparkles } from 'lucide-react';

interface QueueAndTriageViewProps {
  patientsInQueue: Patient[];
  availableBeds: Bed[];
  baseWaitMinutes: number;
  isOverloaded: boolean;
  onAssignBed: (patientId: string, bedId: string) => void;
  onAdmitNewPatient: (patient: Partial<Patient>) => void;
}

export const QueueAndTriageView: React.FC<QueueAndTriageViewProps> = ({
  patientsInQueue,
  availableBeds,
  baseWaitMinutes,
  isOverloaded,
  onAssignBed,
  onAdmitNewPatient,
}) => {
  const [filterEsi, setFilterEsi] = useState<number | 'ALL'>('ALL');
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  // New patient intake state
  const [newName, setNewName] = useState('');
  const [newEsi, setNewEsi] = useState<ESILevel>(3);
  const [newComplaint, setNewComplaint] = useState('');
  const [newAge, setNewAge] = useState(45);

  const filteredPatients = patientsInQueue
    .filter((p) => filterEsi === 'ALL' || p.esi === filterEsi)
    .sort((a, b) => {
      // Sort primarily by ESI (1 first), then by queue dwell time (descending)
      if (a.esi !== b.esi) return a.esi - b.esi;
      return b.minutesInQueue - a.minutesInQueue;
    });

  // Recommend best bed for patient based on ESI
  const getRecommendedBed = (patient: Patient): Bed | undefined => {
    if (patient.esi === 1) {
      return availableBeds.find((b) => b.unit === 'ER_RESUS') || availableBeds.find((b) => b.unit === 'ER_ACUTE');
    }
    if (patient.esi === 2) {
      if (patient.isolationRequired) {
        return availableBeds.find((b) => b.isNegativePressure) || availableBeds.find((b) => b.unit === 'ER_ACUTE');
      }
      return availableBeds.find((b) => b.unit === 'ER_ACUTE') || availableBeds.find((b) => b.unit === 'ICU');
    }
    if (patient.esi === 4 || patient.esi === 5) {
      return availableBeds.find((b) => b.unit === 'FAST_TRACK') || availableBeds.find((b) => b.unit === 'OBSERVATION');
    }
    return availableBeds.find((b) => b.unit === 'ER_ACUTE') || availableBeds.find((b) => b.unit === 'OBSERVATION') || availableBeds[0];
  };

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newComplaint) return;

    onAdmitNewPatient({
      name: newName,
      age: Number(newAge),
      esi: newEsi,
      chiefComplaint: newComplaint,
      gender: 'M',
      arrivalTime: '14:35',
      minutesInQueue: 0,
      predictedServiceTimeMin: newEsi <= 2 ? 150 : 60,
      dischargeReady: false,
      isolationRequired: false,
      vitals: { hr: 88, bp: '120/80', spo2: 98, rr: 16, temp: 37.0 },
      notes: 'Triage intake completed. Awaiting bed placement.',
    });

    setNewName('');
    setNewComplaint('');
    setIsNewPatientModalOpen(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-100 text-sm">
              Real-Time Triage & Acuity Priority Queue (ESI 1–5)
            </h3>
            <span className="text-xs font-mono text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
              {patientsInQueue.length} Waiting
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cobham non-preemptive priority queueing model. Estimated wait times (EWT) updated dynamically by acuity rank.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewPatientModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Intake Walk-In</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by ESI */}
      <div className="flex items-center gap-1.5 py-3 border-b border-slate-800/80 overflow-x-auto text-xs">
        <span className="text-slate-400 font-medium">Filter Acuity:</span>
        <button
          onClick={() => setFilterEsi('ALL')}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            filterEsi === 'ALL' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({patientsInQueue.length})
        </button>
        <button
          onClick={() => setFilterEsi(1)}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            filterEsi === 1 ? 'bg-rose-950 text-rose-300 font-medium border border-rose-800' : 'text-slate-400 hover:text-rose-300'
          }`}
        >
          ESI 1 Resuscitation ({patientsInQueue.filter((p) => p.esi === 1).length})
        </button>
        <button
          onClick={() => setFilterEsi(2)}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            filterEsi === 2 ? 'bg-amber-950 text-amber-300 font-medium border border-amber-800' : 'text-slate-400 hover:text-amber-300'
          }`}
        >
          ESI 2 Emergent ({patientsInQueue.filter((p) => p.esi === 2).length})
        </button>
        <button
          onClick={() => setFilterEsi(3)}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            filterEsi === 3 ? 'bg-yellow-950 text-yellow-300 font-medium border border-yellow-800' : 'text-slate-400 hover:text-yellow-300'
          }`}
        >
          ESI 3 Urgent ({patientsInQueue.filter((p) => p.esi === 3).length})
        </button>
        <button
          onClick={() => setFilterEsi(4)}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            filterEsi === 4 ? 'bg-blue-950 text-blue-300 font-medium border border-blue-800' : 'text-slate-400 hover:text-blue-300'
          }`}
        >
          ESI 4/5 Fast Track ({patientsInQueue.filter((p) => p.esi >= 4).length})
        </button>
      </div>

      {/* Patients Queue List */}
      <div className="mt-3 space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No patients currently queued matching this filter.
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const ewtMinutes = calculateAcuityWaitTime(baseWaitMinutes, patient.esi, isOverloaded);
            const recommendedBed = getRecommendedBed(patient);

            return (
              <div
                key={patient.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3 text-xs transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {/* Left: Patient Acuity & Identification */}
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-xs shrink-0 ${
                        patient.esi === 1
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/60 animate-pulse'
                          : patient.esi === 2
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                          : patient.esi === 3
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      }`}
                    >
                      ESI {patient.esi}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{patient.name}</span>
                        <span className="text-slate-400 font-mono">
                          {patient.age}y · {patient.gender}
                        </span>
                        <span className="text-slate-500 font-mono">Arrived {patient.arrivalTime}</span>
                      </div>
                      <div className="text-slate-300 mt-0.5 font-medium">
                        {patient.chiefComplaint}
                      </div>
                    </div>
                  </div>

                  {/* Right: Estimated Wait Time & Vitals */}
                  <div className="flex items-center gap-3 self-end sm:self-center font-mono">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">Wait Dwell</div>
                      <div className="font-bold text-slate-200">{patient.minutesInQueue}m</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">Est. Remaining (EWT)</div>
                      <div className={`font-bold ${patient.esi <= 2 ? 'text-amber-400' : 'text-slate-200'}`}>
                        {ewtMinutes === 0 ? 'Immediate' : `~${ewtMinutes}m`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vitals Ribbon */}
                <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-3 font-mono">
                    <span>HR: <strong className={patient.vitals.hr > 110 ? 'text-rose-400' : 'text-slate-200'}>{patient.vitals.hr}</strong></span>
                    <span>BP: <strong className="text-slate-200">{patient.vitals.bp}</strong></span>
                    <span>SpO2: <strong className={patient.vitals.spo2 < 94 ? 'text-rose-400' : 'text-cyan-400'}>{patient.vitals.spo2}%</strong></span>
                    <span>RR: <strong className="text-slate-200">{patient.vitals.rr}</strong></span>
                    <span>Temp: <strong className="text-slate-200">{patient.vitals.temp}°C</strong></span>
                  </div>

                  {/* Bed Recommendation Action */}
                  <div className="flex items-center gap-2">
                    {recommendedBed ? (
                      <button
                        onClick={() => onAssignBed(patient.id, recommendedBed.id)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs shadow-sm cursor-pointer"
                      >
                        <BedIcon className="w-3.5 h-3.5" />
                        <span>Assign {recommendedBed.code} ({recommendedBed.unitName})</span>
                      </button>
                    ) : (
                      <span className="text-rose-400 font-mono text-[11px] flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> All suitable bays occupied
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Patient Intake Modal */}
      {isNewPatientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 text-slate-200 shadow-2xl">
            <h4 className="font-bold text-white text-base mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Admit Inbound Patient to Triage</span>
            </h4>

            <form onSubmit={handleCreatePatient} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jonathan Morales"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="105"
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">ESI Acuity Level</label>
                  <select
                    value={newEsi}
                    onChange={(e) => setNewEsi(Number(e.target.value) as ESILevel)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  >
                    <option value={1}>ESI 1 - Resuscitation</option>
                    <option value={2}>ESI 2 - Emergent</option>
                    <option value={3}>ESI 3 - Urgent</option>
                    <option value={4}>ESI 4 - Less Urgent</option>
                    <option value={5}>ESI 5 - Non-Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Chief Complaint & Presentation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sudden severe abdominal pain with rigidity"
                  value={newComplaint}
                  onChange={(e) => setNewComplaint(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewPatientModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow"
                >
                  Confirm Intake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
