import React from 'react';
import { WeatherIcon } from './CurrentWeatherCard';
import { motion } from 'framer-motion';

const HourlyForecast = ({ forecastList, timezoneOffset, unit }) => {
  if (!forecastList || forecastList.length === 0) return null;

  // Temperature Conversions
  const formatTemp = (celsius) => {
    if (unit === 'imperial') {
      return Math.round((celsius * 9) / 5 + 32) + '°';
    }
    return celsius + '°';
  };

  // Convert hour number to 12-hour format with AM/PM
  const formatHour = (hour) => {
    const h = hour % 24;
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card rounded-3xl p-6 text-white shadow-2xl w-full"
    >
      <h3 className="text-lg font-bold mb-4 tracking-tight border-b border-white/5 pb-2 text-slate-300">
        Hourly Forecast (24h)
      </h3>

      {/* Horizontal scroll container */}
      <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar select-none">
        {forecastList.map((item, index) => (
          <div
            key={item.dt || index}
            className="flex-shrink-0 w-[95px] p-3.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl flex flex-col items-center justify-between transition-all duration-300 shadow-inner group"
          >
            {/* Time label */}
            <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors uppercase">
              {index === 0 ? 'Now' : formatHour(item.time)}
            </span>

            {/* Condition Icon */}
            <div className="my-3.5 transform group-hover:scale-110 transition-transform duration-300">
              <WeatherIcon code={item.icon} className="w-10 h-10 drop-shadow-[0_2px_8px_rgba(56,189,248,0.2)]" />
            </div>

            {/* Temperature */}
            <span className="text-lg font-extrabold text-white tracking-tighter">
              {formatTemp(item.temp)}
            </span>

            {/* Precipitation probability (POP) */}
            <div className="mt-1.5 min-h-[16px]">
              {item.pop > 0 ? (
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider">
                  {item.pop}% Rain
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Dry
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default HourlyForecast;
