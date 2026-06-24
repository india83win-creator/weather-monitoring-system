import Threshold from '../models/Threshold.js';

// Get all thresholds
export const getThresholds = async (req, res) => {
  try {
    const thresholds = await Threshold.find();
    res.json(thresholds);
  } catch (error) {
    console.error('Error fetching thresholds:', error.message);
    res.status(500).json({ message: 'Failed to retrieve thresholds.', error: error.message });
  }
};

// Create or update thresholds for a city
export const saveThreshold = async (req, res) => {
  const { city, country, lat, lon, tempMax, tempMin, windMax, aqiMax } = req.body;

  if (!city || !country || lat === undefined || lon === undefined) {
    return res.status(400).json({ message: 'Missing required city name, country code, or coordinates.' });
  }

  try {
    // 1. Primary check: Exact city name (case-insensitive) and country code (case-insensitive)
    let threshold = await Threshold.findOne({
      city: { $regex: new RegExp(`^${city.trim()}$`, 'i') },
      country: { $regex: new RegExp(`^${country.trim()}$`, 'i') }
    });

    // 2. Secondary fallback check: Coordinate proximity (within 0.08 degree tolerance)
    if (!threshold) {
      threshold = await Threshold.findOne({
        lat: { $gte: lat - 0.08, $lte: lat + 0.08 },
        lon: { $gte: lon - 0.08, $lte: lon + 0.08 }
      });
    }

    if (threshold) {
      // Update existing record
      threshold.city = city;
      threshold.country = country;
      threshold.lat = lat;
      threshold.lon = lon;
      threshold.tempMax = tempMax === undefined ? null : tempMax;
      threshold.tempMin = tempMin === undefined ? null : tempMin;
      threshold.windMax = windMax === undefined ? null : windMax;
      threshold.aqiMax = aqiMax === undefined ? null : aqiMax;
      threshold.updatedAt = new Date();
      await threshold.save();
      res.json(threshold);
    } else {
      // Create new record
      const newThreshold = await Threshold.create({
        city,
        country,
        lat,
        lon,
        tempMax: tempMax === undefined ? null : tempMax,
        tempMin: tempMin === undefined ? null : tempMin,
        windMax: windMax === undefined ? null : windMax,
        aqiMax: aqiMax === undefined ? null : aqiMax
      });
      res.status(201).json(newThreshold);
    }
  } catch (error) {
    console.error('Error saving threshold:', error.message);
    res.status(500).json({ message: 'Failed to save threshold alerts.', error: error.message });
  }
};

// Delete a threshold entry by MongoDB ID
export const deleteThreshold = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Threshold.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Threshold settings not found.' });
    }
    res.json({ message: 'Threshold alerts deleted successfully.', id });
  } catch (error) {
    console.error('Error deleting threshold:', error.message);
    res.status(500).json({ message: 'Failed to delete threshold alerts.', error: error.message });
  }
};
