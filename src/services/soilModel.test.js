import { describe, it, expect } from 'vitest';
import { predict, SAFE_SOIL_RANGES } from './soilModelService.js';

describe('Soil ML Model Service Suite', () => {
  it('1. Predicts optimal soil health suitability for balanced NPK inputs', () => {
    const res = predict({ nitrogen: 65, phosphorus: 40, potassium: 50, ph: 6.8 });
    expect(res.status).toBe('SUCCESS');
    expect(res.prediction.fertilityStatus).toBe('OPTIMAL');
    expect(res.prediction.suitabilityScore).toBeGreaterThanOrEqual(80);
  });

  it('2. Detects Nitrogen deficiency and recommends Urea dosage', () => {
    const res = predict({ nitrogen: 20, phosphorus: 40, potassium: 50, ph: 6.8 });
    expect(res.status).toBe('SUCCESS');
    expect(res.prediction.fertilityStatus).toBe('DEFICIENT_NITROGEN');
    expect(res.prediction.recommendedFertilizer).toContain('Urea');
  });

  it('3. Detects Acidic Soil and recommends Lime application', () => {
    const res = predict({ nitrogen: 65, phosphorus: 40, potassium: 50, ph: 4.8 });
    expect(res.status).toBe('SUCCESS');
    expect(res.prediction.fertilityStatus).toBe('ACIDIC_SOIL');
    expect(res.prediction.recommendedFertilizer).toContain('Lime');
  });

  it('4. Rejects out-of-bounds soil input parameters safely', () => {
    const res = predict({ nitrogen: 999, ph: 14 });
    expect(res.status).toBe('INVALID_OR_OUT_OF_RANGE_INPUT');
    expect(res.prediction).toBeNull();
  });

  it('5. Exports valid agronomic safety boundaries', () => {
    expect(SAFE_SOIL_RANGES.nitrogen.max).toBe(140);
    expect(SAFE_SOIL_RANGES.ph.min).toBe(3.5);
  });
});
