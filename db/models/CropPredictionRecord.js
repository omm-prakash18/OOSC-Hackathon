import mongoose from 'mongoose';

const cropPredictionSchema = new mongoose.Schema({
  userId: { type: String, default: 'anonymous', index: true },
  userLocation: { type: String, default: 'Azamgarh, UP' },
  primaryCrop: { type: String, required: true },
  primaryCropNameHi: { type: String, required: true },
  suitabilityScore: { type: Number, required: true },
  estimatedYieldTonsPerHectare: { type: Number, required: true },
  advisoryEn: { type: String, required: true },
  advisoryHi: { type: String, required: true },
  topRecommendedCrops: [{
    crop: String,
    nameHi: String,
    score: Number
  }],
  reliability: { type: String, default: 'HIGH' }
}, {
  timestamps: true
});

export const CropPredictionRecord = mongoose.models.CropPredictionRecord || mongoose.model('CropPredictionRecord', cropPredictionSchema);
