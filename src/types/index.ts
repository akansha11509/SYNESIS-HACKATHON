export type ESILevel = 1 | 2 | 3 | 4 | 5;

export type UnitType = 'ER_RESUS' | 'ER_ACUTE' | 'FAST_TRACK' | 'ICU' | 'STEP_DOWN' | 'MED_SURG' | 'OBSERVATION';

export type BedStatus = 'available' | 'occupied' | 'cleaning' | 'reserved' | 'isolation';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  esi: ESILevel; // 1: Resuscitation, 2: Emergent, 3: Urgent, 4: Less Urgent, 5: Non-Urgent
  chiefComplaint: string;
  vitals: {
    hr: number;
    bp: string;
    spo2: number;
    rr: number;
    temp: number;
  };
  arrivalTime: string;
  minutesInQueue: number;
  predictedServiceTimeMin: number;
  assignedBedId?: string;
  currentUnit?: UnitType;
  dischargeReady: boolean;
  isolationRequired: boolean;
  notes: string;
}

export interface Bed {
  id: string;
  code: string;
  unit: UnitType;
  unitName: string;
  status: BedStatus;
  currentPatientId?: string;
  nurseAssignedId?: string;
  isNegativePressure: boolean;
  isTelemetryEquipped: boolean;
  cleaningMinutesRemaining?: number;
}

export interface NurseStaff {
  id: string;
  name: string;
  role: 'RN_CHARGE' | 'RN_ICU' | 'RN_ER' | 'RN_MEDSURG' | 'RN_FLOAT';
  unit: UnitType;
  assignedBedIds: string[];
  maxPatientRatio: number;
  overtimeHours: number;
  status: 'active' | 'break' | 'called_out';
}

export interface QueueMetrics {
  arrivalRateLambda: number; // arrivals per hour
  serviceRateMu: number; // patients served per bed per hour
  serversCount: number; // active beds
  trafficIntensityRho: number; // lambda / (c * mu)
  erlangCProbDelay: number; // P(Wait > 0)
  avgQueueLengthLq: number; // Lq
  avgWaitTimeHoursWq: number; // Wq in hours
  avgWaitTimeMinutesWq: number; // Wq in minutes
  totalTimeInSystemWMin: number; // W in minutes
  isSystemOverloaded: boolean;
}

export interface LPDecisionVariable {
  actionType: 'REALLOCATE_BED' | 'FLEX_NURSE' | 'FAST_TRACK_DISCHARGE' | 'REGIONAL_DIVERT' | 'EXPAND_OBSERVATION';
  sourceUnit?: UnitType;
  targetUnit?: UnitType;
  quantity: number;
  clinicalRationale: string;
  mathShadowPrice: string; // dual value impact (e.g. "-14.2 min wait / unit")
  estimatedWaitReductionMinutes: number;
  costImpactDollars: number;
  confidenceScore: number;
}

export interface LPOptimizationResult {
  objectiveValueBaseline: number;
  objectiveValueOptimized: number;
  percentageImprovement: number;
  averageWaitBeforeMin: number;
  averageWaitAfterMin: number;
  icuBottleneckResolved: boolean;
  overtimeCostEstimate: number;
  costAvoidanceDollars: number;
  decisions: LPDecisionVariable[];
  mathematicalFormulation: {
    objective: string;
    keyConstraints: string[];
    dualVariables: { name: string; shadowPrice: string; interpretation: string }[];
  };
}

export interface RegionalHospital {
  id: string;
  name: string;
  distanceMiles: number;
  driveTimeMinutes: number;
  erWaitTimeMinutes: number;
  occupancyPercent: number;
  icuAvailableBeds: number;
  totalBeds: number;
  traumaLevel: 'Level I' | 'Level II' | 'Level III' | 'Community';
  status: 'accepting' | 'divert_advisory' | 'full_divert';
}

export interface SystemAlert {
  id: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  sourceUnit: UnitType | 'REGIONAL';
  suggestedAction: string;
  isActionable: boolean;
  dispatched: boolean;
}

export type UserRole = 'ADMINISTRATOR' | 'TRIAGE_NURSE' | 'PUBLIC_VIEW';

export interface SurgeScenario {
  id: string;
  name: string;
  description: string;
  arrivalMultiplier: number;
  acuitySkew: 'high_acuity' | 'balanced' | 'low_acuity';
  staffReduction: number;
  dischargeLagPercent: number;
  badge: string;
}
