import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const TempChart = ({ hourlyData, unit }) => {
  if (!hourlyData || hourlyData.length === 0) return null;

  // Format temperature based on selected unit
  const formatTemp = (celsius) => {
    if (unit === 'imperial') {
      return Math.round((celsius * 9) / 5 + 32);
    }
    return celsius;
  };

  // Convert hour number to 12h format
  const formatHour = (hour) => {
    const h = hour % 24;
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  // Map data to chart format
  const data = hourlyData.map((item, idx) => ({
    timeLabel: idx === 0 ? 'Now' : formatHour(item.time),
    temperature: formatTemp(item.temp),
    precipitation: item.pop
  }));

  // Custom tooltips to maintain glassmorphism design language
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/90 border border-slate-700/60 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">{payload[0].payload.timeLabel}</p>
          <p className="text-sm font-black text-white mt-1">
            Temp: {payload[0].value}°{unit === 'imperial' ? 'F' : 'C'}
          </p>
          {payload[0].payload.precipitation > 0 && (
            <p className="text-[10px] font-bold text-sky-400 mt-0.5">
              Rain Chance: {payload[0].payload.precipitation}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Dynamically calculate min/max of dataset to keep line centered
  const temps = data.map(d => d.temperature);
  const minTemp = Math.min(...temps) - 2;
  const maxTemp = Math.max(...temps) + 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="glass-card rounded-3xl p-6 text-white shadow-2xl space-y-4 w-full"
    >
      {/* Title */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h3 className="text-md font-bold text-slate-300 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-sky-400" />
          Temperature Trend (24h)
        </h3>
        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" /> 3h Intervals
        </span>
      </div>

      {/* Chart container */}
      <div className="w-full h-48 sm:h-56 pr-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
            {/* Linear gradients for chart fills */}
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="rgba(255, 255, 255, 0.05)" 
            />

            <XAxis 
              dataKey="timeLabel" 
              stroke="rgba(255, 255, 255, 0.4)" 
              fontSize={10} 
              tickLine={false} 
              dy={10}
            />

            <YAxis 
              domain={[minTemp, maxTemp]} 
              stroke="rgba(255, 255, 255, 0.4)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area 
              type="monotone" 
              dataKey="temperature" 
              stroke="#38bdf8" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorTemp)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default TempChart;
