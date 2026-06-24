import Favorite from '../models/Favorite.js';

// Get all favorites
export const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find().sort({ createdAt: -1 });
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error.message);
    res.status(500).json({ message: 'Failed to retrieve favorite cities.', error: error.message });
  }
};

// Add a favorite city
export const addFavorite = async (req, res) => {
  const { name, lat, lon, country, state } = req.body;

  if (!name || lat === undefined || lon === undefined || !country) {
    return res.status(400).json({ message: 'Missing required city coordinates or metadata.' });
  }

  try {
    // Prevent adding duplicates: check if name matches with lat/lon range
    // A tolerance of 0.05 degrees is used to check if it's the exact same city location
    const existing = await Favorite.findOne({
      name,
      lat: { $gte: lat - 0.05, $lte: lat + 0.05 },
      lon: { $gte: lon - 0.05, $lte: lon + 0.05 }
    });

    if (existing) {
      return res.status(400).json({ message: 'City is already in favorites.' });
    }

    const favorite = await Favorite.create({ name, lat, lon, country, state });
    res.status(201).json(favorite);
  } catch (error) {
    console.error('Error adding favorite:', error.message);
    res.status(500).json({ message: 'Failed to save city to favorites.', error: error.message });
  }
};

// Remove a favorite city by ID
export const removeFavorite = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Favorite.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Favorite entry not found.' });
    }
    res.json({ message: 'City removed from favorites.', id });
  } catch (error) {
    console.error('Error removing favorite:', error.message);
    res.status(500).json({ message: 'Failed to remove city from favorites.', error: error.message });
  }
};
