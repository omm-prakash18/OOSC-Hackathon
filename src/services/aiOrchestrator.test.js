import { describe, it, expect } from 'vitest';
import { processOrchestratedQuery } from './aiOrchestrator.js';

describe('Central AI Orchestrator & Intent Routing Suite', () => {
  it('1. Classifies and orchestrates SOIL_ADVISORY intent with Soil Model prediction', async () => {
    const res = await processOrchestratedQuery({ queryText: 'Meri mitti me nitrogen kitna hona chahiye aur konsa khad daalein?' });
    expect(res.intent).toBe('SOIL_ADVISORY');
    expect(res.sources).toContain('SOIL_MODEL');
    expect(res.modelResults.soil).toBeDefined();
    expect(res.requiresTrustReview).toBe(true); // Fertilizer high-stakes review
  });

  it('2. Orchestrates WEATHER query using live verified weather service', async () => {
    const res = await processOrchestratedQuery({ queryText: 'Kal mere gaon Azamgarh me mausam aur barish kaisi rahegi?' });
    expect(res.intent).toBe('WEATHER');
    expect(res.sources).toContain('WEATHER_API');
    expect(res.weatherData).toBeDefined();
  });

  it('3. Orchestrates MANDI_PRICE query using verified Mandi price service', async () => {
    const res = await processOrchestratedQuery({ queryText: 'Aaj tamatar ka mandi bhav aur rate kya hai?' });
    expect(res.intent).toBe('MANDI_PRICE');
    expect(res.sources).toContain('MANDI_API');
    expect(res.mandiData).toBeDefined();
  });

  it('4. Orchestrates CROP_PREDICTION using Soil Model + Crop Model integration pipeline', async () => {
    const res = await processOrchestratedQuery({ queryText: 'Mujhe bataiye konsi fasal ugayein domat mitti me?' });
    expect(res.intent).toBe('CROP_PREDICTION');
    expect(res.sources).toContain('SOIL_MODEL');
    expect(res.sources).toContain('CROP_MODEL');
    expect(res.modelResults.crop).toBeDefined();
  });

  it('5. Routes high-stakes fertilizer query to Kirana Trust Review queue', async () => {
    const res = await processOrchestratedQuery({ queryText: 'DAP aur Urea kitna daalein gehun me?' });
    expect(res.requiresTrustReview).toBe(true);
    expect(res.trustReason).toBeDefined();
  });

  it('6. Handles Out-Of-Distribution (OOD) invalid inputs safely', async () => {
    const res = await processOrchestratedQuery({
      queryText: 'Mitti ka ph 14.0 hai',
      userParams: { ph: 14.0 }
    });
    expect(res.requiresTrustReview).toBe(true);
    expect(res.trustReason).toContain('Out-of-range');
  });
});
