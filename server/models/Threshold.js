import mongoose from 'mongoose';

const ThresholdSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
  },
  country: {
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
  tempMax: {
    type: Number,
    default: null,
  },
  tempMin: {
    type: Number,
    default: null,
  },
  windMax: {
    type: Number,
    default: null,
  },
  aqiMax: {
    type: Number,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Threshold', ThresholdSchema);
