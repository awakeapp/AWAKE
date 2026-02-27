import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicle } from '../../context/VehicleContext';
import { 
    Car, ShieldAlert, Settings, Download, Archive, Trash2, List, 
    ChevronRight, ArrowLeft 
} from 'lucide-react';
import { SettingsList, SettingsSection, SettingsRow } from '../../components/ui/SettingsList';
import PageLayout from '../../components/layout/PageLayout';

const VehicleMore = () => {
    const navigate = useNavigate();
    const { 
        vehicles, 
        getActiveVehicle, 
        toggleArchiveVehicle, 
        deleteVehicle 
    } = useVehicle();
    
    const activeVehicle = getActiveVehicle();

    const handleExportCSV = () => {
        if (!activeVehicle) return;
        // Simplified export logic for this refactor
        alert("Exporting " + activeVehicle.name + " data as CSV...");
    };

    return (
        <PageLayout
            header={
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Vehicle More</h1>
                </div>
            }
        >
            <SettingsList>
                    <SettingsSection title="Management">
                        <SettingsRow 
                            icon={List} 
                            title="Manage Vehicles" 
                            subtitle={`${vehicles.length} Total Vehicles`}
                            onClick={() => navigate('/vehicle/dashboard?manage=true')} 
                        />
                        <SettingsRow 
                            icon={ShieldAlert} 
                            title="Insurance Details" 
                            subtitle="Coverage & expiry tracker"
                            onClick={() => alert("Insurance module coming soon")} 
                        />
                        <SettingsRow 
                            icon={Settings} 
                            title="Maintenance Templates" 
                            subtitle="Service intervals & checklists"
                            onClick={() => alert("Templates module coming soon")} 
                            isLast
                        />
                    </SettingsSection>

                    {activeVehicle && (
                        <SettingsSection title={activeVehicle.name}>
                            <SettingsRow 
                                icon={Download} 
                                title="Export Vehicle Data" 
                                subtitle="Download ledger as CSV"
                                onClick={handleExportCSV} 
                            />
                            <SettingsRow 
                                icon={Archive} 
                                title="Archive This Vehicle" 
                                isDanger
                                onClick={() => {
                                    if(window.confirm("Archive " + activeVehicle.name + "?")) {
                                        toggleArchiveVehicle(activeVehicle.id);
                                        navigate(-1);
                                    }
                                }} 
                            />
                            <SettingsRow 
                                icon={Trash2} 
                                title="Delete Vehicle" 
                                isDanger
                                isLast
                                onClick={() => {
                                    if(window.confirm("Are you sure? This is permanent.")) {
                                        deleteVehicle(activeVehicle.id);
                                        navigate('/vehicle/dashboard');
                                    }
                                }} 
                            />
                        </SettingsSection>
                    )}

                    <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 mt-8 font-bold tracking-widest uppercase">
                        AWAKE Vehicle Scoped Settings
                    </p>
                </SettingsList>
        </PageLayout>
    );
};

export default VehicleMore;
