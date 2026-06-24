import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global memory cache for weather requests (5-minute TTL)
const weatherCache = new Map();

export const globalWeatherCache = {
  get: (key) => {
    const entry = weatherCache.get(key);
    if (entry && (Date.now() - entry.timestamp < 5 * 60 * 1000)) {
      return entry.data;
    }
    return null;
  },
  set: (key, data) => {
    weatherCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  },
  clear: () => {
    weatherCache.clear();
  }
};

export const weatherService = {
  // Search autocomplete
  searchCities: async (query) => {
    const response = await apiClient.get(`/weather/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get current weather
  getCurrentWeather: async (cityOrCoords) => {
    const response = await apiClient.get(`/weather/${encodeURIComponent(cityOrCoords)}`);
    return response.data;
  },

  // Get forecast (hourly + daily)
  getForecast: async (cityOrCoords) => {
    const response = await apiClient.get(`/weather/${encodeURIComponent(cityOrCoords)}/forecast`);
    return response.data;
  },
};

export const favoritesService = {
  // Get all favorites
  getFavorites: async () => {
    const response = await apiClient.get('/favorites');
    return response.data;
  },

  // Add favorite
  addFavorite: async (cityData) => {
    const response = await apiClient.post('/favorites', cityData);
    return response.data;
  },

  // Remove favorite
  removeFavorite: async (id) => {
    const response = await apiClient.delete(`/favorites/${id}`);
    return response.data;
  },
};

export const historyService = {
  // Get history
  getHistory: async () => {
    const response = await apiClient.get('/history');
    return response.data;
  },

  // Clear history
  clearHistory: async () => {
    const response = await apiClient.delete('/history');
    return response.data;
  },
};

export const thresholdsService = {
  // Get all thresholds
  getThresholds: async () => {
    const response = await apiClient.get('/thresholds');
    return response.data;
  },

  // Save/Update threshold alerts for a city
  saveThreshold: async (thresholdData) => {
    const response = await apiClient.post('/thresholds', thresholdData);
    return response.data;
  },

  // Delete threshold alerts
  deleteThreshold: async (id) => {
    const response = await apiClient.delete(`/thresholds/${id}`);
    return response.data;
  },
};

export default apiClient;
