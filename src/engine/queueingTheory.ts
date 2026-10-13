import { QueueMetrics, ESILevel } from '../types';

/**
 * Calculates log factorial to handle large numbers safely in Erlang-C
 */
function logFactorial(n: number): number {
  if (n <= 1) return 0;
  let sum = 0;
  for (let i = 2; i <= n; i++) {
    sum += Math.log(i);
  }
  return sum;
}

/**
 * Compute Erlang-C formula: Probability that an arriving patient must wait for an available bed/server
 * M/M/c queueing model
 */
export function calculateErlangC(c: number, a: number): number {
  if (c <= 0) return 1.0;
  const rho = a / c;
  if (rho >= 1.0) return 0.999; // System saturated / unstable

  // Using logarithmic terms for stability when c is up to 100
  let sumK = 0;
  for (let k = 0; k < c; k++) {
    const logTerm = k * Math.log(a) - logFactorial(k);
    sumK += Math.exp(logTerm);
  }

  const logLastTerm = c * Math.log(a) - logFactorial(c) - Math.log(1 - rho);
  const lastTerm = Math.exp(logLastTerm);

  const erlangC = lastTerm / (sumK + lastTerm);
  return Math.min(Math.max(erlangC, 0), 0.999);
}

/**
 * Full M/M/c queueing statistics evaluation
 * @param lambda Arrival rate (patients per hour)
 * @param mu Service rate per bed (patients served per hour, e.g. 1 / 3.5h LOS = 0.285)
 * @param c Number of active servers (beds)
 */
export function evaluateQueueMetrics(lambda: number, mu: number, c: number): QueueMetrics {
  const safeC = Math.max(1, Math.round(c));
  const safeMu = Math.max(0.01, mu);
  const safeLambda = Math.max(0.1, lambda);

  const a = safeLambda / safeMu; // Offered load (Erlangs)
  const rho = a / safeC; // Server utilization

  if (rho >= 0.98) {
    // Fluid / transient overload approximation: queue is accumulating monotonically
    const deficitRatePerHour = safeLambda - safeC * safeMu;
    const estAccumulatedQueue = Math.max(8, deficitRatePerHour * 2.5);
    const estWaitTimeHours = estAccumulatedQueue / (safeC * safeMu);

    return {
      arrivalRateLambda: Number(safeLambda.toFixed(1)),
      serviceRateMu: Number(safeMu.toFixed(3)),
      serversCount: safeC,
      trafficIntensityRho: Number(rho.toFixed(2)),
      erlangCProbDelay: 0.99,
      avgQueueLengthLq: Number(estAccumulatedQueue.toFixed(1)),
      avgWaitTimeHoursWq: Number(estWaitTimeHours.toFixed(2)),
      avgWaitTimeMinutesWq: Math.round(estWaitTimeHours * 60),
      totalTimeInSystemWMin: Math.round((estWaitTimeHours + 1 / safeMu) * 60),
      isSystemOverloaded: true,
    };
  }

  // Steady-state Erlang-C regime
  const probDelay = calculateErlangC(safeC, a);
  const Lq = (probDelay * rho) / (1 - rho);
  const WqHours = Lq / safeLambda;
  const WqMinutes = WqHours * 60;
  const WHours = WqHours + 1 / safeMu;

  return {
    arrivalRateLambda: Number(safeLambda.toFixed(1)),
    serviceRateMu: Number(safeMu.toFixed(3)),
    serversCount: safeC,
    trafficIntensityRho: Number(rho.toFixed(2)),
    erlangCProbDelay: Number(probDelay.toFixed(3)),
    avgQueueLengthLq: Number(Lq.toFixed(1)),
    avgWaitTimeHoursWq: Number(WqHours.toFixed(2)),
    avgWaitTimeMinutesWq: Math.max(2, Math.round(WqMinutes)),
    totalTimeInSystemWMin: Math.round(WHours * 60),
    isSystemOverloaded: false,
  };
}

/**
 * Cobham's Non-Preemptive Acuity Priority Waiting Time Model
 * Calculates estimated wait time for ESI 1-5 triage levels
 */
export function calculateAcuityWaitTime(
  baseWaitMinutes: number,
  esi: ESILevel,
  systemOverloaded: boolean
): number {
  switch (esi) {
    case 1:
      // Resuscitation (immediate bed allocation, 0-2 mins maximum)
      return 0;
    case 2:
      // Emergent (Chest pain, acute stroke, severe sepsis - priority expedited)
      return Math.round(Math.min(baseWaitMinutes * 0.15, 12));
    case 3:
      // Urgent (Moderate respiratory distress, abdominal pain)
      return Math.round(baseWaitMinutes * (systemOverloaded ? 0.85 : 0.75));
    case 4:
      // Less urgent (simple fractures, minor lacerations, low acuity)
      return Math.round(baseWaitMinutes * (systemOverloaded ? 1.6 : 1.35));
    case 5:
      // Non-urgent (suture removal, medication refill)
      return Math.round(baseWaitMinutes * (systemOverloaded ? 2.4 : 1.8));
    default:
      return baseWaitMinutes;
  }
}
