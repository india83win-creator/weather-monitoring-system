import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, History, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { weatherService, historyService } from '../services/api';

const SearchBar = ({ onSelectCity, currentCityName }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search history
  const fetchHistory = async () => {
    try {
      const data = await historyService.getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Error fetching search history:', err);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchHistory();
    }
  }, [isFocused]);

  // Debounced autocomplete query
  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await weatherService.searchCities(query);
        setSuggestions(results);
      } catch (err) {
        console.error('Error fetching autocomplete cities:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce as requested

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (city) => {
    const cityStr = city.lat && city.lon ? `${city.lat},${city.lon}` : city.name;
    onSelectCity(cityStr, city.name);
    setQuery('');
    setSuggestions([]);
    setIsFocused(false);
  };

  const handleClearHistory = async (e) => {
    e.stopPropagation();
    try {
      await historyService.clearHistory();
      setHistory([]);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSelectCity(query.trim());
    setIsFocused(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-xl mx-auto z-30">
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={currentCityName ? `Currently in ${currentCityName}... Search other cities` : "Search city (e.g. London, Paris, New York)..."}
          className="w-full pl-12 pr-10 py-3.5 bg-slate-900/60 hover:bg-slate-900/80 focus:bg-slate-950/90 text-white placeholder-slate-400 border border-slate-700/50 focus:border-sky-500 rounded-2xl shadow-xl backdrop-blur-xl transition-all duration-300 text-sm md:text-base outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            type="button"
            style={{ zIndex: 10 }}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </form>

      {/* Autocomplete Dropdown List */}
      <AnimatePresence>
        {isFocused && (suggestions.length > 0 || history.length > 0 || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[350px] overflow-y-auto custom-scrollbar z-50"
          >
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center justify-center py-4 text-slate-400 text-xs gap-2 border-b border-slate-800">
                <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                Searching cities...
              </div>
            )}

            {/* Suggestions list */}
            {suggestions.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-1 text-[11px] font-bold text-sky-400 uppercase tracking-widest">
                  Locations found
                </div>
                {suggestions.map((city, idx) => (
                  <button
                    key={`${city.lat}-${city.lon}-${idx}`}
                    onClick={() => handleSelect(city)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-800/60 text-left text-slate-200 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <span className="font-medium">{city.name}</span>
                      {city.state && <span className="text-slate-400 text-xs">, {city.state}</span>}
                      <span className="text-slate-400 text-xs">, {city.country}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Search History */}
            {query.trim().length < 2 && history.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/40">
                  <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Recent Searches</span>
                  <button
                    onClick={handleClearHistory}
                    className="flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer uppercase transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </div>
                <div className="divide-y divide-slate-800/30">
                  {history.map((hist) => (
                    <button
                      key={hist._id}
                      onClick={() => handleSelect(hist)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-800/40 text-left text-slate-300 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium text-slate-200">{hist.name}</span>
                        {hist.state && <span className="text-slate-400 text-xs">, {hist.state}</span>}
                        <span className="text-slate-400 text-xs">, {hist.country}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {query.trim().length >= 2 && suggestions.length === 0 && !isLoading && (
              <div className="px-4 py-6 text-center text-slate-400 text-sm">
                No matching locations found.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
