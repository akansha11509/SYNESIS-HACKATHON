export interface ForecastHourData {
  hour: number;
  label: string;
  baselineArrivals: number;
  forecastArrivals: number;
  confidenceLower: number;
  confidenceUpper: number;
  capacityLimit: number;
  riskLevel: 'normal' | 'elevated' | 'critical';
  projectedOccupancyPercent: number;
}

export interface SurgeForecastSummary {
  peakHourLabel: string;
  peakArrivalVolume: number;
  criticalBreachStartTime?: string;
  durationAboveCapacityHours: number;
  projectedBottleneckUnit: string;
  weatherFactorText: string;
  respiratoryIndexText: string;
  hourlyData: ForecastHourData[];
}

/**
 * Generates 24-hour predictive surge forecast based on diurnal rhythms,
 * weather events, and disease index multipliers.
 */
export function generateSurgeForecast(
  currentHour: number = 14,
  weatherCondition: 'clear' | 'blizzard' | 'heatwave' | 'rain' = 'clear',
  respiratoryIndex: 'low' | 'moderate' | 'epidemic_wave' = 'moderate',
  surgeMultiplier: number = 1.0
): SurgeForecastSummary {
  // Baseline diurnal hospital arrival pattern normalized to 24 hours
  // Peaks around 11:00 - 15:00 and 19:00 - 21:00
  const diurnalCurve = [
    3.2, 2.5, 2.1, 1.8, 2.0, 2.9, 4.8, 6.5, 8.4, 9.8, 11.2, 12.5,
    13.1, 12.8, 12.2, 11.5, 10.9, 11.4, 12.0, 11.2, 9.8, 7.5, 5.4, 4.0,
  ];

  let weatherMultiplier = 1.0;
  let weatherFactorText = 'Normal weather (baseline road & incident conditions)';
  if (weatherCondition === 'blizzard') {
    weatherMultiplier = 1.35;
    weatherFactorText = 'Winter Ice & Storm: +35% slip/fall traumas & hypothermia cases';
  } else if (weatherCondition === 'heatwave') {
    weatherMultiplier = 1.25;
    weatherFactorText = 'Excessive Heat Advisory: +25% dehydration & cardiovascular distress';
  } else if (weatherCondition === 'rain') {
    weatherMultiplier = 1.12;
    weatherFactorText = 'Heavy Precipitation: +12% motor vehicle collisions';
  }

  let viralMultiplier = 1.0;
  let respiratoryIndexText = 'Low endemic respiratory transmission';
  if (respiratoryIndex === 'moderate') {
    viralMultiplier = 1.15;
    respiratoryIndexText = 'Seasonal Influenza/RSV active: +15% pediatric & geriatric respiratory admissions';
  } else if (respiratoryIndex === 'epidemic_wave') {
    viralMultiplier = 1.45;
    respiratoryIndexText = 'Severe Epidemic Wave (Flu A + COVID-19): +45% high-acuity respiratory arrivals';
  }

  const effectiveMultiplier = weatherMultiplier * viralMultiplier * surgeMultiplier;
  const capacityLimit = 12.0; // Department processing capacity per hour

  const hourlyData: ForecastHourData[] = [];
  let peakVolume = 0;
  let peakHour = 12;
  let breachCount = 0;
  let firstBreachHour: number | undefined;

  for (let i = 0; i < 24; i++) {
    const hour24 = (currentHour + i) % 24;
    const baseVal = diurnalCurve[hour24];
    const forecastVal = Number((baseVal * effectiveMultiplier).toFixed(1));
    const spread = forecastVal * 0.12;
    const lower = Number(Math.max(1, forecastVal - spread).toFixed(1));
    const upper = Number((forecastVal + spread).toFixed(1));

    const occupancyPct = Math.min(100, Math.round((forecastVal / capacityLimit) * 85));

    let riskLevel: 'normal' | 'elevated' | 'critical' = 'normal';
    if (forecastVal > capacityLimit) {
      riskLevel = 'critical';
      breachCount++;
      if (firstBreachHour === undefined) {
        firstBreachHour = hour24;
      }
    } else if (forecastVal > capacityLimit * 0.85) {
      riskLevel = 'elevated';
    }

    if (forecastVal > peakVolume) {
      peakVolume = forecastVal;
      peakHour = hour24;
    }

    const hourLabel = `${hour24.toString().padStart(2, '0')}:00`;

    hourlyData.push({
      hour: hour24,
      label: hourLabel,
      baselineArrivals: Number(baseVal.toFixed(1)),
      forecastArrivals: forecastVal,
      confidenceLower: lower,
      confidenceUpper: upper,
      capacityLimit,
      riskLevel,
      projectedOccupancyPercent: occupancyPct,
    });
  }

  const peakHourStr = `${peakHour.toString().padStart(2, '0')}:00`;
  const breachTimeStr = firstBreachHour !== undefined ? `${firstBreachHour.toString().padStart(2, '0')}:00` : undefined;

  return {
    peakHourLabel: peakHourStr,
    peakArrivalVolume: peakVolume,
    criticalBreachStartTime: breachTimeStr,
    durationAboveCapacityHours: breachCount,
    projectedBottleneckUnit: breachCount > 3 ? 'Emergency Acute & Step-Down Boarding' : 'ER Triage Waiting Hall',
    weatherFactorText,
    respiratoryIndexText,
    hourlyData,
  };
}
