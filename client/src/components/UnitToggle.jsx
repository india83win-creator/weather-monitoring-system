import React from 'react';

const UnitToggle = ({ unit, onChange }) => {
  return (
    <div className="relative flex items-center p-1 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-full w-28 h-9 shadow-inner select-none overflow-hidden">
      {/* Sliding Highlight Pill */}
      <div
        className={`absolute top-1 bottom-1 w-[50px] bg-sky-500 rounded-full transition-all duration-300 ease-out shadow-lg shadow-sky-500/20 ${
          unit === 'imperial' ? 'translate-x-[52px]' : 'translate-x-[2px]'
        }`}
      />

      {/* Metric Option */}
      <button
        onClick={() => onChange('metric')}
        className={`relative z-10 w-1/2 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
          unit === 'metric' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
        }`}
        type="button"
      >
        °C
      </button>

      {/* Imperial Option */}
      <button
        onClick={() => onChange('imperial')}
        className={`relative z-10 w-1/2 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
          unit === 'imperial' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
        }`}
        type="button"
      >
        °F
      </button>
    </div>
  );
};

export default UnitToggle;
