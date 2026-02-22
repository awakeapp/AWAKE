import { useState } from 'react';
import { useAuthContext } from '../../hooks/useAuthContext';
import { FirestoreService } from '../../services/firestore-service';
import { CloudUpload, CheckCircle, Database } from 'lucide-react';
import clsx from 'clsx';

const LegacyMigrator = () => {
    const { user } = useAuthContext();
    const [status, setStatus] = useState('idle'); // idle, migrating, done, error
    const [stats, setStats] = useState({ keysFound: 0, keysMigrated: 0 });

    const handleBackup = async () => {
        if (!user || status === 'migrating') return;
        setStatus('migrating');

        try {
            const keysToBackup = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key === 'theme' || key === 'firebase:authUser' || key.startsWith('firebase:')) continue;
                keysToBackup.push(key);
            }

            setStats(prev => ({ ...prev, keysFound: keysToBackup.length }));

            if (keysToBackup.length === 0) {
                setStatus('done');
                return;
            }

            const backupPromises = keysToBackup.map(async (key) => {
                const rawValue = localStorage.getItem(key);
                let parsedValue = rawValue;
                try {
                    parsedValue = JSON.parse(rawValue);
                } catch (e) {
                    // keep as string
                }

                await FirestoreService.setItem(
                    `users/${user.uid}/legacy_backup`,
                    key,
                    {
                        key,
                        value: parsedValue,
                        backedUpAt: Date.now(),
                        deviceAgent: navigator.userAgent
                    }
                );
            });

            await Promise.all(backupPromises);
            setStats(prev => ({ ...prev, keysMigrated: keysToBackup.length }));
            setStatus('done');
        } catch (error) {
            console.error("Backup failed", error);
            setStatus('error');
        }
    };

    if (status === 'done') {
        return (
            <div className="flex items-center justify-between px-4 min-h-[56px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/60 last:border-none">
                <div className="flex items-center gap-4">
                    <div className="text-emerald-500 shrink-0">
                        <CheckCircle strokeWidth={2} className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <div className="text-left py-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">Backup Complete</p>
                        <p className="text-xs text-slate-500 mt-0.5">Successfully saved {stats.keysMigrated || 'all'} items to cloud.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between px-4 min-h-[56px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/60 last:border-none">
            <div className="flex items-center gap-4 py-2">
                <div className="text-slate-400 shrink-0">
                    <Database strokeWidth={2} className="w-5 h-5 flex-shrink-0" />
                </div>
                <div className="text-left pr-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">Sync Local Data</p>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate sm:max-w-none">Upload device data to cloud backup</p>
                </div>
            </div>
            <div className="shrink-0">
                <button
                    onClick={handleBackup}
                    disabled={status === 'migrating'}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap",
                        status === 'migrating' 
                            ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-400 cursor-not-allowed"
                            : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm"
                    )}
                >
                    <CloudUpload className="w-4 h-4" />
                    {status === 'migrating' ? 'Syncing...' : 'Sync Now'}
                </button>
            </div>
        </div>
    );
};

export default LegacyMigrator;
