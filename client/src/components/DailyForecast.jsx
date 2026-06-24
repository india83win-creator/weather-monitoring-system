import React from 'react';
import { WeatherIcon } from './CurrentWeatherCard';
import { motion } from 'framer-motion';

const DailyForecast = ({ dailyList, unit }) => {
  if (!dailyList || dailyList.length === 0) return null;

  // Temperature Conversions
  const formatTemp = (celsius) => {
    if (unit === 'imperial') {
      return Math.round((celsius * 9) / 5 + 32) + '°F';
    }
    return Math.round(celsius) + '°C';
  };

  // Convert date string YYYY-MM-DD to Day Name & Date Label
  const formatDateInfo = (dateStr) => {
    const dateObj = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    
    if (dateStr === today) {
      return { day: 'Today', date: dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }) };
    }

    const dayName = dateObj.toLocaleDateString([], { weekday: 'short' });
    const dateLabel = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return { day: dayName, date: dateLabel };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card rounded-3xl p-6 text-white shadow-2xl w-full"
    >
      <h3 className="text-lg font-bold mb-4 tracking-tight border-b border-white/5 pb-2 text-slate-300">
        5-Day Forecast
      </h3>

      {/* Horizontal scroll cards */}
      <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar select-none">
        {dailyList.map((item, index) => {
          const { day, date } = formatDateInfo(item.date);
          return (
            <div
              key={item.date || index}
              className="flex-shrink-0 w-40 p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl flex flex-col items-center justify-between transition-all duration-300 shadow-inner group"
            >
              {/* Day/Date */}
              <div className="text-center">
                <div className="text-sm font-extrabold text-slate-100 group-hover:text-sky-300 transition-colors uppercase tracking-tight">
                  {day}
                </div>
                <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {date}
                </div>
              </div>

              {/* Icon */}
              <div className="my-4 transform group-hover:scale-110 transition-transform duration-300">
                <WeatherIcon code={item.icon} className="w-12 h-12 drop-shadow-[0_4px_10px_rgba(56,189,248,0.25)]" />
              </div>

              {/* Condition text */}
              <div className="text-xs text-slate-300 font-semibold tracking-tight text-center truncate w-full mb-3">
                {item.condition}
              </div>

              {/* Min/Max Temperature */}
              <div className="w-full bg-black/25 px-2.5 py-1.5 rounded-xl text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Low:</span>
                  <span className="text-slate-200 font-bold">{formatTemp(item.tempMin)}</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-0.5 mt-0.5">
                  <span className="text-slate-400">High:</span>
                  <span className="text-sky-300 font-bold">{formatTemp(item.tempMax)}</span>
                </div>
              </div>

              {/* POP probability of precipitation */}
              {item.pop > 0 && (
                <div className="mt-2 text-[9px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {item.pop}% Rain
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DailyForecast;
