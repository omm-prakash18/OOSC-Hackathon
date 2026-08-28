import React from 'react';

export default function BackgroundElements() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Topographic Contour Paths */}
      <svg className="absolute w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="contours" width="200" height="200" patternUnits="userSpaceOnUse">
            <path d="M 0 50 Q 50 20, 100 50 T 200 50 M 0 100 Q 50 70, 100 100 T 200 100 M 0 150 Q 50 120, 100 150 T 200 150" fill="none" stroke="#059669" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#contours)" />
      </svg>

      {/* Terraced Hillside Ridge Bands */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-50/40 via-emerald-50/10 to-transparent opacity-70" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-t from-emerald-100/30 via-emerald-50/10 to-transparent rounded-full blur-3xl opacity-50" />

      {/* Floating Micro Line-Art Motifs */}
      <div className="absolute top-20 left-[10%] opacity-20 text-emerald-800 animate-pulse">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </div>

      <div className="absolute top-40 right-[15%] opacity-20 text-emerald-800">
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>

      <div className="absolute bottom-32 left-[8%] opacity-20 text-emerald-800">
        <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V7" />
        </svg>
      </div>
    </div>
  );
}
