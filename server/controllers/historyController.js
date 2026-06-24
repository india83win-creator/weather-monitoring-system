import SearchHistory from '../models/SearchHistory.js';

// Get search history (sorted by timestamp descending, limit to 20)
export const getHistory = async (req, res) => {
  try {
    const history = await SearchHistory.find().sort({ timestamp: -1 }).limit(20);
    res.json(history);
  } catch (error) {
    console.error('Error fetching search history:', error.message);
    res.status(500).json({ message: 'Failed to retrieve search history.', error: error.message });
  }
};

// Clear all search history
export const clearHistory = async (req, res) => {
  try {
    await SearchHistory.deleteMany({});
    res.json({ message: 'Search history cleared successfully.' });
  } catch (error) {
    console.error('Error clearing search history:', error.message);
    res.status(500).json({ message: 'Failed to clear search history.', error: error.message });
  }
};
