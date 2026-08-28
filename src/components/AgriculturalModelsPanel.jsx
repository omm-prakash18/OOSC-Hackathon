import React, { useState } from 'react';
import { Sprout, Activity, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as soilModelService from '../services/soilModelService';
import * as cropModelService from '../services/cropModelService';
import { calculateDistressScore } from '../engine/distressEngine';

export default function AgriculturalModelsPanel({ language = 'hi' }) {
  // Soil Model Form State
  const [soilInputs, setSoilInputs] = useState({
    nitrogen: 65,
    phosphorus: 40,
    potassium: 50,
    ph: 6.8,
    soilType: 'loamy'
  });
  const [soilResult, setSoilResult] = useState(soilModelService.predict(soilInputs));

  // Crop Model Form State
  const [cropInputs, setCropInputs] = useState({
    soilType: 'loamy',
    temperature: 22,
    ph: 6.8
  });
  const [cropResult, setCropResult] = useState(cropModelService.predict(cropInputs));

  // Distress Engine Form State
  const [distressInputs, setDistressInputs] = useState({
    rainfallDeviationPct: -35,
    priceDropPct: -20,
    daysToLoanDue: 15,
    cropType: 'wheat'
  });
  const [distressResult, setDistressResult] = useState(calculateDistressScore(distressInputs));

  // Handlers
  const handleSoilPredict = () => {
    setSoilResult(soilModelService.predict(soilInputs));
  };

  const handleCropPredict = () => {
    setCropResult(cropModelService.predict(cropInputs));
  };

  const handleDistressPredict = () => {
    setDistressResult(calculateDistressScore(distressInputs));
  };

  return (
    <Card className="border-emerald-600/30 bg-white/95 shadow-md overflow-hidden my-6">
      <CardHeader className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 backdrop-blur-xs">
              <Sprout size={22} />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">
                {language === 'hi' ? 'कृषि एमएल मॉडल एवं प्रेडिक्टर' : 'Agricultural ML Intelligence Models'}
              </CardTitle>
              <p className="text-xs text-emerald-200 opacity-90 mt-0.5">
                {language === 'hi' ? 'मृदा स्वास्थ्य, फसल अनुशंसा एवं किसान तनाव जोखिम मॉडल' : 'Trained Soil Model, Crop Predictor & Distress Risk Assessment'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-700/80 text-emerald-100 text-xs font-bold border border-emerald-500/30">
            {language === 'hi' ? 'सक्रिय ML मॉडल्स' : '3 ML Models Active'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        <Tabs defaultValue="soil" className="w-full">
          <TabsList className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl mb-6">
            <TabsTrigger value="soil" className="text-xs font-bold py-2">
              🧪 {language === 'hi' ? 'मृदा परीक्षण (Soil Model)' : 'Soil Health Model'}
            </TabsTrigger>
            <TabsTrigger value="crop" className="text-xs font-bold py-2">
              🌾 {language === 'hi' ? 'फसल अनुशंसा (Crop Model)' : 'Crop Predictor'}
            </TabsTrigger>
            <TabsTrigger value="distress" className="text-xs font-bold py-2">
              ⚠️ {language === 'hi' ? 'किसान तनाव मॉडल' : 'Distress Risk Engine'}
            </TabsTrigger>
          </TabsList>

          {/* 1. SOIL HEALTH ML MODEL */}
          <TabsContent value="soil" className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nitrogen (N: kg/ha)</label>
                <input
                  type="number"
                  value={soilInputs.nitrogen}
                  onChange={e => setSoilInputs({ ...soilInputs, nitrogen: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phosphorus (P: kg/ha)</label>
                <input
                  type="number"
                  value={soilInputs.phosphorus}
                  onChange={e => setSoilInputs({ ...soilInputs, phosphorus: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Potassium (K: kg/ha)</label>
                <input
                  type="number"
                  value={soilInputs.potassium}
                  onChange={e => setSoilInputs({ ...soilInputs, potassium: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">pH Level (3.5 - 9.0)</label>
                <input
                  type="number" step="0.1"
                  value={soilInputs.ph}
                  onChange={e => setSoilInputs({ ...soilInputs, ph: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSoilPredict} size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5">
                <RefreshCw size={13} /> {language === 'hi' ? 'मृदा स्वास्थ्य प्रेडिक्ट करें' : 'Run Soil Model Prediction'}
              </Button>
            </div>

            {soilResult?.prediction && (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-700" />
                    {language === 'hi' ? 'मृदा उर्वरता परिणाम' : 'Soil Model Prediction Result'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-800 text-white text-[11px] font-bold">
                      {soilResult.prediction.suitabilityScore}/100 Score
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[11px] font-bold uppercase">
                      {soilResult.prediction.fertilityStatus}
                    </span>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-900">
                  {language === 'hi' ? soilResult.prediction.dosageAdvisoryHi : soilResult.prediction.dosageAdvisoryEn}
                </p>

                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>Recommended Fertilizer: <strong className="text-emerald-900 font-bold">{soilResult.prediction.recommendedFertilizer}</strong></span>
                  <span>NPK Ratio: <strong className="text-emerald-900 font-bold">{soilResult.prediction.npkRatio}</strong></span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* 2. CROP RECOMMENDATION ML MODEL */}
          <TabsContent value="crop" className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Soil Type</label>
                <select
                  value={cropInputs.soilType}
                  onChange={e => setCropInputs({ ...cropInputs, soilType: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="loamy">Loamy (दोमट)</option>
                  <option value="clayey">Clayey (चिकनी / धान)</option>
                  <option value="sandy">Sandy (बलुई)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Avg Temp (°C)</label>
                <input
                  type="number"
                  value={cropInputs.temperature}
                  onChange={e => setCropInputs({ ...cropInputs, temperature: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">pH Level</label>
                <input
                  type="number" step="0.1"
                  value={cropInputs.ph}
                  onChange={e => setCropInputs({ ...cropInputs, ph: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleCropPredict} size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5">
                <Sparkles size={13} /> {language === 'hi' ? 'सर्वश्रेष्ठ फसल चुनें' : 'Run Crop Model Prediction'}
              </Button>
            </div>

            {cropResult?.prediction && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sprout size={14} className="text-emerald-700" />
                    {language === 'hi' ? 'फसल अनुशंसा परिणाम' : 'Crop Model Recommendation Result'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-800 text-white text-[11px] font-bold capitalize">
                      Primary Crop: {cropResult.prediction.primaryCrop}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                      {cropResult.prediction.suitabilityScore}% Suitability
                    </span>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-900">
                  {language === 'hi' ? cropResult.prediction.advisoryHi : cropResult.prediction.advisoryEn}
                </p>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>Estimated Yield: <strong className="text-slate-900 font-bold">{cropResult.prediction.estimatedYieldTonsPerHectare} Tons/Hectare</strong></span>
                  <span>Top Alternatives: <strong className="text-slate-900 font-bold">{cropResult.prediction.topRecommendedCrops.map(c => c.crop).join(', ')}</strong></span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* 3. FARMER DISTRESS RISK ENGINE */}
          <TabsContent value="distress" className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rainfall Deficit (%)</label>
                <input
                  type="number"
                  value={distressInputs.rainfallDeviationPct}
                  onChange={e => setDistressInputs({ ...distressInputs, rainfallDeviationPct: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mandi Price Drop (%)</label>
                <input
                  type="number"
                  value={distressInputs.priceDropPct}
                  onChange={e => setDistressInputs({ ...distressInputs, priceDropPct: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Days to KCC Loan Due</label>
                <input
                  type="number"
                  value={distressInputs.daysToLoanDue}
                  onChange={e => setDistressInputs({ ...distressInputs, daysToLoanDue: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleDistressPredict} size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5">
                <Activity size={13} /> {language === 'hi' ? 'तनाव जोखिम की जांच करें' : 'Calculate Distress Risk Score'}
              </Button>
            </div>

            {distressResult && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                distressResult.tier === 'URGENT'
                  ? 'bg-red-50 border-red-200 text-red-950'
                  : distressResult.tier === 'ELEVATED'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    {distressResult.tier === 'URGENT' ? <AlertTriangle size={15} className="text-red-600" /> : <ShieldCheck size={15} className="text-emerald-700" />}
                    {language === 'hi' ? 'किसान तनाव आकलन' : 'Farmer Distress Assessment Score'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    distressResult.tier === 'URGENT' ? 'bg-red-600 text-white' : 'bg-emerald-800 text-white'
                  }`}>
                    {distressResult.score}/100 Risk Score ({distressResult.tier})
                  </span>
                </div>

                <p className="text-sm font-semibold">
                  {language === 'hi' ? distressResult.spokenReasons.hi : distressResult.spokenReasons.en}
                </p>

                <p className="text-xs font-medium opacity-90 pt-1 border-t border-black/10">
                  Advisory: {distressResult.actionableAdvisory}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
