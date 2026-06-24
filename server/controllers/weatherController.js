import axios from 'axios';
import SearchHistory from '../models/SearchHistory.js';

// Estimate UV Index based on latitude, time of day, and cloud cover
const estimateUVIndex = (lat, cloudCover = 0, timezoneOffset = 0) => {
  // Get current UTC time and convert to local time in hours (decimal)
  const utcDate = new Date();
  const localTimeInMs = utcDate.getTime() + timezoneOffset * 1000;
  const localDate = new Date(localTimeInMs);
  const localHour = localDate.getUTCHours() + localDate.getUTCMinutes() / 60;

  // 1. Base UV index is higher near the equator and lower near poles
  // Max possible UV at equator is around 12, scaling down towards poles
  const latRad = (Math.abs(lat) * Math.PI) / 180;
  const maxUVForLatitude = Math.max(1, 12 * Math.cos(latRad));

  // 2. Diurnal variation: Peak at solar noon (12:00 / 12 PM), 0 during night (6 PM to 6 AM)
  let timeFactor = 0;
  if (localHour >= 6 && localHour <= 18) {
    // Cosine curve peaking at 12:00
    timeFactor = Math.cos(((localHour - 12) * Math.PI) / 12);
  }

  // 3. Cloud cover attenuates UV radiation (heavy clouds block up to 70-80% UV)
  const cloudFactor = 1 - 0.75 * (cloudCover / 100);

  // Calculate UV Index
  const estimatedUV = maxUVForLatitude * timeFactor * cloudFactor;
  return parseFloat(Math.max(0, Math.min(11, estimatedUV)).toFixed(1));
};

// Autocomplete city search
export const searchCities = async (req, res) => {
  const { q } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ message: 'Search query must be at least 2 characters.' });
  }

  if (!apiKey) {
    return res.status(500).json({ message: 'OpenWeatherMap API Key is not configured on the server.' });
  }

  try {
    const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${apiKey}`;
    const response = await axios.get(geoUrl);
    
    // Format response to remove unnecessary fields
    const cities = response.data.map(item => ({
      name: item.name,
      lat: item.lat,
      lon: item.lon,
      country: item.country,
      state: item.state || ''
    }));

    res.json(cities);
  } catch (error) {
    console.error('Error searching cities:', error.message);
    res.status(error.response?.status || 500).json({ 
      message: 'Failed to search cities from geocoding API.',
      error: error.message 
    });
  }
};

// Current Weather
export const getWeather = async (req, res) => {
  const { city } = req.params;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'OpenWeatherMap API Key is not configured on the server.' });
  }

  try {
    let url = '';
    const isCoords = /^(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)$/.test(city);

    if (isCoords) {
      const [lat, lon] = city.split(',');
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    } else {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    }

    const response = await axios.get(url);
    const data = response.data;
    const lat = data.coord.lat;
    const lon = data.coord.lon;

    // Log this search into Search History if it is NOT a direct coordinate check
    if (!isCoords) {
      try {
        // Check if there is an existing history entry for the same city (using a 0.05 degree tolerance)
        const existing = await SearchHistory.findOne({
          lat: { $gte: lat - 0.05, $lte: lat + 0.05 },
          lon: { $gte: lon - 0.05, $lte: lon + 0.05 }
        });

        if (existing) {
          // Update timestamp to move to top of history
          existing.timestamp = new Date();
          existing.query = city;
          await existing.save();
        } else {
          await SearchHistory.create({
            query: city,
            name: data.name,
            lat,
            lon,
            country: data.sys.country,
            state: '' // Geocoding API supplies state, standard weather doesn't; default to blank
          });
        }
      } catch (err) {
        console.error('Failed to save search history:', err.message);
      }
    }

    // Fetch Air Pollution API data with graceful catch block
    let airPollution = null;
    try {
      const pollutionUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
      const pollutionRes = await axios.get(pollutionUrl);
      if (pollutionRes.data && pollutionRes.data.list && pollutionRes.data.list[0]) {
        const pData = pollutionRes.data.list[0];
        airPollution = {
          aqi: pData.main.aqi, // 1 to 5
          components: pData.components // co, no, no2, o3, so2, pm2_5, pm10, nh3
        };
      }
    } catch (err) {
      console.warn('Air pollution API failed or rate-limited. Graceful fallback enabled:', err.message);
    }

    // Dynamic severe weather warnings computation
    const alerts = [];
    const windSpeedKmh = parseFloat((data.wind.speed * 3.6).toFixed(1));
    const tempC = Math.round(data.main.temp);

    if (windSpeedKmh > 55) {
      alerts.push({
        event: 'High Wind Advisory',
        description: `Extreme wind gusts of ${windSpeedKmh} km/h detected. Secure outdoor items.`,
        severity: 'moderate'
      });
    }
    if (tempC > 38) {
      alerts.push({
        event: 'Extreme Heat Warning',
        description: `Dangerous heat index of ${tempC}°C. Minimize outdoor activities and drink plenty of fluids.`,
        severity: 'severe'
      });
    } else if (tempC < -10) {
      alerts.push({
        event: 'Extreme Cold Warning',
        description: `Severe freezing temperature of ${tempC}°C. Stay indoors and protect exposed pipes.`,
        severity: 'severe'
      });
    }

    const mainCondition = data.weather[0].main.toLowerCase();
    if (mainCondition.includes('thunder') || mainCondition.includes('storm')) {
      alerts.push({
        event: 'Severe Thunderstorm Warning',
        description: 'Strong electrical activity and localized heavy rainfall. Seek indoor shelter.',
        severity: 'severe'
      });
    } else if (mainCondition.includes('tornado')) {
      alerts.push({
        event: 'Tornado Warning',
        description: 'Dangerous rotation threat detected. Seek shelter in an interior room or basement immediately.',
        severity: 'extreme'
      });
    }

    // Format the current weather response
    const weatherInfo = {
      name: data.name,
      country: data.sys.country,
      lat,
      lon,
      temp: tempC,
      feelsLike: Math.round(data.main.feels_like),
      tempMin: Math.round(data.main.temp_min),
      tempMax: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      visibility: data.visibility / 1000, // convert meters to km
      windSpeed: windSpeedKmh,
      windDeg: data.wind.deg,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      timezone: data.timezone,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      clouds: data.clouds.all,
      uvIndex: estimateUVIndex(lat, data.clouds.all, data.timezone),
      dt: data.dt,
      airPollution,
      alerts
    };

    res.json(weatherInfo);
  } catch (error) {
    console.error('Error fetching current weather:', error.message);
    res.status(error.response?.status || 500).json({ 
      message: 'Failed to retrieve current weather data.',
      error: error.message 
    });
  }
};

// Daily + Hourly Forecast
export const getForecast = async (req, res) => {
  const { city } = req.params;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'OpenWeatherMap API Key is not configured on the server.' });
  }

  try {
    let url = '';
    const isCoords = /^(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)$/.test(city);

    if (isCoords) {
      const [lat, lon] = city.split(',');
      url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    } else {
      url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    }

    const response = await axios.get(url);
    const data = response.data;
    const list = data.list;
    const lat = data.city.coord.lat;
    const timezoneOffset = data.city.timezone;

    // 1. Process Hourly Forecast (next 24 hours = 8 list items * 3h increment)
    const hourly = list.slice(0, 8).map(item => ({
      dt: item.dt,
      time: new Date((item.dt + timezoneOffset) * 1000).getUTCHours(),
      temp: Math.round(item.main.temp),
      condition: item.weather[0].main,
      icon: item.weather[0].icon,
      pop: item.pop !== undefined ? Math.round(item.pop * 100) : 0, // probability of precipitation (0 to 100)
    }));

    // 2. Process Daily Forecast (5 Days)
    // Group 3-hour chunks by local calendar date
    const dailyMap = {};
    list.forEach(item => {
      // Get the local date of the weather point using UTC getters to prevent toISOString timezone reversion
      const localDate = new Date((item.dt + timezoneOffset) * 1000);
      const year = localDate.getUTCFullYear();
      const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(localDate.getUTCDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`; // YYYY-MM-DD

      if (!dailyMap[dateString]) {
        dailyMap[dateString] = [];
      }
      dailyMap[dateString].push(item);
    });

    const daily = [];
    Object.keys(dailyMap).forEach(dateStr => {
      const items = dailyMap[dateStr];
      
      // Calculate daily min & max temperatures
      let tempMin = Infinity;
      let tempMax = -Infinity;
      const icons = {};
      const conditions = {};
      let totalPop = 0;

      items.forEach(item => {
        if (item.main.temp_min < tempMin) tempMin = item.main.temp_min;
        if (item.main.temp_max > tempMax) tempMax = item.main.temp_max;
        
        // Count conditions and icons to find the most common for the day
        const icon = item.weather[0].icon;
        const cond = item.weather[0].main;
        icons[icon] = (icons[icon] || 0) + 1;
        conditions[cond] = (conditions[cond] || 0) + 1;

        if (item.pop) {
          totalPop = Math.max(totalPop, item.pop);
        }
      });

      // Find primary icon and condition (highest frequency)
      const primaryIcon = Object.keys(icons).reduce((a, b) => (icons[a] > icons[b] ? a : b));
      // Standardize icon to daytime version for the daily summary view
      const dayIcon = primaryIcon.replace('n', 'd');
      const primaryCondition = Object.keys(conditions).reduce((a, b) => (conditions[a] > conditions[b] ? a : b));

      daily.push({
        date: dateStr,
        dt: items[0].dt, // timestamp of the first point in this day
        tempMin: Math.round(tempMin),
        tempMax: Math.round(tempMax),
        condition: primaryCondition,
        icon: dayIcon,
        pop: totalPop !== undefined ? Math.round(totalPop * 100) : 0,
      });
    });

    // In case the list spans 6 calendar dates due to timezone offsets, sort and trim to 5 days
    daily.sort((a, b) => a.dt - b.dt);
    
    res.json({
      city: data.city.name,
      country: data.city.country,
      timezone: data.city.timezone,
      hourly,
      daily: daily.slice(0, 5) // return standard 5 days
    });
  } catch (error) {
    console.error('Error fetching forecast:', error.message);
    res.status(error.response?.status || 500).json({ 
      message: 'Failed to retrieve forecast data.',
      error: error.message 
    });
  }
};
