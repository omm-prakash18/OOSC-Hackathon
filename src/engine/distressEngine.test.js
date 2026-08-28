import { describe, it, expect } from 'vitest';
import { calculateDistressScore } from './distressEngine.js';

describe('Distress Prediction Engine Suite', () => {
  it('1. Calculates baseline risk score for stable farming conditions', () => {
    const res = calculateDistressScore({ rainfallDeviationPct: 0, priceDropPct: 0, daysToLoanDue: 60 });
    expect(res.tier).toBe('STABLE');
    expect(res.score).toBeLessThan(40);
  });

  it('2. Triggers URGENT distress tier for severe rainfall deficit, price crash & urgent loan due', () => {
    const res = calculateDistressScore({ rainfallDeviationPct: -40, priceDropPct: -25, daysToLoanDue: 10 });
    expect(res.tier).toBe('URGENT');
    expect(res.score).toBeGreaterThanOrEqual(70);
    expect(res.reasons.length).toBeGreaterThanOrEqual(3);
  });

  it('3. Generates bilingual spoken distress reasons in Hindi and English', () => {
    const res = calculateDistressScore({ rainfallDeviationPct: -35, priceDropPct: -20 });
    expect(res.spokenReasons.hi).toContain('तनाव स्तर');
    expect(res.spokenReasons.en).toContain('Distress Risk Score');
  });

  it('4. Recommends Kirana Trust Node 1-click relief for URGENT tier', () => {
    const res = calculateDistressScore({ rainfallDeviationPct: -50, priceDropPct: -30, daysToLoanDue: 5 });
    expect(res.actionableAdvisory).toContain('Kirana Trust Node');
  });

  it('5. Handles missing or empty parameters safely', () => {
    const res = calculateDistressScore({});
    expect(res.score).toBeGreaterThan(0);
    expect(res.tier).toBeDefined();
  });
});
