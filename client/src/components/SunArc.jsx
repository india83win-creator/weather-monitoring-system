import React from 'react';
import { Sunrise, Sunset, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

const SunArc = ({ weather }) => {
  if (!weather) return null;

  const { sunrise, sunset, timezone } = weather;
  const now = Math.floor(Date.now() / 1000);

  // Compute timezone-adjusted local time
  const formatTime = (ts) => {
    const d = new Date((ts + timezone) * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  };

  // Determine state & calculate path progress (t: 0 to 1)
  const isDay = now >= sunrise && now <= sunset;
  let progress = 0;
  let timeText = '';

  if (isDay) {
    progress = (now - sunrise) / (sunset - sunrise);
    const secsToSunset = sunset - now;
    const minsToSunset = Math.floor(secsToSunset / 60);
    const hours = Math.floor(minsToSunset / 60);
    const mins = minsToSunset % 60;
    timeText = `${hours > 0 ? `${hours}h ` : ''}${mins}m until Sunset`;
  } else {
    // Night state
    const secsToSunrise = now < sunrise ? sunrise - now : (sunrise + 24 * 3600) - now;
    const minsToSunrise = Math.floor(secsToSunrise / 60);
    const hours = Math.floor(minsToSunrise / 60);
    const mins = minsToSunrise % 60;
    timeText = `${hours > 0 ? `${hours}h ` : ''}${mins}m until Sunrise`;
    progress = 0; // Keep at 0 or hide
  }

  // Calculate coordinates for Quadratic Bezier curve: M 10 45 Q 50 10 90 45
  // P0 = [10, 45] (Sunrise)
  // P1 = [50, 8]  (Solar Noon Peak)
  // P2 = [90, 45] (Sunset)
  const getBezierPoint = (t) => {
    const x = (1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * 50 + t * t * 90;
    const y = (1 - t) * (1 - t) * 45 + 2 * (1 - t) * t * 8 + t * t * 45;
    return { x, y };
  };

  const sunPos = getBezierPoint(progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between w-full"
    >
      {/* Title */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h3 className="text-md font-bold text-slate-300 flex items-center gap-2">
          {isDay ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-300" />}
          Day/Night Tracker
        </h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {isDay ? 'Daylight' : 'Nighttime'}
        </span>
      </div>

      {/* SVG Arc Display */}
      <div className="relative mt-5 mb-2 w-full max-w-[280px] mx-auto">
        <svg viewBox="0 0 100 50" className="w-full h-auto overflow-visible">
          {/* Horizon Line */}
          <line x1="5" y1="45" x2="95" y2="45" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" strokeDasharray="2 2" />

          {/* Sun Trajectory Arc (Cubic path approximation) */}
          <path
            d="M 10 45 Q 50 8 90 45"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="2"
            strokeDasharray="4 3"
          />

          {/* Completed Daylight Arc Highlight */}
          {isDay && (
            <path
              d={`M 10 45 Q 50 8 90 45`}
              fill="none"
              stroke="url(#sunArcGradient)"
              strokeWidth="2"
              strokeDasharray="200"
              strokeDashoffset={200 - progress * 200}
              className="transition-all duration-1000"
            />
          )}

          {/* Gradients */}
          <defs>
            <linearGradient id="sunArcGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2} />
            </linearGradient>
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
              <stop offset="30%" stopColor="#f59e0b" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* Sunrise and Sunset Points */}
          <circle cx="10" cy="45" r="2.5" fill="#f59e0b" className="animate-pulse" />
          <circle cx="90" cy="45" r="2.5" fill="#ef4444" />

          {/* Dynamic Sun Node (renders only during daytime) */}
          {isDay && (
            <>
              {/* Sun Aura Glow */}
              <circle cx={sunPos.x} cy={sunPos.y} r="6" fill="url(#sunGlow)" className="animate-pulse" />
              {/* Core Sun Dot */}
              <circle cx={sunPos.x} cy={sunPos.y} r="2.5" fill="#ffffff" />
            </>
          )}

          {/* Dynamic Moon Node (renders below horizon during nighttime) */}
          {!isDay && (
            <circle cx="50" cy="48" r="2.5" fill="#cbd5e1" opacity={0.6} />
          )}
        </svg>

        {/* Sunrise/Sunset Labels */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold px-1.5 mt-1 select-none">
          <span className="flex items-center gap-1"><Sunrise className="w-3 h-3 text-amber-400" /> {formatTime(sunrise)}</span>
          <span className="flex items-center gap-1"><Sunset className="w-3 h-3 text-rose-400" /> {formatTime(sunset)}</span>
        </div>
      </div>

      {/* Countdown Text */}
      <div className="text-center mt-2.5">
        <p className="text-xs font-black text-slate-100 tracking-wide uppercase">{timeText}</p>
      </div>
    </motion.div>
  );
};

export default SunArc;
