import React from 'react';
import { AlertTriangle, ShieldCheck, HelpCircle, Activity } from 'lucide-react';
import { calculateDistressScore } from '../engine/distressEngine';

export default function DistressCard({
  cropType = 'wheat',
  cropStage = 'vegetative',
  daysToLoanDue = 15,
  rainfallDeviationPct = -35,
  priceDropPct = -20,
  conversationMessages = []
}) {
  const result = calculateDistressScore({
    rainfallDeviationPct,
    priceDropPct,
    daysToLoanDue,
    cropType,
    cropStage
  });

  const isUrgent = result.tier === 'URGENT';
  const isElevated = result.tier === 'ELEVATED';

  return (
    <div className={`rounded-2xl p-5 border transition-all ${
      isUrgent
        ? 'bg-red-50/90 border-red-200 text-red-950 shadow-md'
        : isElevated
        ? 'bg-amber-50/90 border-amber-200 text-amber-950 shadow-sm'
        : 'bg-white border-slate-200 text-slate-900 shadow-xs'
    }`}>
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-black/5">
        <div className="flex items-center gap-2">
          {isUrgent ? (
            <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
          ) : isElevated ? (
            <Activity className="w-5 h-5 text-amber-600" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          )}
          <span className="font-bold text-xs uppercase tracking-wider">
            Farmer Distress Risk Assessment Engine
          </span>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wide ${
          isUrgent
            ? 'bg-red-600 text-white'
            : isElevated
            ? 'bg-amber-600 text-white'
            : 'bg-emerald-100 text-emerald-800'
        }`}>
          {result.score}/100 • {result.tier}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-sm font-semibold leading-relaxed">
          {result.spokenReasons.hi}
        </p>
        <p className="text-xs text-slate-600 leading-normal">
          {result.spokenReasons.en}
        </p>
      </div>

      <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between text-xs font-medium">
        <span className="text-slate-500">
          Target Crop: <strong className="text-slate-800 capitalize">{cropType}</strong>
        </span>
        <span className="text-slate-500">
          Loan Repayment Due: <strong className="text-slate-800">{daysToLoanDue} days</strong>
        </span>
      </div>
    </div>
  );
}
