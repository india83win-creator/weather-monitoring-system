import React from 'react';

export const SkeletonLoader = ({ type = 'current' }) => {
  const itemClass = "bg-slate-800/40 animate-pulse rounded-2xl border border-slate-700/20";

  if (type === 'current') {
    return (
      <div className={`${itemClass} p-6 md:p-8 space-y-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="h-8 bg-slate-700/50 rounded w-48" />
            <div className="h-4 bg-slate-700/30 rounded w-32" />
          </div>
          <div className="h-9 bg-slate-700/50 rounded-full w-28" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-6 py-4">
          <div className="h-24 bg-slate-700/50 rounded-2xl w-24" />
          <div className="space-y-3">
            <div className="h-16 bg-slate-700/50 rounded w-36" />
            <div className="h-6 bg-slate-700/30 rounded w-28" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700/20">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-3 bg-slate-800/20 rounded-xl space-y-2">
              <div className="h-3 bg-slate-700/30 rounded w-16" />
              <div className="h-5 bg-slate-700/50 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'hourly') {
    return (
      <div className={`${itemClass} p-6 space-y-4`}>
        <div className="h-6 bg-slate-700/50 rounded w-36" />
        <div className="flex gap-4 overflow-x-hidden pt-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-24 p-4 bg-slate-800/25 rounded-xl space-y-3 flex flex-col items-center">
              <div className="h-3 bg-slate-700/30 rounded w-10" />
              <div className="h-8 bg-slate-700/50 rounded-full w-8" />
              <div className="h-5 bg-slate-700/50 rounded w-12" />
              <div className="h-3 bg-slate-700/30 rounded w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'daily') {
    return (
      <div className={`${itemClass} p-6 space-y-4`}>
        <div className="h-6 bg-slate-700/50 rounded w-36" />
        <div className="flex gap-4 overflow-x-hidden pt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-36 p-5 bg-slate-800/25 rounded-xl space-y-3 flex flex-col items-center">
              <div className="h-4 bg-slate-700/40 rounded w-16" />
              <div className="h-10 bg-slate-700/50 rounded-full w-10" />
              <div className="h-4 bg-slate-700/30 rounded w-20" />
              <div className="h-6 bg-slate-700/50 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'favorites') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`${itemClass} p-5 space-y-4`}>
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-5 bg-slate-700/50 rounded w-24" />
                <div className="h-3 bg-slate-700/30 rounded w-16" />
              </div>
              <div className="h-8 bg-slate-700/50 rounded w-8" />
            </div>
            <div className="flex justify-between items-end pt-2">
              <div className="h-10 bg-slate-700/50 rounded w-16" />
              <div className="h-4 bg-slate-700/30 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;
