import React, { useState, useEffect } from 'react';
import { History, Trash2, MapPin, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { weatherService, globalWeatherCache } from '../services/api';
import { WeatherIcon } from './CurrentWeatherCard';

const SearchHistory = ({ history, onSelectCity, onClearHistory, unit }) => {
  const [weatherMap, setWeatherMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

  // Temperature Conversions
  const formatTemp = (celsius) => {
    if (unit === 'imperial') {
      return Math.round((celsius * 9) / 5 + 32) + '°F';
    }
    return celsius + '°C';
  };

  // Convert timestamp to relative friendly time
  const formatRelativeTime = (timestamp) => {
    const diffInMs = Date.now() - new Date(timestamp).getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Fetch weather metrics for history items in parallel with cache check
  useEffect(() => {
    if (!history || history.length === 0) {
      setWeatherMap({});
      return;
    }

    let active = true;

    const fetchWeatherForHistory = async () => {
      const newWeatherMap = { ...weatherMap };

      const fetchPromises = history.map(async (item) => {
        const key = item._id;
        const cacheKey = `${item.lat.toFixed(4)},${item.lon.toFixed(4)}`;

        // Check global memory cache
        const cached = globalWeatherCache.get(cacheKey);
        if (cached) {
          newWeatherMap[key] = cached;
          return;
        }

        // Set loading state for this item
        if (active) {
          setLoadingMap(prev => ({ ...prev, [key]: true }));
        }

        try {
          const query = `${item.lat},${item.lon}`;
          const weatherData = await weatherService.getCurrentWeather(query);
          globalWeatherCache.set(cacheKey, weatherData);
          newWeatherMap[key] = weatherData;
        } catch (err) {
          console.error(`Failed to fetch weather for quick access city ${item.name}:`, err);
          newWeatherMap[key] = { error: true };
        } finally {
          if (active) {
            setLoadingMap(prev => ({ ...prev, [key]: false }));
          }
        }
      });

      await Promise.all(fetchPromises);
      if (active) {
        setWeatherMap(newWeatherMap);
      }
    };

    // Debounce live fetches by 400ms to protect API limits
    const timer = setTimeout(() => {
      fetchWeatherForHistory();
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [history]);

  if (!history || history.length === 0) {
    return null; // Keep hidden if no history
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card rounded-3xl p-6 text-white shadow-2xl space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h3 className="text-md font-bold tracking-tight text-slate-300 flex items-center gap-2">
          <History className="w-5 h-5 text-sky-400" />
          Quick Access History
        </h3>
        <button
          onClick={onClearHistory}
          className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-bold uppercase px-3 py-1.5 rounded-xl border border-rose-500/20 cursor-pointer transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear All
        </button>
      </div>

      {/* Single-Column List Wrapper */}
      <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
        {history.map((item, idx) => {
          const key = item._id;
          const weather = weatherMap[key];
          const isLoading = loadingMap[key];

          return (
            <div
              key={item._id || idx}
              onClick={() => onSelectCity(`${item.lat},${item.lon}`, item.name)}
              className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-sky-500/30 rounded-2xl cursor-pointer transition-all duration-300 group shadow-inner"
            >
              {/* Left Side: Name and Metadata */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-slate-800/60 rounded-xl group-hover:bg-sky-500/15 transition-colors">
                  <MapPin className="w-4 h-4 text-slate-400 group-hover:text-sky-400 transition-colors" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-200 group-hover:text-white transition-colors truncate">
                    {item.name}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                    <span className="uppercase">{item.country}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(item.timestamp)}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Live Weather Stats */}
              <div className="flex items-center gap-2.5 shrink-0">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4.5 w-10 bg-slate-700/40 rounded animate-pulse" />
                    <div className="h-6 w-6 bg-slate-700/40 rounded-full animate-pulse" />
                  </div>
                ) : weather && !weather.error ? (
                  <>
                    <div className="text-right">
                      <div className="text-sm font-black text-white leading-tight">
                        {formatTemp(weather.temp)}
                      </div>
                      <div className="text-[9px] font-bold text-slate-450 uppercase tracking-wide leading-none mt-0.5">
                        {weather.condition}
                      </div>
                    </div>
                    <WeatherIcon code={weather.icon} className="w-8 h-8" />
                  </>
                ) : (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-xl border border-rose-500/20">
                    Unavailable
                  </span>
                )}
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all hidden sm:block" />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SearchHistory;
