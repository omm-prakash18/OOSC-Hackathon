import { describe, it, expect } from 'vitest';
import { predict } from './cropModelService.js';

describe('Crop Recommendation ML Model Service Suite', () => {
  it('1. Predicts Wheat as primary crop for cool climate and loamy soil', () => {
    const res = predict({ soilType: 'loamy', temperature: 18, ph: 6.5 });
    expect(res.status).toBe('SUCCESS');
    expect(res.prediction.primaryCrop).toBe('wheat');
    expect(res.prediction.suitabilityScore).toBeGreaterThanOrEqual(80);
  });

  it('2. Predicts Paddy/Rice for clayey soil and high temperature', () => {
    const res = predict({ soilType: 'clayey', temperature: 30, ph: 6.2 });
    expect(res.status).toBe('SUCCESS');
    expect(res.prediction.primaryCrop).toBe('rice');
  });

  it('3. Provides top 3 alternative crop recommendations with suitability scores', () => {
    const res = predict({ soilType: 'loamy', temperature: 20, ph: 6.5 });
    expect(res.prediction.topRecommendedCrops.length).toBe(3);
    expect(res.prediction.estimatedYieldTonsPerHectare).toBeGreaterThan(0);
  });

  it('4. Rejects out-of-range environmental input values', () => {
    const res = predict({ ph: 18.0, temperature: 99 });
    expect(res.status).toBe('INVALID_OR_OUT_OF_RANGE_INPUT');
    expect(res.prediction).toBeNull();
  });

  it('5. Returns high reliability status for valid predictions', () => {
    const res = predict({ soilType: 'sandy', temperature: 22, ph: 6.8 });
    expect(res.reliability).toBe('HIGH');
  });
});
