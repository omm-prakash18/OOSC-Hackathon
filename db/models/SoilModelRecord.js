import mongoose from 'mongoose';

const soilModelSchema = new mongoose.Schema({
  userId: { type: String, default: 'anonymous', index: true },
  userLocation: { type: String, default: 'Azamgarh, UP' },
  soilType: { type: String, default: 'loamy' },
  nitrogen: { type: Number, required: true },
  phosphorus: { type: Number, required: true },
  potassium: { type: Number, required: true },
  ph: { type: Number, required: true },
  suitabilityScore: { type: Number, required: true },
  fertilityStatus: { type: String, required: true },
  recommendedFertilizer: { type: String, required: true },
  dosageAdvisoryEn: { type: String, required: true },
  dosageAdvisoryHi: { type: String, required: true },
  reliability: { type: String, default: 'HIGH' }
}, {
  timestamps: true
});

export const SoilModelRecord = mongoose.models.SoilModelRecord || mongoose.model('SoilModelRecord', soilModelSchema);
