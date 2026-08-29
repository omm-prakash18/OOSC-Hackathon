import mongoose from 'mongoose';

const cropPoolSchema = new mongoose.Schema({
  poolId: { type: String, required: true, unique: true },
  commodity_hi: { type: String, required: true },
  commodity_en: { type: String, required: true },
  category_hi: { type: String, default: 'सब्ज़ी' },
  category_en: { type: String, default: 'Vegetable' },
  targetQtl: { type: Number, required: true },
  filledQtl: { type: Number, default: 0 },
  buyerName: { type: String, required: true },
  buyerLocation: { type: String, required: true },
  state: { type: String, default: 'Uttar Pradesh' },
  district: { type: String, default: 'Azamgarh' },
  offerPrice: { type: Number, required: true },
  deadline: { type: String, required: true },
  qualityRequired: { type: String, default: 'Grade A' },
  status: { type: String, enum: ['OPEN', 'FILLING', 'CLOSED'], default: 'OPEN' },
  coordinatorName_hi: { type: String, default: 'किराना ट्रस्ट नोड (सत्यापित)' },
  coordinatorName_en: { type: String, default: 'Kirana Trust Node (Verified)' },
  participants: { type: Number, default: 1 },
  members: [{
    farmerName: String,
    phone: String,
    village: String,
    qtl: Number,
    joinedAt: { type: Date, default: Date.now }
  }],
  createdBy: { type: String, default: 'Community Farmer' },
  createdByUserId: { type: String, default: '' }
}, {
  timestamps: true
});

export const CropPoolModel = mongoose.models.CropPool || mongoose.model('CropPool', cropPoolSchema);
