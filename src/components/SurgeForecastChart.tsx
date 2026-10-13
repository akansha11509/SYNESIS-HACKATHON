import React, { useState } from 'react';
import { generateSurgeForecast, SurgeForecastSummary } from '../engine/surgeForecaster';
import { TrendingUp, CloudRain, Snowflake, Sun, ThermometerSnowflake, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SurgeForecastChartProps {
  currentHour?: number;
  surgeMultiplier: number;
}

export const SurgeForecastChart: React.FC<SurgeForecastChartProps> = ({
  currentHour = 14,
  surgeMultiplier = 1.0,
}) => {
  const [weather, setWeather] = useState<'clear' | 'blizzard' | 'heatwave' | 'rain'>('clear');
  const [respiratory, setRespiratory] = useState<'low' | 'moderate' | 'epidemic_wave'>('moderate');

  const forecast: SurgeForecastSummary = generateSurgeForecast(currentHour, weather, respiratory, surgeMultiplier);

  // SVG Chart Dimensions
  const chartHeight = 160;
  const chartWidth = 720;
  const maxVal = Math.max(22, forecast.peakArrivalVolume * 1.15);

  const getX = (index: number) => (index / (forecast.hourlyData.length - 1)) * (chartWidth - 40) + 20;
  const getY = (val: number) => chartHeight - (val / maxVal) * (chartHeight - 30) - 15;

  // Generate SVG path for forecast
  const forecastPoints = forecast.hourlyData.map((d, i) => `${getX(i)},${getY(d.forecastArrivals)}`).join(' ');
  const baselinePoints = forecast.hourlyData.map((d, i) => `${getX(i)},${getY(d.baselineArrivals)}`).join(' ');

  // Confidence area path
  const upperPoints = forecast.hourlyData.map((d, i) => `${getX(i)},${getY(d.confidenceUpper)}`).join(' ');
  const lowerPoints = forecast.hourlyData
    .slice()
    .reverse()
    .map((d, i) => `${getX(forecast.hourlyData.length - 1 - i)},${getY(d.confidenceLower)}`)
    .join(' ');
  const confidenceArea = `${upperPoints} ${lowerPoints}`;

  const capacityY = getY(12.0); // Capacity limit at 12/hr

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">
              Machine Learning Predictive Surge & Bottleneck Forecaster
            </h3>
            <p className="text-xs text-slate-400">
              24-hour time-series arrival model with diurnal hospital curves, weather covariates, and respiratory illness waves.
            </p>
          </div>
        </div>

        {/* Forecast Highlights */}
        <div className="flex items-center gap-3 font-mono text-xs self-start sm:self-auto">
          <div className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-500">Projected Peak: </span>
            <span className="text-amber-400 font-bold">{forecast.peakHourLabel}</span>
            <span className="text-slate-400"> ({forecast.peakArrivalVolume.toFixed(1)}/hr)</span>
          </div>
        </div>
      </div>

      {/* Covariates Modifiers Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Weather Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium">Weather Condition:</span>
          <button
            onClick={() => setWeather('clear')}
            className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors ${
              weather === 'clear' ? 'bg-slate-800 text-white font-medium border border-slate-700' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3 h-3 text-amber-400" />
            <span>Fair</span>
          </button>
          <button
            onClick={() => setWeather('blizzard')}
            className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors ${
              weather === 'blizzard' ? 'bg-cyan-950 text-cyan-300 font-medium border border-cyan-800' : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Snowflake className="w-3 h-3 text-cyan-400" />
            <span>Ice Storm (+35%)</span>
          </button>
          <button
            onClick={() => setWeather('rain')}
            className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors ${
              weather === 'rain' ? 'bg-blue-950 text-blue-300 font-medium border border-blue-800' : 'text-slate-400 hover:text-blue-300'
            }`}
          >
            <CloudRain className="w-3 h-3 text-blue-400" />
            <span>Heavy Rain (+12%)</span>
          </button>
        </div>

        {/* Respiratory Index Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium">Viral Transmission:</span>
          <button
            onClick={() => setRespiratory('moderate')}
            className={`px-2 py-1 rounded cursor-pointer transition-colors ${
              respiratory === 'moderate' ? 'bg-slate-800 text-white font-medium border border-slate-700' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Seasonal Flu (+15%)
          </button>
          <button
            onClick={() => setRespiratory('epidemic_wave')}
            className={`px-2 py-1 rounded cursor-pointer transition-colors ${
              respiratory === 'epidemic_wave' ? 'bg-rose-950 text-rose-300 font-medium border border-rose-800' : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            Epidemic Wave (+45%)
          </button>
        </div>
      </div>

      {/* SVG Time-Series Chart */}
      <div className="mt-4 bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-x-auto">
        <div className="min-w-[650px]">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
            {/* Grid Lines */}
            <line x1="20" y1={capacityY} x2={chartWidth - 20} y2={capacityY} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth="1.5" />
            <text x={chartWidth - 18} y={capacityY + 4} fill="#f43f5e" fontSize="10" fontFamily="monospace" textAnchor="end">
              Capacity Limit (12.0/hr)
            </text>

            {/* Confidence Area */}
            <polygon points={confidenceArea} fill="rgba(6, 182, 212, 0.12)" />

            {/* Baseline Path */}
            <polyline fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" points={baselinePoints} />

            {/* Forecast Path */}
            <polyline fill="none" stroke="#06b6d4" strokeWidth="2.5" points={forecastPoints} />

            {/* Data Points */}
            {forecast.hourlyData.map((d, i) => {
              const cx = getX(i);
              const cy = getY(d.forecastArrivals);
              const isBreach = d.forecastArrivals > d.capacityLimit;

              return (
                <g key={i}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isBreach ? '4' : '2.5'}
                    fill={isBreach ? '#f43f5e' : '#06b6d4'}
                    stroke="#020617"
                    strokeWidth="1.5"
                  />
                  {i % 3 === 0 && (
                    <text x={cx} y={chartHeight - 2} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                      {d.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t border-slate-900 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-500 border-t border-dashed border-slate-400"></span>
              <span>Historical Baseline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400"></span>
              <span>24h Forecast Curve</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-cyan-950/60 border border-cyan-800"></span>
              <span>95% Confidence Band</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500"></span>
              <span>Physical Capacity Ceiling</span>
            </div>
          </div>

          <div className="font-mono text-[11px] text-slate-400">
            {forecast.durationAboveCapacityHours > 0 ? (
              <span className="text-rose-400 font-medium">
                ⚠️ {forecast.durationAboveCapacityHours} hrs forecasted above capacity threshold
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">
                ✓ System within operational limits for next 24h
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
