import mongoose from 'mongoose';

const distressRecordSchema = new mongoose.Schema({
  userId: { type: String, default: 'anonymous', index: true },
  userLocation: { type: String, default: 'Azamgarh, UP' },
  score: { type: Number, required: true },
  tier: { type: String, enum: ['STABLE', 'ELEVATED', 'URGENT'], required: true },
  reasons: [{ type: String }],
  spokenReasonsHi: { type: String, required: true },
  spokenReasonsEn: { type: String, required: true },
  actionableAdvisory: { type: String, required: true }
}, {
  timestamps: true
});

export const DistressRecord = mongoose.models.DistressRecord || mongoose.model('DistressRecord', distressRecordSchema);
