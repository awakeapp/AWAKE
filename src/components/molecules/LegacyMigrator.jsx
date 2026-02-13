import { useState } from 'react';
import { useAuthContext } from '../../hooks/useAuthContext';
import { FirestoreService } from '../../services/firestore-service';
import Button from '../atoms/Button';
import { CloudUpload, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../atoms/Card';

const LegacyMigrator = () => {
    const { user } = useAuthContext();
    const [status, setStatus] = useState('idle'); // idle, scanning, migrating, done, error
    const [stats, setStats] = useState({ keysFound: 0, keysMigrated: 0 });

    const handleBackup = async () => {
        if (!user) return;
        setStatus('migrating');

        try {
            // 1. Identify candidate keys
            const keysToBackup = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                // Filter out system or irrelevant keys
                if (key === 'theme' || key === 'firebase:authUser' || key.startsWith('firebase:')) continue;
                keysToBackup.push(key);
            }

            setStats(prev => ({ ...prev, keysFound: keysToBackup.length }));

            if (keysToBackup.length === 0) {
                setStatus('done');
                return;
            }

            // 2. Upload to Firestore under a backup path
            // users/{uid}/legacy_backup/{key}
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
                    key, // Document ID is the localStorage key
                    {
                        key: key,
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
            <Card className="border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-900/10">
                <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Backup Complete</p>
                        <p className="text-xs text-emerald-600/80">Successfully saved {stats.keysMigrated} local data items to the cloud.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-amber-100 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-900/10">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Device Data Backup</p>
                            <p className="text-xs text-slate-500 mt-1">
                                If you have data on this device from before the update, click below to upload it to the cloud so it's not lost.
                            </p>
                        </div>
                        <Button
                            size="sm"
                            onClick={handleBackup}
                            isLoading={status === 'migrating'}
                            variant="default"
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white border-none"
                        >
                            <CloudUpload className="w-4 h-4 mr-2" />
                            {status === 'migrating' ? 'Backing up...' : 'Sync Local Data to Cloud'}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default LegacyMigrator;
