import mongoose from 'mongoose';

const SearchHistorySchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  lat: {
    type: Number,
    required: true,
  },
  lon: {
    type: Number,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('SearchHistory', SearchHistorySchema);
