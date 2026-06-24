import React from 'react';
import { Wind, ShieldAlert, AlertCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const AirQualityCard = ({ airPollution }) => {
  // Graceful Fallback UI if API fails or rate-limits
  if (!airPollution) {
    return (
      <div className="glass-card rounded-3xl p-6 text-white shadow-2xl flex flex-col justify-between min-h-[180px] relative overflow-hidden border border-rose-500/20">
        <div className="flex items-center gap-2.5 text-slate-300 font-bold mb-2">
          <Wind className="w-5 h-5 text-rose-400" />
          Air Quality Index
        </div>
        <div className="flex flex-col items-center justify-center flex-grow py-4 space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-400/80 animate-pulse" />
          <p className="text-sm font-semibold text-slate-200">AQI Data Temporarily Offline</p>
          <p className="text-xs text-slate-400 text-center max-w-[260px]">
            Unable to fetch local air pollution metrics. Your network may be blocking connection or API limits reached.
          </p>
        </div>
      </div>
    );
  }

  const { aqi, components } = airPollution;

  // AQI Level Configurations (1: Good, 2: Fair, 3: Moderate, 4: Poor, 5: Very Poor)
  const getAqiDetails = (val) => {
    switch (val) {
      case 1:
        return {
          label: 'Good',
          description: 'Air quality is satisfactory, and air pollution poses little or no risk.',
          colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          barColor: 'bg-emerald-400',
          percent: 20
        };
      case 2:
        return {
          label: 'Fair',
          description: 'Air quality is acceptable; however, some pollutants may pose a moderate health concern.',
          colorClass: 'text-green-300 bg-green-400/10 border-green-400/30',
          barColor: 'bg-green-400',
          percent: 40
        };
      case 3:
        return {
          label: 'Moderate',
          description: 'Members of sensitive groups may experience health effects.',
          colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          barColor: 'bg-amber-400',
          percent: 60
        };
      case 4:
        return {
          label: 'Poor',
          description: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious effects.',
          colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
          barColor: 'bg-rose-400',
          percent: 80
        };
      case 5:
        return {
          label: 'Very Poor',
          description: 'Health warnings of emergency conditions. The entire population is more likely to be affected.',
          colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
          barColor: 'bg-purple-400',
          percent: 100
        };
      default:
        return {
          label: 'Unknown',
          description: 'Unable to evaluate air quality level.',
          colorClass: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
          barColor: 'bg-slate-500',
          percent: 0
        };
    }
  };

  const aqiInfo = getAqiDetails(aqi);

  // Identify primary pollutant (Ozone, PM2.5, PM10, or NO2)
  const getPrimaryPollutant = () => {
    if (!components) return 'N/A';
    // Standard AQI threshold ratios: we find the component with the highest concentration relative to its limit
    // Limits: pm2_5: 25, pm10: 50, o3: 100, no2: 200
    const ratios = {
      'PM2.5': components.pm2_5 / 25,
      'PM10': components.pm10 / 50,
      'Ozone (O₃)': components.o3 / 100,
      'Nitrogen Dioxide (NO₂)': components.no2 / 200
    };
    
    return Object.keys(ratios).reduce((a, b) => ratios[a] > ratios[b] ? a : b);
  };

  const primaryPollutant = getPrimaryPollutant();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="glass-card rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between w-full"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none" />

      {/* Card Title */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h3 className="text-md font-bold text-slate-300 flex items-center gap-2">
          <Wind className="w-5 h-5 text-emerald-400 animate-pulse" />
          Air Quality Index
        </h3>
        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border tracking-wider ${aqiInfo.colorClass}`}>
          AQI {aqi} • {aqiInfo.label}
        </span>
      </div>

      {/* Main AQI rating and bar */}
      <div className="my-4 space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>Pollution Level Gauge</span>
          <span className="font-semibold text-slate-200">{aqiInfo.label}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-950/60 rounded-full border border-white/5 overflow-hidden">
          <div 
            className={`h-full ${aqiInfo.barColor} transition-all duration-1000 ease-out`} 
            style={{ width: `${aqiInfo.percent}%` }}
          />
        </div>
        
        <p className="text-[11px] leading-relaxed text-slate-300 italic pt-1 flex items-start gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          {aqiInfo.description}
        </p>
      </div>

      {/* Pollutant components breakdown */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-xs">
        {/* PM2.5 */}
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 shadow-inner">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PM2.5 (Fine dust)</div>
          <div className="text-sm font-bold text-slate-200 mt-0.5">
            {components?.pm2_5?.toFixed(1) || '0'} <span className="text-[10px] font-normal text-slate-400">µg/m³</span>
          </div>
        </div>
        {/* PM10 */}
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 shadow-inner">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PM10 (Coarse dust)</div>
          <div className="text-sm font-bold text-slate-200 mt-0.5">
            {components?.pm10?.toFixed(1) || '0'} <span className="text-[10px] font-normal text-slate-400">µg/m³</span>
          </div>
        </div>
        {/* Ozone */}
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 shadow-inner">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ozone (O₃)</div>
          <div className="text-sm font-bold text-slate-200 mt-0.5">
            {components?.o3?.toFixed(1) || '0'} <span className="text-[10px] font-normal text-slate-400">µg/m³</span>
          </div>
        </div>
        {/* Primary Pollutant Info */}
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 shadow-inner">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Primary Pollutant</div>
          <div className="text-sm font-extrabold text-amber-400 mt-0.5 truncate">
            {primaryPollutant}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AirQualityCard;
