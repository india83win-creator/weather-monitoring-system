import express from 'express';
import { searchCities, getWeather, getForecast } from '../controllers/weatherController.js';
import { getFavorites, addFavorite, removeFavorite } from '../controllers/favoriteController.js';
import { getHistory, clearHistory } from '../controllers/historyController.js';
import { getThresholds, saveThreshold, deleteThreshold } from '../controllers/thresholdController.js';

const router = express.Router();

// Weather Routes
router.get('/weather/search', searchCities);
router.get('/weather/:city', getWeather);
router.get('/weather/:city/forecast', getForecast);

// Favorites Routes
router.get('/favorites', getFavorites);
router.post('/favorites', addFavorite);
router.delete('/favorites/:id', removeFavorite);

// History Routes
router.get('/history', getHistory);
router.delete('/history', clearHistory);

// Threshold Alerts Routes
router.get('/thresholds', getThresholds);
router.post('/thresholds', saveThreshold);
router.delete('/thresholds/:id', deleteThreshold);

export default router;
