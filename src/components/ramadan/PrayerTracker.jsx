import React from 'react';
import clsx from 'clsx';
import { useRamadan } from '../../context/RamadanContext';
import { CheckCircle2, Circle } from 'lucide-react';

const PRAYERS = [
    { key: 'fajr',   label: 'Fajr',   allowMode: true },
    { key: 'dhuhr',  label: 'Dhuhr',  allowMode: true },
    { key: 'asr',    label: 'Asr',    allowMode: true },
    { key: 'maghrib',label: 'Maghrib',allowMode: true },
    { key: 'isha',   label: 'Isha',   allowMode: true },
];

const EXTRA_PRAYERS = [
    { key: 'taraweeh', label: 'Taraweeh',  allowMode: true,  allowCount: false },
    { key: 'tahajjud', label: 'Tahajjud',  allowMode: true,  allowCount: false },
    { key: 'duha',     label: 'Duha',       allowMode: false, allowCount: false },
    { key: 'rawatib',  label: 'Rawatib',    allowMode: false, allowCount: true  },
];

const ModeSelector = ({ value, onChange }) => (
    <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-lg p-0.5 gap-0.5">
        {['jamaah', 'alone'].map(m => (
            <button
                key={m}
                onClick={() => onChange(m)}
                className={clsx(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all capitalize",
                    value === m
                        ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                        : "text-slate-500 dark:text-slate-400"
                )}
            >
                {m === 'jamaah' ? "Jama'ah" : 'Alone'}
            </button>
        ))}
    </div>
);

const PrayerRow = ({ prayerKey, label, data, onUpdate, allowMode, allowCount, isLast }) => {
    const completed = data[prayerKey] || false;
    const mode = data[`${prayerKey}Mode`] || 'jamaah';
    const count = data[`${prayerKey}Count`] || 0;

    return (
        <div className={clsx(
            "flex items-center justify-between py-3 px-0 transition-colors",
            !isLast && "border-b border-slate-100 dark:border-[#38383A]"
        )}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                    onClick={() => onUpdate(prayerKey, !completed)}
                    className={clsx(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all",
                        completed
                            ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/30"
                            : "border-2 border-slate-300 dark:border-slate-600 text-transparent"
                    )}
                >
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <span className={clsx(
                    "text-[15px] font-medium leading-tight",
                    completed ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                )}>
                    {label}
                </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {allowCount && completed && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onUpdate(`${prayerKey}Count`, Math.max(0, count - 1))}
                            className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold flex items-center justify-center"
                        >−</button>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-5 text-center">{count}</span>
                        <button
                            onClick={() => onUpdate(`${prayerKey}Count`, count + 1)}
                            className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold flex items-center justify-center"
                        >+</button>
                    </div>
                )}
                {allowMode && (
                    <ModeSelector value={mode} onChange={(m) => onUpdate(`${prayerKey}Mode`, m)} />
                )}
            </div>
        </div>
    );
};

/**
 * PrayerTracker — tracks all 5 daily + 4 additional prayers.
 * Fajr, Dhuhr, Asr, Maghrib, Isha (completed + Jamaah/Alone)
 * Taraweeh, Tahajjud (completed + Jamaah/Alone)
 * Duha, Rawatib (completed, Rawatib has count)
 */
const PrayerTracker = () => {
    const { ramadanData, updateRamadanDay, hijriDate } = useRamadan();
    const todayKey = new Date().toLocaleDateString('en-CA');
    const todayData = ramadanData?.days?.[todayKey] || {};

    const handleUpdate = (field, value) => {
        updateRamadanDay(todayKey, { [field]: value });
    };

    if (!hijriDate?.isRamadan) return null;

    return (
        <div className="space-y-6">
            {/* 5 Daily Prayers */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-xl sm:rounded-2xl border border-slate-200 dark:border-[#2C2C2E] shadow-sm dark:shadow-none overflow-hidden">
                <div className="px-5 pt-4 pb-2">
                    <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Daily Prayers
                    </h2>
                </div>
                <div className="px-5 pb-2">
                    {PRAYERS.map((p, idx) => (
                        <PrayerRow
                            key={p.key}
                            prayerKey={p.key}
                            label={p.label}
                            data={todayData}
                            onUpdate={handleUpdate}
                            allowMode={p.allowMode}
                            allowCount={false}
                            isLast={idx === PRAYERS.length - 1}
                        />
                    ))}
                </div>
            </div>

            {/* Night & Additional Prayers */}
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-2">
                    <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Night &amp; Additional Prayers
                    </h2>
                </div>
                <div className="px-5 pb-2">
                    {EXTRA_PRAYERS.map((p, idx) => (
                        <PrayerRow
                            key={p.key}
                            prayerKey={p.key}
                            label={p.label}
                            data={todayData}
                            onUpdate={handleUpdate}
                            allowMode={p.allowMode}
                            allowCount={p.allowCount}
                            isLast={idx === EXTRA_PRAYERS.length - 1}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PrayerTracker;
