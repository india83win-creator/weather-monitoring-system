import React from 'react';
import { 
  Sun, Moon, Cloud, CloudRain, CloudDrizzle, CloudLightning, Snowflake, Wind, 
  Droplets, Eye, Compass, SunDim, Sunrise, Sunset, Heart, HelpCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mapping OpenWeatherMap icon codes to rich, animated Lucide Icons
export const WeatherIcon = ({ code, className = "w-12 h-12" }) => {
  const c = code || '01d';
  
  switch (c) {
    case '01d': // Clear sky day
      return <Sun className={`${className} text-amber-400 animate-spin-slow`} />;
    case '01n': // Clear sky night
      return <Moon className={`${className} text-indigo-300 animate-float`} />;
    case '02d': // Few clouds day
      return (
        <div className="relative">
          <Sun className={`${className} text-amber-400 opacity-80`} />
          <Cloud className={`${className} text-slate-300 absolute top-2 left-2 animate-float`} />
        </div>
      );
    case '02n': // Few clouds night
      return (
        <div className="relative">
          <Moon className={`${className} text-indigo-300 opacity-80`} />
          <Cloud className={`${className} text-slate-400 absolute top-2 left-2 animate-float`} />
        </div>
      );
    case '03d':
    case '03n':
    case '04d':
    case '04n': // Clouds
      return <Cloud className={`${className} text-slate-300 animate-float`} />;
    case '09d':
    case '09n': // Shower rain
      return <CloudDrizzle className={`${className} text-sky-400 animate-pulse`} />;
    case '10d':
    case '10n': // Rain
      return <CloudRain className={`${className} text-sky-400 animate-bounce`} />;
    case '11d':
    case '11n': // Thunderstorm
      return <CloudLightning className={`${className} text-purple-400 animate-pulse`} />;
    case '13d':
    case '13n': // Snow
      return <Snowflake className={`${className} text-sky-100 animate-spin-slow`} />;
    case '50d':
    case '50n': // Mist / Fog / Haze
      return <Wind className={`${className} text-zinc-300`} />;
    default:
      return <Sun className={`${className} text-amber-400`} />;
  }
};

const CurrentWeatherCard = ({ weather, todayForecast, isFavorite, onToggleFavorite, unit, thresholds = [], updateTimeText = 'Just now' }) => {
  if (!weather) return null;

  // Find matching threshold using city name + country code as primary
  let activeThreshold = thresholds.find(t => 
    t.city.toLowerCase() === weather.name.toLowerCase() && 
    t.country.toLowerCase() === weather.country.toLowerCase()
  );

  // Coordinates fallback check
  if (!activeThreshold && weather.lat !== undefined && weather.lon !== undefined) {
    activeThreshold = thresholds.find(t => 
      Math.abs(t.lat - weather.lat) < 0.08 && 
      Math.abs(t.lon - weather.lon) < 0.08
    );
  }

  const breachedAlerts = [];
  if (activeThreshold) {
    if (activeThreshold.tempMax !== null && weather.temp > activeThreshold.tempMax) {
      breachedAlerts.push(`Temp ${weather.temp}°C > ${activeThreshold.tempMax}°C limit`);
    }
    if (activeThreshold.tempMin !== null && weather.temp < activeThreshold.tempMin) {
      breachedAlerts.push(`Temp ${weather.temp}°C < ${activeThreshold.tempMin}°C limit`);
    }
    if (activeThreshold.windMax !== null && weather.windSpeed > activeThreshold.windMax) {
      breachedAlerts.push(`Wind ${weather.windSpeed} km/h > ${activeThreshold.windMax} km/h limit`);
    }
    const aqi = weather.airPollution?.aqi;
    if (activeThreshold.aqiMax !== null && aqi && aqi > activeThreshold.aqiMax) {
      const aqiLabels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
      breachedAlerts.push(`AQI Level ${aqi} (${aqiLabels[aqi - 1] || 'Unknown'}) > ${activeThreshold.aqiMax} (${aqiLabels[activeThreshold.aqiMax - 1] || 'Unknown'}) limit`);
    }
  }

  // Temperature Conversions
  const formatTemp = (celsius) => {
    if (unit === 'imperial') {
      return Math.round((celsius * 9) / 5 + 32) + '°F';
    }
    return celsius + '°C';
  };

  // Speed Conversions
  const formatSpeed = (kmh) => {
    if (unit === 'imperial') {
      return parseFloat((kmh * 0.621371).toFixed(1)) + ' mph';
    }
    return kmh + ' km/h';
  };

  // Visibility Conversions
  const formatVisibility = (km) => {
    if (unit === 'imperial') {
      return parseFloat((km * 0.621371).toFixed(1)) + ' mi';
    }
    return km + ' km';
  };

  // Time conversion
  const formatLocalTime = (timestamp, timezoneOffset) => {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  };

  // UV Index Level Classification
  const getUVLevel = (uv) => {
    if (uv <= 2) return { text: 'Low', color: 'bg-green-500/20 text-green-300 border-green-500/30' };
    if (uv <= 5) return { text: 'Moderate', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
    if (uv <= 7) return { text: 'High', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
    if (uv <= 10) return { text: 'Very High', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    return { text: 'Extreme', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
  };

  const uvLevel = getUVLevel(weather.uvIndex);

  // Compass directions mapping
  const getWindDirection = (deg) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((deg % 360) / 22.5) % 16;
    return directions[index];
  };

  const highTemp = todayForecast ? todayForecast.tempMax : weather.tempMax;
  const lowTemp = todayForecast ? todayForecast.tempMin : weather.tempMin;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl animate-fade-in w-full"
    >
      {/* Decorative colored glow inside card background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />

      {/* Threshold Breached Alert Banner */}
      {breachedAlerts.length > 0 && (
        <div className="relative z-20 mb-5 bg-rose-500/20 border border-rose-500/40 text-rose-250 p-4 rounded-2xl flex flex-col gap-1.5 shadow-lg backdrop-blur-md">
          {breachedAlerts.map((alertMsg, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs font-black">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span>⚠ Threshold Breached: {alertMsg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Top row: City Name, Date/Time and Favorite heart toggle button */}
      <div className="relative z-10 flex justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-2.5">
            {weather.name}
            <span className="text-sm font-semibold px-2 py-0.5 bg-white/10 rounded-md uppercase tracking-wider text-slate-300 border border-white/5">
              {weather.country}
            </span>
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            Local time: {formatLocalTime(Math.floor(Date.now() / 1000), weather.timezone)}
          </p>

          {/* Real-time Monitoring Auto-Refresh Telemetry */}
          <p className="text-[10px] text-emerald-450 font-bold tracking-wider mt-0.5 select-none flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            Monitoring Status: Active • Last updated: {updateTimeText}
          </p>
        </div>

        <button
          onClick={onToggleFavorite}
          className={`p-2.5 rounded-full border transition-all duration-300 select-none ${
            isFavorite 
              ? 'bg-rose-500/20 text-rose-500 border-rose-500/40 hover:bg-rose-500/30' 
              : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          type="button"
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500' : ''}`} />
        </button>
      </div>

      {/* Mid section: Temperature, Condition, and Condition Icon */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 md:py-8 border-b border-white/10">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
            <WeatherIcon code={weather.icon} className="w-20 h-20 md:w-24 md:h-24 drop-shadow-[0_4px_12px_rgba(56,189,248,0.3)]" />
          </div>
          <div>
            <div className="text-6xl md:text-7xl font-black tracking-tighter">
              {formatTemp(weather.temp)}
            </div>
            <div className="text-lg md:text-xl font-bold text-primary-contrast capitalize mt-1.5 flex items-center gap-2">
              {weather.description}
            </div>
            <div className="text-xs md:text-sm text-secondary-contrast mt-1 font-semibold flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Today's Range</span>
              <span>High: {formatTemp(highTemp)} &nbsp;•&nbsp; Low: {formatTemp(lowTemp)}</span>
            </div>
          </div>
        </div>

        {/* Big visual label */}
        <div className="hidden md:flex flex-col items-end text-right">
          <span className="text-sm font-bold text-sky-500 uppercase tracking-widest">Current Weather</span>
          <span className="text-5xl font-black opacity-10 uppercase select-none mt-2 select-none tracking-widest">{weather.condition}</span>
        </div>
      </div>

      {/* Bottom section: Weather details grid */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6 md:mt-8">
        {/* Feels Like */}
        <div className="p-4 glass-card-sub shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-2 text-secondary-contrast text-xs md:text-sm mb-1.5 font-bold">
            <SunDim className="w-4 h-4 text-sky-500" />
            Feels Like
          </div>
          <div className="text-lg md:text-xl font-black text-primary-contrast">{formatTemp(weather.feelsLike)}</div>
        </div>

        {/* Humidity */}
        <div className="p-4 glass-card-sub shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-2 text-secondary-contrast text-xs md:text-sm mb-1.5 font-bold">
            <Droplets className="w-4 h-4 text-sky-500" />
            Humidity
          </div>
          <div className="text-lg md:text-xl font-black text-primary-contrast">{weather.humidity}%</div>
        </div>

        {/* Wind Speed & Compass Direction */}
        <div className="p-4 glass-card-sub shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-2 text-secondary-contrast text-xs md:text-sm mb-1.5 font-bold">
            <Wind className="w-4 h-4 text-sky-500" />
            Wind
          </div>
          <div className="flex items-center gap-2">
            <div className="text-lg md:text-xl font-black text-primary-contrast">{formatSpeed(weather.windSpeed)}</div>
            <div className="flex items-center gap-0.5 text-xs text-sky-400 font-extrabold">
              <Compass 
                className="w-3.5 h-3.5 transition-transform" 
                style={{ transform: `rotate(${weather.windDeg}deg)` }} 
              />
              <span>{getWindDirection(weather.windDeg)}</span>
            </div>
          </div>
        </div>

        {/* UV Index */}
        <div className="p-4 glass-card-sub shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-2 text-secondary-contrast text-xs md:text-sm mb-1.5 font-bold">
            <Sun className="w-4 h-4 text-sky-500" />
            UV Index
          </div>
          <div className="flex items-center gap-2">
            <div className="text-lg md:text-xl font-black text-primary-contrast">{weather.uvIndex}</div>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${uvLevel.color}`}>
              {uvLevel.text}
            </span>
          </div>
        </div>

        {/* Visibility */}
        <div className="p-4 glass-card-sub shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-2 text-secondary-contrast text-xs md:text-sm mb-1.5 font-bold">
            <Eye className="w-4 h-4 text-sky-500" />
            Visibility
          </div>
          <div className="text-lg md:text-xl font-black text-primary-contrast">{formatVisibility(weather.visibility)}</div>
        </div>

        {/* Cloud Cover */}
        <div className="p-4 glass-card-sub shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-2 text-secondary-contrast text-xs md:text-sm mb-1.5 font-bold">
            <Cloud className="w-4 h-4 text-sky-500" />
            Cloud Cover
          </div>
          <div className="text-lg md:text-xl font-black text-primary-contrast">
            {weather.clouds !== undefined && weather.clouds !== null ? `${weather.clouds}%` : 'N/A'}
          </div>
        </div>

        {/* Sunrise */}
        <div className="p-4 glass-card-sub shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-2 text-secondary-contrast text-xs md:text-sm mb-1.5 font-bold">
            <Sunrise className="w-4 h-4 text-sky-500" />
            Sunrise
          </div>
          <div className="text-lg md:text-xl font-black text-primary-contrast">
            {formatLocalTime(weather.sunrise, weather.timezone)}
          </div>
        </div>

        {/* Sunset */}
        <div className="p-4 glass-card-sub shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-2 text-secondary-contrast text-xs md:text-sm mb-1.5 font-bold">
            <Sunset className="w-4 h-4 text-sky-500" />
            Sunset
          </div>
          <div className="text-lg md:text-xl font-black text-primary-contrast">
            {formatLocalTime(weather.sunset, weather.timezone)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CurrentWeatherCard;
