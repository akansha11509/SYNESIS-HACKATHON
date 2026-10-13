import React, { useState, useEffect, useMemo } from 'react';
import {
  Bed,
  Patient,
  NurseStaff,
  SystemAlert,
  RegionalHospital,
  SurgeScenario,
  UserRole,
  QueueMetrics,
  LPOptimizationResult,
} from './types';
import {
  INITIAL_BEDS,
  INITIAL_PATIENTS,
  INITIAL_NURSES,
  INITIAL_ALERTS,
  REGIONAL_HOSPITALS,
  SURGE_SCENARIOS,
} from './data/initialData';
import { evaluateQueueMetrics } from './engine/queueingTheory';
import { solveHospitalLP } from './engine/lpOptimizer';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { HospitalFloorMap } from './components/HospitalFloorMap';
import { WhatIfSandbox } from './components/WhatIfSandbox';
import { QueueAndTriageView } from './components/QueueAndTriageView';
import { ExplainableOptimizerModal } from './components/ExplainableOptimizerModal';
import { AlertsDispatcherModal } from './components/AlertsDispatcherModal';
import { RegionalNetworkView } from './components/RegionalNetworkView';
import { PublicPatientView } from './components/PublicPatientView';
import { SurgeForecastChart } from './components/SurgeForecastChart';
import { ScenarioModal } from './components/ScenarioModal';
import { ShieldAlert, Zap, Flame, Info, CheckCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Primary Clinical State
  const [beds, setBeds] = useState<Bed[]>(INITIAL_BEDS);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [nurses, setNurses] = useState<NurseStaff[]>(INITIAL_NURSES);
  const [alerts, setAlerts] = useState<SystemAlert[]>(INITIAL_ALERTS);
  const [hospitals, setHospitals] = useState<RegionalHospital[]>(REGIONAL_HOSPITALS);

  // Role and Navigation
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMINISTRATOR');

  // Simulation Controls & Scenarios
  const [activeScenario, setActiveScenario] = useState<SurgeScenario>(SURGE_SCENARIOS[0]);
  const [isSurgeActive, setIsSurgeActive] = useState<boolean>(false);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [simulationSeconds, setSimulationSeconds] = useState<number>(0);

  // Sandbox modifiers
  const [scenarioLambdaMult, setScenarioLambdaMult] = useState<number>(1.0);
  const [scenarioServerDelta, setScenarioServerDelta] = useState<number>(0);

  // Optimization Applied State
  const [isOptimizationApplied, setIsOptimizationApplied] = useState<boolean>(false);
  const [isDivertActive, setIsDivertActive] = useState<boolean>(false);

  // Modals
  const [isOptimizerModalOpen, setIsOptimizerModalOpen] = useState<boolean>(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);

  // Combined arrival multiplier
  const effectiveArrivalMultiplier = useMemo(() => {
    let mult = activeScenario.arrivalMultiplier * scenarioLambdaMult;
    if (isSurgeActive) mult *= 1.6;
    return mult;
  }, [activeScenario, scenarioLambdaMult, isSurgeActive]);

  // Queued vs In-Bed Patients
  const patientsInQueue = useMemo(() => {
    return patients.filter((p) => !p.assignedBedId);
  }, [patients]);

  const availableBeds = useMemo(() => {
    return beds.filter((b) => b.status === 'available');
  }, [beds]);

  const occupiedBedsCount = useMemo(() => {
    return beds.filter((b) => b.status === 'occupied' || b.status === 'isolation').length;
  }, [beds]);

  // Linear Programming Optimization Solution
  const lpResult: LPOptimizationResult = useMemo(() => {
    return solveHospitalLP(beds, patients, nurses, effectiveArrivalMultiplier);
  }, [beds, patients, nurses, effectiveArrivalMultiplier]);

  // Overall Queueing Metrics
  const queueMetrics: QueueMetrics = useMemo(() => {
    const baseLambda = 7.5 * effectiveArrivalMultiplier;
    const baseMu = isOptimizationApplied ? 0.32 : 0.285;
    const baseC = Math.max(
      4,
      beds.filter((b) => b.unit === 'ER_ACUTE' || b.unit === 'ER_RESUS').length +
        scenarioServerDelta +
        (isOptimizationApplied ? 3 : 0)
    );
    return evaluateQueueMetrics(baseLambda, baseMu, baseC);
  }, [effectiveArrivalMultiplier, isOptimizationApplied, beds, scenarioServerDelta]);

  // Nurse safe ratio violations count
  const nurseViolationsCount = useMemo(() => {
    return nurses.filter((n) => n.assignedBedIds.length > n.maxPatientRatio).length;
  }, [nurses]);

  // Live Simulation Heartbeat
  useEffect(() => {
    if (!isSimRunning) return;

    const interval = setInterval(() => {
      setSimulationSeconds((prev) => prev + 1);

      // Decrement cleaning times
      setBeds((prevBeds) =>
        prevBeds.map((bed) => {
          if (bed.status === 'cleaning' && bed.cleaningMinutesRemaining) {
            const nextMin = bed.cleaningMinutesRemaining - 1;
            if (nextMin <= 0) {
              return { ...bed, status: 'available', cleaningMinutesRemaining: undefined };
            }
            return { ...bed, cleaningMinutesRemaining: nextMin };
          }
          return bed;
        })
      );

      // Increment wait times for patients in queue
      setPatients((prevPatients) =>
        prevPatients.map((p) => {
          if (!p.assignedBedId) {
            return { ...p, minutesInQueue: p.minutesInQueue + 1 };
          }
          return p;
        })
      );
    }, 1000 / simSpeed);

    return () => clearInterval(interval);
  }, [isSimRunning, simSpeed]);

  // Handlers
  const handleAssignBed = (patientId: string, bedId: string) => {
    setBeds((prev) =>
      prev.map((b) => (b.id === bedId ? { ...b, status: 'occupied', currentPatientId: patientId } : b))
    );
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, assignedBedId: bedId, minutesInQueue: 0 } : p))
    );
  };

  const handleDischargePatient = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient || !patient.assignedBedId) return;

    const bedId = patient.assignedBedId;

    // Remove patient from active census and put bed into cleaning
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
    setBeds((prev) =>
      prev.map((b) =>
        b.id === bedId
          ? { ...b, status: 'cleaning', currentPatientId: undefined, cleaningMinutesRemaining: 15 }
          : b
      )
    );
  };

  const handleAccelerateCleaning = (bedId: string) => {
    setBeds((prev) =>
      prev.map((b) =>
        b.id === bedId ? { ...b, status: 'available', cleaningMinutesRemaining: undefined } : b
      )
    );
  };

  const handleApplyOptimization = () => {
    setIsOptimizationApplied(true);

    // Convert 2 observation beds to acute care
    setBeds((prev) =>
      prev.map((b) => {
        if (b.id === 'b-obs-3' || b.id === 'b-obs-4') {
          return { ...b, unit: 'ER_ACUTE', unitName: 'ER Acute Surge Bay', status: 'available' };
        }
        return b;
      })
    );

    // Flex Float nurses to ER Acute
    setNurses((prev) =>
      prev.map((n) => {
        if (n.role === 'RN_FLOAT') {
          return { ...n, unit: 'ER_ACUTE', role: 'RN_ER' };
        }
        return n;
      })
    );

    // Add alert log of execution
    const newAlert: SystemAlert = {
      id: `opt-exec-${Date.now()}`,
      timestamp: '14:36',
      severity: 'info',
      title: 'LP Optimization Executed',
      message: 'Reallocated 2 CDU beds to Acute Care, flexed 2 float RNs, and triggered pharmacy rapid discharge.',
      sourceUnit: 'ER_ACUTE',
      suggestedAction: 'Monitor door-to-doctor times over the next 60 minutes.',
      isActionable: false,
      dispatched: true,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleQuickSurgeToggle = () => {
    setIsSurgeActive((prev) => !prev);
  };

  const handleDispatchAlert = (alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, dispatched: true } : a)));
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleTriggerDiversion = (hospitalId: string) => {
    setIsDivertActive(true);
    setHospitals((prev) =>
      prev.map((h) =>
        h.id === 'hosp-metro'
          ? { ...h, status: 'divert_advisory' }
          : h.id === hospitalId
          ? { ...h, status: 'accepting' }
          : h
      )
    );
    const newAlert: SystemAlert = {
      id: `div-${Date.now()}`,
      timestamp: '14:38',
      severity: 'critical',
      title: 'EMS Regional Divert Broadcast',
      message: 'Level-2 Ambulance advisory broadcast to dispatchers. Non-critical transports redirected.',
      sourceUnit: 'REGIONAL',
      suggestedAction: 'Maintain Level-2 status until department census falls below 82%.',
      isActionable: false,
      dispatched: true,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleAdmitNewPatient = (newPt: Partial<Patient>) => {
    const patient: Patient = {
      id: `pt-${Date.now()}`,
      name: newPt.name || 'Anonymous Patient',
      age: newPt.age || 40,
      gender: newPt.gender || 'M',
      esi: newPt.esi || 3,
      chiefComplaint: newPt.chiefComplaint || 'Unspecified symptoms',
      vitals: newPt.vitals || { hr: 80, bp: '120/80', spo2: 98, rr: 16, temp: 37.0 },
      arrivalTime: '14:36',
      minutesInQueue: 0,
      predictedServiceTimeMin: newPt.predictedServiceTimeMin || 90,
      dischargeReady: false,
      isolationRequired: false,
      notes: newPt.notes || 'Intake completed via triage',
    };
    setPatients((prev) => [patient, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        alerts={alerts}
        onOpenAlerts={() => setIsAlertsModalOpen(true)}
        activeScenario={activeScenario}
        onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
        isSimRunning={isSimRunning}
        onToggleSim={() => setIsSimRunning(!isSimRunning)}
        simSpeed={simSpeed}
        onSetSimSpeed={setSimSpeed}
        onQuickSurgeToggle={handleQuickSurgeToggle}
        isSurgeActive={isSurgeActive}
        onOpenOptimizerModal={() => setIsOptimizerModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Pitch Callout Header for Judges & Hackathons */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <p className="text-xs text-slate-300">
              <strong className="text-white">AegisFlow Engine: </strong>
              Reduces average ED wait times by <span className="text-emerald-400 font-bold font-mono">-{lpResult.percentageImprovement}%</span>, eliminates ICU boarding deadlocks, and recovers <span className="text-emerald-400 font-bold font-mono">${(lpResult.costAvoidanceDollars / 1000).toFixed(1)}k/shift</span> in averted penalties via real-time $M/M/c$ queueing and Linear Programming.
            </p>
          </div>
          {isOptimizationApplied && (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800 shrink-0 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Optimization Plan Active
            </span>
          )}
        </div>

        {/* High-Impact Metric Telemetry Cards */}
        <MetricCards
          queueMetrics={queueMetrics}
          lpResult={lpResult}
          totalBeds={beds.length}
          occupiedBeds={occupiedBedsCount}
          nurseRatioViolations={nurseViolationsCount}
          onOpenOptimizer={() => setIsOptimizerModalOpen(true)}
        />

        {/* ROLE 1: Hospital Administrator View */}
        {currentRole === 'ADMINISTRATOR' && (
          <div className="space-y-5">
            {/* Real-Time "What-If" Sandbox */}
            <WhatIfSandbox
              currentLambda={7.5 * effectiveArrivalMultiplier}
              currentMu={isOptimizationApplied ? 0.32 : 0.285}
              currentServers={beds.filter((b) => b.unit === 'ER_ACUTE').length}
              onApplyScenarioParams={(lambdaMult, serverDelta) => {
                setScenarioLambdaMult(lambdaMult);
                setScenarioServerDelta(serverDelta);
              }}
              onOpenOptimizer={() => setIsOptimizerModalOpen(true)}
            />

            {/* Spatial Hospital Floor Map & Unit Saturation */}
            <HospitalFloorMap
              beds={beds}
              patients={patients}
              nurses={nurses}
              onDischargePatient={handleDischargePatient}
              onAccelerateCleaning={handleAccelerateCleaning}
            />

            {/* Time-Series Predictive Surge Forecaster */}
            <SurgeForecastChart surgeMultiplier={effectiveArrivalMultiplier} />

            {/* Regional Health Network & Ambulance Diversion */}
            <RegionalNetworkView
              hospitals={hospitals}
              onTriggerDiversion={handleTriggerDiversion}
              isDivertActive={isDivertActive}
            />
          </div>
        )}

        {/* ROLE 2: ER Triage Charge Nurse View */}
        {currentRole === 'TRIAGE_NURSE' && (
          <div className="space-y-5">
            {/* Priority Queue (ESI 1-5) and Bed Recommender */}
            <QueueAndTriageView
              patientsInQueue={patientsInQueue}
              availableBeds={availableBeds}
              baseWaitMinutes={queueMetrics.avgWaitTimeMinutesWq}
              isOverloaded={queueMetrics.isSystemOverloaded}
              onAssignBed={handleAssignBed}
              onAdmitNewPatient={handleAdmitNewPatient}
            />

            {/* Spatial Bed Map for quick bed tracking */}
            <HospitalFloorMap
              beds={beds}
              patients={patients}
              nurses={nurses}
              onDischargePatient={handleDischargePatient}
              onAccelerateCleaning={handleAccelerateCleaning}
            />
          </div>
        )}

        {/* ROLE 3: Public / Patient Transparency View */}
        {currentRole === 'PUBLIC_VIEW' && (
          <PublicPatientView
            baseWaitMinutes={queueMetrics.avgWaitTimeMinutesWq}
            partnerHospitals={hospitals.filter((h) => h.id !== 'hosp-metro')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            AegisFlow · Clinical Operations & Queueing Optimization System
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>M/M/c Erlang-C Engine</span>
            <span>·</span>
            <span>Primal-Dual LP Solver</span>
            <span>·</span>
            <span>Cobham Priority Triage</span>
          </div>
        </div>
      </footer>

      {/* Explainable Optimizer Modal */}
      <ExplainableOptimizerModal
        isOpen={isOptimizerModalOpen}
        onClose={() => setIsOptimizerModalOpen(false)}
        lpResult={lpResult}
        onApplyOptimization={handleApplyOptimization}
        isApplied={isOptimizationApplied}
      />

      {/* Automated Actionable Alerts Modal */}
      <AlertsDispatcherModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={alerts}
        onDispatchAlert={handleDispatchAlert}
        onDismissAlert={handleDismissAlert}
      />

      {/* Scenario Selector Modal */}
      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        activeScenarioId={activeScenario.id}
        onSelectScenario={(sc) => {
          setActiveScenario(sc);
          setIsOptimizationApplied(false);
        }}
      />
    </div>
  );
}
