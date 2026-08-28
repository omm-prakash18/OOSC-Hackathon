/**
 * LokVani AI — Distress Prediction Engine
 * Computes farmer distress score (0 - 100) based on rainfall deviation,
 * price drop percentages, loan repayment urgency, and crop vulnerability.
 */

export function calculateDistressScore(params = {}) {
  const rainfallDeviation = Number(params.rainfallDeviationPct || 0); // e.g. -40%
  const priceDrop = Number(params.priceDropPct || 0);                 // e.g. -25%
  const daysToLoan = params.daysToLoanDue !== null && params.daysToLoanDue !== undefined ? Number(params.daysToLoanDue) : null;
  const cropStage = params.cropStage || 'vegetative';
  const cropType = params.cropType || 'wheat';

  let score = 15; // baseline baseline score
  const reasons = [];

  // 1. Rainfall Deficit Penalty
  if (rainfallDeviation <= -30) {
    score += 35;
    reasons.push(`Severe rainfall deficit of ${Math.abs(rainfallDeviation)}% in Eastern UP region`);
  } else if (rainfallDeviation <= -15) {
    score += 20;
    reasons.push(`Moderate rainfall deficit of ${Math.abs(rainfallDeviation)}%`);
  }

  // 2. Mandi Price Crash Penalty
  if (priceDrop <= -20) {
    score += 30;
    reasons.push(`Mandi commodity price dropped by ${Math.abs(priceDrop)}% below MSP benchmark`);
  } else if (priceDrop <= -10) {
    score += 15;
    reasons.push(`Mandi commodity price dropped by ${Math.abs(priceDrop)}%`);
  }

  // 3. Loan Due Date Urgency Penalty
  if (daysToLoan !== null) {
    if (daysToLoan <= 15) {
      score += 25;
      reasons.push(`KCC agricultural loan payment due in ${daysToLoan} days`);
    } else if (daysToLoan <= 30) {
      score += 15;
      reasons.push(`KCC agricultural loan payment due in ${daysToLoan} days`);
    }
  }

  const finalScore = Math.min(Math.max(score, 5), 98);

  // Risk Tiers
  let tier = 'STABLE';
  if (finalScore >= 70) {
    tier = 'URGENT';
  } else if (finalScore >= 40) {
    tier = 'ELEVATED';
  }

  const spokenReasonsHi = reasons.length > 0
    ? `तनाव स्तर: ${finalScore}/100 (${tier})। मुख्य कारण: ${reasons.join('; ')}।`
    : `तनाव स्तर: ${finalScore}/100। आपकी फसल एवं मंडी स्थिति सामान्य है।`;

  const spokenReasonsEn = reasons.length > 0
    ? `Distress Risk Score: ${finalScore}/100 (${tier}). Key Factors: ${reasons.join('; ')}.`
    : `Distress Risk Score: ${finalScore}/100. Crop and mandi conditions are currently stable.`;

  return {
    score: finalScore,
    tier,
    reasons: reasons.length > 0 ? reasons : ['All crop & mandi risk indicators are within safe thresholds'],
    spokenReasons: {
      hi: spokenReasonsHi,
      en: spokenReasonsEn
    },
    actionableAdvisory: tier === 'URGENT'
      ? 'Visit nearest Kirana Trust Node operator immediately for 1-click distress relief & KCC loan restructuring support.'
      : 'Monitor Mandi updates and weather advisories daily on LokVani AI.'
  };
}
