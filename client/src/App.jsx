import React, { useState, useEffect } from 'react';
import { CloudSun, RefreshCw, AlertTriangle, Compass, ShieldAlert, Navigation, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import SearchBar from './components/SearchBar';
import CurrentWeatherCard from './components/CurrentWeatherCard';
import HourlyForecast from './components/HourlyForecast';
import DailyForecast from './components/DailyForecast';
import FavoritesDashboard from './components/FavoritesDashboard';
import SearchHistory from './components/SearchHistory';
import UnitToggle from './components/UnitToggle';
import WeatherBackground from './components/WeatherBackground';
import SkeletonLoader from './components/SkeletonLoader';
import AirQualityCard from './components/AirQualityCard';
import TempChart from './components/TempChart';
import SunArc from './components/SunArc';
import CityCompare from './components/CityCompare';
import ThresholdMonitor from './components/ThresholdMonitor';
import { weatherService, favoritesService, historyService, thresholdsService } from './services/api';

const App = () => {
  const [cityQuery, setCityQuery] = useState('');
  const [cityName, setCityName] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [unit, setUnit] = useState('metric'); // 'metric' (°C, km/h) or 'imperial' (°F, mph)
  const theme = 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [thresholds, setThresholds] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [updateTimeText, setUpdateTimeText] = useState('Just now');

  // Enforce dark theme class to document root
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  const loadThresholds = async () => {
    try {
      const data = await thresholdsService.getThresholds();
      setThresholds(data);
    } catch (err) {
      console.error('Error loading thresholds:', err);
    }
  };

  // Load Favorites, Search History, and Thresholds
  const loadFavoritesAndHistory = async () => {
    try {
      const favs = await favoritesService.getFavorites();
      setFavorites(favs);
      
      const hist = await historyService.getHistory();
      setHistory(hist);

      await loadThresholds();
    } catch (err) {
      console.error('Error loading history/favorites/thresholds:', err);
    }
  };

  // Load weather and forecast
  const loadWeatherData = async (query) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch both current weather and forecast in parallel
      const [weatherData, forecastData] = await Promise.all([
        weatherService.getCurrentWeather(query),
        weatherService.getForecast(query)
      ]);

      setWeather(weatherData);
      setForecast(forecastData);
      setCityName(weatherData.name);

      setLastUpdated(Date.now());
      setUpdateTimeText('Just now');
      
      // Update history list as a search was performed
      const hist = await historyService.getHistory();
      setHistory(hist);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(
        err.response?.data?.message || 
        'Could not retrieve weather data. Please check your internet connection or city name.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Autodetect browser geolocation
  const handleGeolocation = () => {
    setIsLoading(true);
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const coordsQuery = `${latitude},${longitude}`;
          setCityQuery(coordsQuery);
          loadWeatherData(coordsQuery);
        },
        (geoError) => {
          console.warn('Geolocation failed/denied, falling back to default:', geoError.message);
          // Fallback to London if geolocation fails
          const fallbackCity = 'London';
          setCityQuery(fallbackCity);
          loadWeatherData(fallbackCity);
        },
        { timeout: 8000 }
      );
    } else {
      // Browser doesn't support Geolocation
      const fallbackCity = 'London';
      setCityQuery(fallbackCity);
      loadWeatherData(fallbackCity);
    }
  };

  // Initialize page: Auto-detect location & load stats
  useEffect(() => {
    loadFavoritesAndHistory();
    handleGeolocation();
  }, []);

  // Trigger auto-refresh loop for the ACTIVE city weather only (every 5 mins)
  useEffect(() => {
    if (!cityQuery || isLoading) return;

    const refreshInterval = setInterval(() => {
      console.log('[Auto-Refresh] Fetching live weather monitoring update for:', cityQuery);
      
      const refetchActiveCity = async () => {
        try {
          const [weatherData, forecastData] = await Promise.all([
            weatherService.getCurrentWeather(cityQuery),
            weatherService.getForecast(cityQuery)
          ]);
          setWeather(weatherData);
          setForecast(forecastData);
          setCityName(weatherData.name);
          setLastUpdated(Date.now());
          setUpdateTimeText('Just now');
        } catch (err) {
          console.warn('[Auto-Refresh] Failed to auto-update weather telemetry:', err.message);
        }
      };

      refetchActiveCity();
    }, 5 * 60 * 1000); // 5 minutes refresh cycle

    return () => {
      console.log('[Auto-Refresh] Clearing active refresh loop for:', cityQuery);
      clearInterval(refreshInterval);
    };
  }, [cityQuery, isLoading]);

  // Tick the relative elapsed minutes text every 30 seconds
  useEffect(() => {
    const tickInterval = setInterval(() => {
      const diffInMins = Math.floor((Date.now() - lastUpdated) / 60000);
      if (diffInMins < 1) {
        setUpdateTimeText('Just now');
      } else {
        setUpdateTimeText(`${diffInMins}m ago`);
      }
    }, 30000);

    return () => clearInterval(tickInterval);
  }, [lastUpdated]);

  // Handle City Select from Search Bar, History, or Favorites
  const handleSelectCity = (query, name) => {
    setCityQuery(query);
    if (name) setCityName(name);
    loadWeatherData(query);
  };

  // Check if current city is in favorites list
  const isCurrentFavorite = () => {
    if (!weather || !favorites) return false;
    return favorites.some(
      (fav) =>
        fav.name.toLowerCase() === weather.name.toLowerCase() &&
        Math.abs(fav.lat - weather.lat) < 0.08 &&
        Math.abs(fav.lon - weather.lon) < 0.08
    );
  };

  // Toggle Favorite Status
  const handleToggleFavorite = async () => {
    if (!weather) return;

    const currentFav = favorites.find(
      (fav) =>
        fav.name.toLowerCase() === weather.name.toLowerCase() &&
        Math.abs(fav.lat - weather.lat) < 0.08 &&
        Math.abs(fav.lon - weather.lon) < 0.08
    );

    try {
      if (currentFav) {
        // Remove favorite
        await favoritesService.removeFavorite(currentFav._id);
      } else {
        // Add favorite
        await favoritesService.addFavorite({
          name: weather.name,
          lat: weather.lat,
          lon: weather.lon,
          country: weather.country,
          state: ''
        });
      }
      // Reload favorites list
      const favs = await favoritesService.getFavorites();
      setFavorites(favs);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Remove Favorite directly from Dashboard
  const handleRemoveFavorite = async (id) => {
    try {
      await favoritesService.removeFavorite(id);
      const favs = await favoritesService.getFavorites();
      setFavorites(favs);
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  // Clear History
  const handleClearHistory = async () => {
    try {
      await historyService.clearHistory();
      setHistory([]);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  // Helper to determine day/night status from current weather timestamp & sunrise/sunset
  const checkIsNight = () => {
    if (!weather) return false;
    const now = Math.floor(Date.now() / 1000);
    // If we have local sunset/sunrise, compare. Else check icon code for 'n' letter
    if (weather.icon && weather.icon.includes('n')) {
      return true;
    }
    return now < weather.sunrise || now > weather.sunset;
  };

  return (
    <div className="relative min-h-screen text-slate-100 pb-16 bg-transition">
      {/* Immersive Canvas-based Background */}
      <WeatherBackground 
        condition={weather?.condition || 'Clear'} 
        isNight={checkIsNight()} 
        theme={theme}
      />

      {/* Main Grid Wrapper */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Header Navigation Bar */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 select-none">
            <div className="p-2.5 bg-sky-500/20 border border-sky-400/30 rounded-2xl shadow-lg shadow-sky-500/10">
              <CloudSun className="w-8 h-8 text-sky-400 animate-float" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
                AeroCast
              </h1>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400/80">
                Weather Monitoring System
              </p>
            </div>
          </div>

          {/* Interactive controls */}
          <div className="flex items-center gap-3">


            {/* Geolocation Button */}
            <button
              onClick={handleGeolocation}
              className="p-2.5 bg-slate-900/60 hover:bg-slate-950/80 text-sky-400 hover:text-sky-300 border border-slate-700/50 hover:border-sky-500/40 rounded-full transition-all duration-300 cursor-pointer shadow-lg shadow-black/10 select-none"
              title="Detect current location"
              type="button"
            >
              <Navigation className="w-4 h-4 shrink-0" />
            </button>
            
            {/* Unit toggle pill */}
            <UnitToggle unit={unit} onChange={(u) => setUnit(u)} />
          </div>
        </header>

        {/* Dynamic Weather Alerts Banner */}
        {weather && weather.alerts && weather.alerts.length > 0 && (
          <div className="bg-rose-500/20 text-rose-200 border border-rose-500/30 p-4 rounded-2xl flex items-start gap-3 shadow-lg backdrop-blur-md relative z-20">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
            <div>
              {weather.alerts.map((alert, idx) => (
                <div key={idx} className={idx > 0 ? 'mt-2 border-t border-rose-500/10 pt-2' : ''}>
                  <span className="font-extrabold uppercase text-xs tracking-wider">{alert.event}:</span>{' '}
                  <span className="text-xs">{alert.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Autocomplete Search */}
        <SearchBar 
          onSelectCity={handleSelectCity} 
          currentCityName={cityName} 
        />

        {/* Core Layout Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left/Middle: Weather metrics (70% on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <div className="space-y-6">
                  <SkeletonLoader type="current" />
                  <SkeletonLoader type="hourly" />
                  <SkeletonLoader type="daily" />
                </div>
              ) : error ? (
                <motion.div
                  key="error-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card rounded-3xl p-8 text-center border-rose-500/20 max-w-xl mx-auto my-12"
                >
                  <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto animate-bounce" />
                  <h3 className="text-xl font-bold text-slate-100 mt-4">Weather Request Failed</h3>
                  <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">{error}</p>
                  <button
                    onClick={() => loadWeatherData(cityQuery || 'London')}
                    className="mt-6 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 transition-all select-none cursor-pointer flex items-center gap-2 mx-auto"
                    type="button"
                  >
                    <RefreshCw className="w-4 h-4" /> Try Again
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="weather-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Current Weather details */}
                  <CurrentWeatherCard
                    weather={weather}
                    todayForecast={forecast?.daily?.[0]}
                    isFavorite={isCurrentFavorite()}
                    onToggleFavorite={handleToggleFavorite}
                    unit={unit}
                    thresholds={thresholds}
                    updateTimeText={updateTimeText}
                  />

                  {/* Side-by-side AQI and Sun Trajectory Arc */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AirQualityCard airPollution={weather.airPollution} />
                    <SunArc weather={weather} />
                  </div>

                  {/* Temperature hourly trend line chart */}
                  <TempChart hourlyData={forecast?.hourly} unit={unit} />

                  {/* Hourly forecast strip */}
                  <HourlyForecast
                    forecastList={forecast?.hourly}
                    timezoneOffset={weather?.timezone}
                    unit={unit}
                  />

                  {/* Daily forecast list */}
                  <DailyForecast
                    dailyList={forecast?.daily}
                    unit={unit}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar: Favorites dashboard + History logs (30% on large screens) */}
          <div className="space-y-6 lg:sticky lg:top-6 self-start">
            {/* City Compare Toggle Panel */}
            <CityCompare primaryWeather={weather} unit={unit} />

            {/* Threshold Settings Monitor */}
            <ThresholdMonitor
              activeCityName={cityName}
              activeCountryCode={weather?.country || ''}
              activeLat={weather?.lat}
              activeLon={weather?.lon}
              thresholds={thresholds}
              onRefreshThresholds={loadThresholds}
            />

            {/* Favorites dashboard */}
            <FavoritesDashboard
              favorites={favorites}
              onSelectCity={handleSelectCity}
              onRemoveFavorite={handleRemoveFavorite}
              onRefreshFavorites={loadFavoritesAndHistory}
              unit={unit}
              thresholds={thresholds}
            />

            {/* Clearable Search History */}
            <SearchHistory
              history={history}
              onSelectCity={handleSelectCity}
              onClearHistory={handleClearHistory}
              unit={unit}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
