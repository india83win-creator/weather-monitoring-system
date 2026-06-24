# AeroCast - Premium Weather Monitoring System

AeroCast is a full-stack, production-grade Weather Monitoring System designed with the premium aesthetics and rich functional density of leading platforms like Apple Weather, AccuWeather, and Weather.com.

The application features live-updating search suggestions, an interactive favorite locations dashboard, query search history logged to MongoDB, dynamic HTML5 Canvas particle overlays that visually render current weather patterns, and fully responsive glassmorphism styles.

---

## Key Features

1. **Smart Location Search**: Autocomplete city suggestions using the OpenWeather Geocoding API with a debounced backend router.
2. **Comprehensive Current Metrics**: Live reporting of temperature, high/low, feels-like, wind speed/direction (via an interactive compass), humidity, pressure, visibility, estimated UV Index, and local timezone-adjusted sunrise/sunset schedules.
3. **Interactive Forecast Strips**:
   - **Hourly Forecast**: The next 24 hours of temperatures, condition icons, and precipitation probability in a sleek horizontal strip.
   - **Daily Forecast**: A 5-day daily card layout showcasing temperature thresholds and daily conditions.
4. **Favorites Dashboard**: Quick-access grid containing live-updating weather cards for favorite locations, querying real-time updates in parallel.
5. **Search History Logs**: User queries saved to MongoDB with timestamps, viewable as click-to-query tags and clearable at any time.
6. **Automatic Geolocation**: Detects user location on initial startup with a manual search override and graceful error fallbacks.
7. **Units Toggle**: Standard conversion interface for Imperial (°F, mph, mi) and Metric (°C, km/h, km) dimensions.
8. **Dynamic Canvas Particle Backgrounds**: Fluid HTML5 canvas effects rendering rain, snow, drifting clouds, twinkling stars, solar ray glows, and randomized thunderstorm lightning flashes.
9. **Polished UX**: Skeleton loaders and smooth Framer Motion element entries.

---

## Technology Stack

- **Frontend**: React.js (Vite), Tailwind CSS v4, Framer Motion, Lucide React, Axios
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Morgan, Axios, Dotenv
- **API Data Provider**: OpenWeatherMap API

---

## Getting Started

### 1. Prerequisite: Obtain an OpenWeatherMap API Key
1. Go to [OpenWeatherMap](https://openweathermap.org/) and create a free account.
2. Once registered, navigate to your account dashboard and select the **API Keys** tab.
3. Generate a new key (it may take 10-20 minutes to activate after generation).

### 2. Database Requirement
- A running local instance of MongoDB (`mongodb://127.0.0.1:27017/weather_system`) or a MongoDB Atlas connection URI.

---

## Setup & Running Instructions

### Backend Setup
1. Open a terminal and navigate to the `/server` folder:
   ```bash
   cd server
   ```
2. Install the server dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the provided `.env.example` template:
   ```bash
   copy .env.example .env
   ```
4. Edit the `.env` file and input your OpenWeatherMap API Key:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/weather_system
   OPENWEATHER_API_KEY=your_key_here
   ```
5. Start the backend developer server:
   ```bash
   npm run dev
   ```
   The backend will connect to MongoDB and start on [http://localhost:5000](http://localhost:5000).

### Frontend Setup
1. Open a new terminal and navigate to the `/client` folder:
   ```bash
   cd client
   ```
2. Install the client packages:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to the URL shown (typically [http://localhost:5173](http://localhost:5173)).

---

## Directory Architecture

```
/
├── client/                 # React Frontend
│   ├── public/             # Static Assets
│   ├── src/
│   │   ├── components/     # UI Components (SearchBar, UnitToggle, cards, Canvas BG, skeleton)
│   │   ├── services/       # API Axios Client Integration
│   │   ├── App.jsx         # App State coordinator and Layout Shell
│   │   ├── index.css       # Tailwind CSS v4 & custom glass classes
│   │   └── main.jsx        # App DOM mounting
│   ├── index.html          # Web entry and SEO meta configurations
│   └── vite.config.js      # Vite build configurations with Tailwind v4
│
├── server/                 # Express Backend
│   ├── config/             # DB Connection Config
│   ├── controllers/        # Route logic (weather API proxies, favorites CRUD, history logging)
│   ├── models/             # Mongoose Schemas (Favorite, SearchHistory)
│   ├── routes/             # API Router definitions
│   ├── .env                # Configured Server Environment variables
│   └── server.js           # Server bootstrap and middleware
│
└── README.md               # Setup Guide and project documentation
```
