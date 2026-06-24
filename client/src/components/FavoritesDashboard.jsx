import React, { useState, useEffect } from 'react';
import { Trash2, Heart, HeartCrack, ChevronRight, CloudSun, AlertCircle } from 'lucide-react';
import { WeatherIcon } from './CurrentWeatherCard';
import { weatherService, favoritesService, globalWeatherCache } from '../services/api';

const SUGGESTED_CITIES = [
  { name: 'Delhi', lat: 28.6139, lon: 77.2090, country: 'IN', state: 'Delhi' },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, country: 'IN', state: 'Maharashtra' },
  { name: 'Bangalore', lat: 12.9716, lon: 77.5946, country: 'IN', state: 'Karnataka' }
];

const FavoritesDashboard = ({ favorites, onSelectCity, onRemoveFavorite, onRefreshFavorites, unit, thresholds = [] }) => {
  const [weatherMap, setWeatherMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

  // States for suggested cities when empty
  const [suggestedWeatherMap, setSuggestedWeatherMap] = useState({});
  const [suggestedLoadingMap, setSuggestedLoadingMap] = useState({});

  // Temperature Conversions
  const formatTemp = (celsius) => {
    if (unit === 'imperial') {
      return Math.round((celsius * 9) / 5 + 32) + '°F';
    }
    return celsius + '°C';
  };

  // Helper to determine if a favorite city breaches any threshold
  const checkBreach = (fav, weather) => {
    if (!weather || weather.error || !thresholds) return null;

    // Find threshold using city name + country code as primary
    let t = thresholds.find(rule => 
      rule.city.toLowerCase() === fav.name.toLowerCase() && 
      rule.country.toLowerCase() === fav.country.toLowerCase()
    );

    // Coordinates as secondary fallback check
    if (!t && fav.lat !== undefined && fav.lon !== undefined) {
      t = thresholds.find(rule => 
        Math.abs(rule.lat - fav.lat) < 0.08 && 
        Math.abs(rule.lon - fav.lon) < 0.08
      );
    }

    // Skip silently if no threshold rules are saved for this city
    if (!t) return null;

    // Check individual threshold breach states
    if (t.tempMax !== null && weather.temp > t.tempMax) return `Temp > ${t.tempMax}°C`;
    if (t.tempMin !== null && weather.temp < t.tempMin) return `Temp < ${t.tempMin}°C`;
    if (t.windMax !== null && weather.windSpeed > t.windMax) return `Wind > ${t.windMax} km/h`;
    if (t.aqiMax !== null && weather.airPollution?.aqi > t.aqiMax) return `AQI > ${t.aqiMax}`;

    return null;
  };

  // Fetch weather for all favorite cities in parallel when the list of favorites changes
  useEffect(() => {
    if (!favorites || favorites.length === 0) {
      setWeatherMap({});
      return;
    }

    let active = true;

    const fetchWeatherForFavorites = async () => {
      const newWeatherMap = { ...weatherMap };

      const fetchPromises = favorites.map(async (fav) => {
        const key = fav._id;
        const cacheKey = `${fav.lat.toFixed(4)},${fav.lon.toFixed(4)}`;
        
        // Check global memory cache
        const cached = globalWeatherCache.get(cacheKey);
        if (cached) {
          newWeatherMap[key] = cached;
          return;
        }

        if (active) {
          setLoadingMap(prev => ({ ...prev, [key]: true }));
        }

        try {
          const query = `${fav.lat},${fav.lon}`;
          const weatherData = await weatherService.getCurrentWeather(query);
          globalWeatherCache.set(cacheKey, weatherData);
          newWeatherMap[key] = weatherData;
        } catch (err) {
          console.error(`Failed to fetch weather for favorite ${fav.name}:`, err);
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

    // Debounce fetching by 400ms to protect API rate limits
    const timer = setTimeout(() => {
      fetchWeatherForFavorites();
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [favorites]);

  // Fetch weather for suggested cities when favorites dashboard is empty
  useEffect(() => {
    if (favorites && favorites.length > 0) return;

    let active = true;

    const fetchSuggestedWeather = async () => {
      const newMap = { ...suggestedWeatherMap };

      const fetchPromises = SUGGESTED_CITIES.map(async (city) => {
        const key = city.name;
        const cacheKey = `${city.lat.toFixed(4)},${city.lon.toFixed(4)}`;

        // Check global memory cache
        const cached = globalWeatherCache.get(cacheKey);
        if (cached) {
          newMap[key] = cached;
          return;
        }

        if (active) {
          setSuggestedLoadingMap(prev => ({ ...prev, [key]: true }));
        }

        try {
          const query = `${city.lat},${city.lon}`;
          const weatherData = await weatherService.getCurrentWeather(query);
          globalWeatherCache.set(cacheKey, weatherData);
          newMap[key] = weatherData;
        } catch (err) {
          console.error(`Failed to fetch weather for suggestion ${city.name}:`, err);
          newMap[key] = { error: true };
        } finally {
          if (active) {
            setSuggestedLoadingMap(prev => ({ ...prev, [key]: false }));
          }
        }
      });

      await Promise.all(fetchPromises);
      if (active) {
        setSuggestedWeatherMap(newMap);
      }
    };

    // Debounce suggested location fetches by 400ms to protect API limits
    const timer = setTimeout(() => {
      fetchSuggestedWeather();
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [favorites]);

  // Quick add a suggested city as a favorite (checking for duplicates first)
  const handleQuickAdd = async (e, city) => {
    e.stopPropagation();
    
    // Duplicate check on the frontend
    const exists = favorites && favorites.some(
      (fav) => fav.name.toLowerCase() === city.name.toLowerCase() &&
               Math.abs(fav.lat - city.lat) < 0.08 &&
               Math.abs(fav.lon - city.lon) < 0.08
    );

    if (exists) {
      alert(`${city.name} is already in your favorites!`);
      return;
    }

    try {
      await favoritesService.addFavorite({
        name: city.name,
        lat: city.lat,
        lon: city.lon,
        country: city.country,
        state: city.state
      });
      if (onRefreshFavorites) {
        await onRefreshFavorites();
      }
    } catch (err) {
      console.error('Failed to add favorite city:', err);
    }
  };

  if (!favorites || favorites.length === 0) {
    return (
      <div className="space-y-5">
        {/* Polished Empty State Container */}
        <div className="glass-card rounded-3xl p-6 text-center text-slate-350 shadow-2xl flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-sky-500/5 rounded-full blur-2xl" />
          <CloudSun className="w-14 h-14 text-sky-400/80 animate-float mb-3" />
          <h4 className="text-md font-extrabold text-slate-200">Save Your Favorite Locations</h4>
          <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
            Search for locations and tap the heart icon on their details card to save them here for quick access.
          </p>
        </div>

        {/* Suggested Locations Deck */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Suggested Locations
          </h4>
          <div className="flex flex-col gap-3">
            {SUGGESTED_CITIES.map((city) => {
              const key = city.name;
              const weather = suggestedWeatherMap[key];
              const isLoading = suggestedLoadingMap[key];

              return (
                <div
                  key={city.name}
                  onClick={() => onSelectCity(`${city.lat},${city.lon}`, city.name)}
                  className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-sky-500/30 rounded-2xl cursor-pointer transition-all duration-300 group shadow-inner"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={(e) => handleQuickAdd(e, city)}
                      className="p-2 bg-slate-800/60 group-hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer text-slate-400 group-hover:text-rose-400"
                      title="Add to favorites"
                      type="button"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-slate-200 group-hover:text-white truncate">
                        {city.name}
                      </div>
                      <div className="text-[10px] font-bold text-slate-450 mt-0.5 uppercase tracking-wider">
                        {city.country} • {city.state}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4.5 w-10 bg-slate-700/40 rounded animate-pulse" />
                        <div className="h-6 w-6 bg-slate-700/40 rounded-full animate-pulse" />
                      </div>
                    ) : weather && !weather.error ? (
                      <>
                        <div className="text-right">
                          <div className="text-sm font-black text-white">{formatTemp(weather.temp)}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-none mt-0.5">{weather.condition}</div>
                        </div>
                        <WeatherIcon code={weather.icon} className="w-8 h-8" />
                      </>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1.5 rounded-xl border border-rose-500/20">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-md font-bold tracking-tight text-slate-350 flex items-center gap-2">
        <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />
        Favorites Dashboard
      </h3>

      <div className="flex flex-col gap-3">
        {favorites.map((fav) => {
          const key = fav._id;
          const weather = weatherMap[key];
          const isLoading = loadingMap[key];

          return (
            <div
              key={fav._id}
              onClick={() => onSelectCity(`${fav.lat},${fav.lon}`, fav.name)}
              className="glass-card rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 hover:scale-[1.01] border border-white/5 hover:border-white/10 transition-all duration-300 shadow-lg cursor-pointer group relative overflow-hidden"
            >
              {/* Overlay highlight */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Title & Delete */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite(fav._id);
                  }}
                  className="p-2 bg-slate-800/60 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-rose-400"
                  title="Remove from favorites"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-slate-200 group-hover:text-sky-350 transition-colors truncate flex items-center gap-1.5">
                    {fav.name}
                    {(() => {
                      const breachedMsg = checkBreach(fav, weather);
                      return breachedMsg ? (
                        <span 
                          title={`Threshold Breached: ${breachedMsg}`}
                          className="text-[9px] bg-rose-500/25 text-rose-350 border border-rose-500/35 px-1.5 py-0.5 rounded-md font-black animate-pulse flex items-center gap-1 select-none"
                        >
                          <span className="w-1 h-1 rounded-full bg-rose-500" />
                          ⚠ Alert
                        </span>
                      ) : null;
                    })()}
                  </h4>
                  <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest mt-0.5">
                    {fav.country} {fav.state ? `• ${fav.state}` : ''}
                  </p>
                </div>
              </div>

              {/* Weather Stats */}
              <div className="flex items-center gap-2 shrink-0">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4.5 w-10 bg-slate-700/40 rounded animate-pulse" />
                    <div className="h-6 w-6 bg-slate-700/40 rounded-full animate-pulse" />
                  </div>
                ) : weather && !weather.error ? (
                  <>
                    <div className="text-right">
                      <div className="text-sm font-black text-white">
                        {formatTemp(weather.temp)}
                      </div>
                      <div className="text-[9px] font-bold text-slate-450 uppercase tracking-wide leading-none mt-0.5">
                        {weather.condition}
                      </div>
                    </div>
                    <WeatherIcon code={weather.icon} className="w-8 h-8" />
                  </>
                ) : (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1.5 rounded-xl border border-rose-500/20">
                    Unavailable
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-550 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FavoritesDashboard;
