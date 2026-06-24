import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Columns, X, Search, MapPin, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { weatherService } from '../services/api';
import { WeatherIcon } from './CurrentWeatherCard';

const CityCompare = ({ primaryWeather, unit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [targetWeather, setTargetWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownRect, setDropdownRect] = useState(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced search for city 2 with fuzzy fallback
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        let results = await weatherService.searchCities(searchQuery);
        // Fuzzy fallback: if no results, retry with one less character
        if (results.length === 0 && searchQuery.trim().length > 2) {
          results = await weatherService.searchCities(searchQuery.trim().slice(0, -1));
        }
        setSuggestions(results);
      } catch (err) {
        console.error('Error searching target city:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update dropdown position when input is focused or query changes
  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownRect({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  // Load target weather
  const handleSelectTarget = async (city) => {
    const query = city.lat !== undefined && city.lon !== undefined 
      ? `${city.lat},${city.lon}` 
      : city.name;
    setIsLoading(true);
    setError(null);
    setSearchQuery('');
    setSuggestions([]);
    setIsSearching(false);
    try {
      const data = await weatherService.getCurrentWeather(query);
      setTargetWeather(data);
    } catch (err) {
      console.error('Error fetching target weather data:', err);
      setTargetWeather(null);
      setError('City not found. Please try another location.');
    } finally {
      setIsLoading(false);
    }
  };

  // Form submit handler for text-typing (e.g. typing and pressing Enter)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setIsSearching(false);
    try {
      const data = await weatherService.getCurrentWeather(searchQuery);
      setTargetWeather(data);
      setSearchQuery('');
    } catch (err) {
      console.error('Error fetching comparison weather:', err);
      setTargetWeather(null);
      setError('City not found. Please check spelling.');
    } finally {
      setIsLoading(false);
    }
  };

  // Temperature formatter
  const formatTemp = (celsius) => {
    if (unit === 'imperial') {
      return Math.round((celsius * 9) / 5 + 32) + '°F';
    }
    return celsius + '°C';
  };

  // Wind speed formatter
  const formatSpeed = (kmh) => {
    if (unit === 'imperial') {
      return parseFloat((kmh * 0.621371).toFixed(1)) + ' mph';
    }
    return kmh + ' km/h';
  };

  // AQI level formatter
  const formatAqi = (aqi) => {
    if (!aqi) return 'N/A';
    const labels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    return `${aqi} (${labels[aqi - 1] || 'Unknown'})`;
  };

  return (
    <div className="glass-card rounded-3xl p-6 text-white shadow-2xl space-y-4">
      {/* Toggle Header */}
      <div 
        onClick={() => {
          setIsOpen(!isOpen);
          setError(null);
        }} 
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <ArrowLeftRight className="w-5 h-5 text-sky-400" />
          <h3 className="text-md font-bold text-slate-300">City Comparison Mode</h3>
        </div>
        <button 
          className="text-xs font-extrabold uppercase px-3 py-1 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 select-none pointer-events-none transition-colors"
          type="button"
        >
          {isOpen ? 'Close' : 'Compare'}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.3 }}
            className="space-y-4 pt-2 border-t border-white/5 overflow-visible"
          >
            {/* Target search field (shows if no target is loaded) */}
            {!targetWeather && (
              <form onSubmit={handleSubmit} ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (error) setError(null);
                    }}
                    onFocus={() => {
                      setIsSearching(true);
                      updateDropdownPosition();
                    }}
                    placeholder="Compare with another city..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 text-white border border-slate-800 rounded-xl text-sm focus:border-sky-500 outline-none transition-all"
                  />
                </div>

                {/* Error Notice */}
                {error && (
                  <div className="text-xs text-rose-400 font-bold mt-1.5 flex items-center gap-1.5 pl-1 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Suggestions Dropdown — rendered via Portal to avoid overflow clipping */}
                {isSearching && (suggestions.length > 0 || isLoading) && dropdownRect &&
                  createPortal(
                    <div
                      style={{
                        position: 'absolute',
                        top: dropdownRect.top,
                        left: dropdownRect.left,
                        width: dropdownRect.width,
                        zIndex: 99999,
                      }}
                    >
                      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {isLoading && (
                          <div className="px-4 py-2.5 text-xs text-slate-400 flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                            Searching...
                          </div>
                        )}
                        {suggestions.map((city, idx) => (
                          <button
                            key={`${city.lat}-${city.lon}-${idx}`}
                            onMouseDown={(e) => { e.preventDefault(); handleSelectTarget(city); }}
                            className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-slate-800 text-left text-xs text-slate-200 transition-colors"
                            type="button"
                          >
                            <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span className="font-bold">{city.name}</span>
                            {city.state && <span className="text-slate-400">, {city.state}</span>}
                            <span className="text-slate-400">, {city.country}</span>
                          </button>
                        ))}
                      </div>
                    </div>,
                    document.body
                  )
                }
              </form>
            )}

            {/* Comparison Display Grid */}
            {primaryWeather && targetWeather && (
              <div className="space-y-4">
                {/* Header Labels */}
                <div className="grid grid-cols-3 text-center border-b border-white/5 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="truncate text-left">{primaryWeather.name}</span>
                  <span>vs</span>
                  <div className="flex items-center justify-end gap-1 truncate">
                    <span className="truncate">{targetWeather.name}</span>
                    <button 
                      onClick={() => setTargetWeather(null)}
                      className="text-slate-400 hover:text-rose-400 shrink-0"
                      title="Clear comparison"
                      type="button"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics Rows */}
                <div className="space-y-2 text-xs">
                  {/* Temp */}
                  <div className="grid grid-cols-3 py-1.5 border-b border-white/5 hover:bg-white/5 px-2 rounded-lg transition-colors">
                    <span className="font-extrabold text-left">{formatTemp(primaryWeather.temp)}</span>
                    <span className="text-slate-400 text-center font-bold">Temp</span>
                    <span className="font-extrabold text-right">{formatTemp(targetWeather.temp)}</span>
                  </div>

                  {/* Conditions */}
                  <div className="grid grid-cols-3 py-1.5 border-b border-white/5 hover:bg-white/5 px-2 rounded-lg transition-colors items-center">
                    <div className="flex items-center gap-1 text-left">
                      <WeatherIcon code={primaryWeather.icon} className="w-5 h-5 shrink-0" />
                      <span className="truncate">{primaryWeather.condition}</span>
                    </div>
                    <span className="text-slate-400 text-center font-bold">Condition</span>
                    <div className="flex items-center gap-1 justify-end text-right">
                      <span className="truncate">{targetWeather.condition}</span>
                      <WeatherIcon code={targetWeather.icon} className="w-5 h-5 shrink-0" />
                    </div>
                  </div>

                  {/* Feels Like */}
                  <div className="grid grid-cols-3 py-1.5 border-b border-white/5 hover:bg-white/5 px-2 rounded-lg transition-colors">
                    <span className="text-left">{formatTemp(primaryWeather.feelsLike)}</span>
                    <span className="text-slate-400 text-center font-bold">Feels Like</span>
                    <span className="text-right">{formatTemp(targetWeather.feelsLike)}</span>
                  </div>

                  {/* Humidity */}
                  <div className="grid grid-cols-3 py-1.5 border-b border-white/5 hover:bg-white/5 px-2 rounded-lg transition-colors">
                    <span className="text-left">{primaryWeather.humidity}%</span>
                    <span className="text-slate-400 text-center font-bold">Humidity</span>
                    <span className="text-right">{targetWeather.humidity}%</span>
                  </div>

                  {/* Wind */}
                  <div className="grid grid-cols-3 py-1.5 border-b border-white/5 hover:bg-white/5 px-2 rounded-lg transition-colors">
                    <span className="text-left truncate">{formatSpeed(primaryWeather.windSpeed)}</span>
                    <span className="text-slate-400 text-center font-bold">Wind</span>
                    <span className="text-right truncate">{formatSpeed(targetWeather.windSpeed)}</span>
                  </div>

                  {/* UV Index */}
                  <div className="grid grid-cols-3 py-1.5 border-b border-white/5 hover:bg-white/5 px-2 rounded-lg transition-colors">
                    <span className="text-left">{primaryWeather.uvIndex}</span>
                    <span className="text-slate-400 text-center font-bold">UV Index</span>
                    <span className="text-right">{targetWeather.uvIndex}</span>
                  </div>

                  {/* Air Quality (AQI) */}
                  <div className="grid grid-cols-3 py-1.5 hover:bg-white/5 px-2 rounded-lg transition-colors">
                    <span className="text-left truncate">{formatAqi(primaryWeather.airPollution?.aqi)}</span>
                    <span className="text-slate-400 text-center font-bold">Air Quality</span>
                    <span className="text-right truncate">{formatAqi(targetWeather.airPollution?.aqi)}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CityCompare;
