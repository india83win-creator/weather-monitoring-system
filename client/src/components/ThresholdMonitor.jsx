import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Settings, ShieldAlert, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { thresholdsService } from '../services/api';

const ThresholdMonitor = ({ activeCityName, activeCountryCode, activeLat, activeLon, thresholds, onRefreshThresholds }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [tempMaxEnabled, setTempMaxEnabled] = useState(false);
  const [tempMaxVal, setTempMaxVal] = useState('');

  const [tempMinEnabled, setTempMinEnabled] = useState(false);
  const [tempMinVal, setTempMinVal] = useState('');

  const [windMaxEnabled, setWindMaxEnabled] = useState(false);
  const [windMaxVal, setWindMaxVal] = useState('');

  const [aqiMaxEnabled, setAqiMaxEnabled] = useState(false);
  const [aqiMaxVal, setAqiMaxVal] = useState('3'); // Default 3 (Moderate)

  // Find active city threshold rule from global list
  const findActiveThreshold = () => {
    if (!thresholds || !activeCityName) return null;
    
    // Primary match: City Name + Country Code (case-insensitive)
    let found = thresholds.find(t => 
      t.city.toLowerCase() === activeCityName.toLowerCase() &&
      t.country.toLowerCase() === activeCountryCode.toLowerCase()
    );

    // Secondary fallback: lat/lon coordinates proximity (within 0.08 degree tolerance)
    if (!found && activeLat !== undefined && activeLon !== undefined) {
      found = thresholds.find(t => 
        Math.abs(t.lat - activeLat) < 0.08 &&
        Math.abs(t.lon - activeLon) < 0.08
      );
    }

    return found;
  };

  const activeThreshold = findActiveThreshold();

  // Load rules when active city or thresholds array changes
  useEffect(() => {
    if (activeThreshold) {
      setTempMaxEnabled(activeThreshold.tempMax !== null && activeThreshold.tempMax !== undefined);
      setTempMaxVal(activeThreshold.tempMax !== null && activeThreshold.tempMax !== undefined ? activeThreshold.tempMax.toString() : '');

      setTempMinEnabled(activeThreshold.tempMin !== null && activeThreshold.tempMin !== undefined);
      setTempMinVal(activeThreshold.tempMin !== null && activeThreshold.tempMin !== undefined ? activeThreshold.tempMin.toString() : '');

      setWindMaxEnabled(activeThreshold.windMax !== null && activeThreshold.windMax !== undefined);
      setWindMaxVal(activeThreshold.windMax !== null && activeThreshold.windMax !== undefined ? activeThreshold.windMax.toString() : '');

      setAqiMaxEnabled(activeThreshold.aqiMax !== null && activeThreshold.aqiMax !== undefined);
      setAqiMaxVal(activeThreshold.aqiMax !== null && activeThreshold.aqiMax !== undefined ? activeThreshold.aqiMax.toString() : '3');
    } else {
      // Reset form
      setTempMaxEnabled(false);
      setTempMaxVal('');
      setTempMinEnabled(false);
      setTempMinVal('');
      setWindMaxEnabled(false);
      setWindMaxVal('');
      setAqiMaxEnabled(false);
      setAqiMaxVal('3');
    }
  }, [activeCityName, activeCountryCode, activeLat, activeLon, thresholds]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!activeCityName) return;

    setIsSaving(true);
    setSuccessMsg('');

    const payload = {
      city: activeCityName,
      country: activeCountryCode,
      lat: activeLat,
      lon: activeLon,
      tempMax: tempMaxEnabled && tempMaxVal !== '' ? parseFloat(tempMaxVal) : null,
      tempMin: tempMinEnabled && tempMinVal !== '' ? parseFloat(tempMinVal) : null,
      windMax: windMaxEnabled && windMaxVal !== '' ? parseFloat(windMaxVal) : null,
      aqiMax: aqiMaxEnabled ? parseInt(aqiMaxVal) : null
    };

    try {
      await thresholdsService.saveThreshold(payload);
      setSuccessMsg('Monitoring rules saved!');
      if (onRefreshThresholds) {
        await onRefreshThresholds();
      }
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to save thresholds:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRules = async () => {
    if (!activeThreshold) return;
    setIsSaving(true);
    try {
      await thresholdsService.deleteThreshold(activeThreshold._id);
      setSuccessMsg('Monitoring rules disabled.');
      if (onRefreshThresholds) {
        await onRefreshThresholds();
      }
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to delete threshold rules:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const aqiLabels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];

  return (
    <div className="glass-card rounded-3xl p-6 text-white shadow-2xl space-y-4">
      {/* Toggle Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          {activeThreshold ? (
            <Bell className="w-5 h-5 text-emerald-400 fill-emerald-400/20 animate-pulse" />
          ) : (
            <BellOff className="w-5 h-5 text-slate-400" />
          )}
          <div>
            <h3 className="text-md font-bold text-slate-300">Custom Alert Rules</h3>
            <p className="text-[9px] text-slate-450 uppercase font-black tracking-widest mt-0.5">
              {activeThreshold ? 'Active Monitoring Rules' : 'No Active Rules'}
            </p>
          </div>
        </div>
        <button 
          className={`text-xs font-extrabold uppercase px-3 py-1 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 select-none pointer-events-none transition-colors ${isOpen ? 'text-sky-400' : ''}`}
          type="button"
        >
          {isOpen ? 'Collapse' : 'Configure'}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden space-y-4 pt-2 border-t border-white/5"
          >
            <form onSubmit={handleSave} className="space-y-4.5">
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Set active monitoring parameters for <span className="text-sky-300 font-extrabold">{activeCityName}</span>. A breach triggers visual warnings instantly.
              </p>

              {/* Rules Inputs */}
              <div className="space-y-3">
                {/* Temp Max */}
                <div className="flex items-center justify-between gap-3 p-2 bg-white/3 rounded-xl border border-white/3">
                  <label className="flex items-center gap-2 text-xs font-bold select-none cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={tempMaxEnabled}
                      onChange={(e) => setTempMaxEnabled(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500/20 cursor-pointer"
                    />
                    Max Temp
                  </label>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input 
                      type="number"
                      value={tempMaxVal}
                      onChange={(e) => setTempMaxVal(e.target.value)}
                      disabled={!tempMaxEnabled}
                      placeholder="40"
                      className="w-16 px-2 py-1 text-xs bg-slate-950/60 disabled:opacity-40 border border-slate-800 text-white rounded-lg focus:border-sky-500 outline-none transition-all text-center"
                    />
                    <span className="text-xs text-slate-400">°C</span>
                  </div>
                </div>

                {/* Temp Min */}
                <div className="flex items-center justify-between gap-3 p-2 bg-white/3 rounded-xl border border-white/3">
                  <label className="flex items-center gap-2 text-xs font-bold select-none cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={tempMinEnabled}
                      onChange={(e) => setTempMinEnabled(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500/20 cursor-pointer"
                    />
                    Min Temp
                  </label>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input 
                      type="number"
                      value={tempMinVal}
                      onChange={(e) => setTempMinVal(e.target.value)}
                      disabled={!tempMinEnabled}
                      placeholder="0"
                      className="w-16 px-2 py-1 text-xs bg-slate-950/60 disabled:opacity-40 border border-slate-800 text-white rounded-lg focus:border-sky-500 outline-none transition-all text-center"
                    />
                    <span className="text-xs text-slate-400">°C</span>
                  </div>
                </div>

                {/* Wind Max */}
                <div className="flex items-center justify-between gap-3 p-2 bg-white/3 rounded-xl border border-white/3">
                  <label className="flex items-center gap-2 text-xs font-bold select-none cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={windMaxEnabled}
                      onChange={(e) => setWindMaxEnabled(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500/20 cursor-pointer"
                    />
                    Max Wind Speed
                  </label>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input 
                      type="number"
                      value={windMaxVal}
                      onChange={(e) => setWindMaxVal(e.target.value)}
                      disabled={!windMaxEnabled}
                      placeholder="50"
                      className="w-16 px-2 py-1 text-xs bg-slate-950/60 disabled:opacity-40 border border-slate-800 text-white rounded-lg focus:border-sky-500 outline-none transition-all text-center"
                    />
                    <span className="text-xs text-slate-400">km/h</span>
                  </div>
                </div>

                {/* AQI Max */}
                <div className="flex items-center justify-between gap-3 p-2 bg-white/3 rounded-xl border border-white/3">
                  <label className="flex items-center gap-2 text-xs font-bold select-none cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={aqiMaxEnabled}
                      onChange={(e) => setAqiMaxEnabled(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500/20 cursor-pointer"
                    />
                    Max AQI Level
                  </label>
                  <select
                    value={aqiMaxVal}
                    onChange={(e) => setAqiMaxVal(e.target.value)}
                    disabled={!aqiMaxEnabled}
                    className="px-2 py-1 text-xs bg-slate-950 text-white border border-slate-800 rounded-lg focus:border-sky-500 disabled:opacity-40 outline-none cursor-pointer"
                  >
                    <option value="1">1 (Good)</option>
                    <option value="2">2 (Fair)</option>
                    <option value="3">3 (Moderate)</option>
                    <option value="4">4 (Poor)</option>
                    <option value="5">5 (Very Poor)</option>
                  </select>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                {successMsg && (
                  <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 pl-1.5">
                    <Check className="w-4 h-4 shrink-0" />
                    {successMsg}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2 px-4 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-extrabold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-sky-500/10 cursor-pointer transition-all text-center"
                  >
                    {isSaving ? 'Saving...' : 'Save Rules'}
                  </button>

                  {activeThreshold && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleDeleteRules}
                      className="py-2 px-4 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 font-extrabold uppercase tracking-wider text-xs rounded-xl cursor-pointer transition-all text-center"
                    >
                      Disable
                    </button>
                  )}
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThresholdMonitor;
