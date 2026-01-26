import { useState } from 'react';
import { useVehicle, MAINTENANCE_TEMPLATES } from '../../../context/VehicleContext';
import { differenceInDays, isBefore, addDays, format, parseISO } from 'date-fns';
import { Calendar, Gauge, CheckCircle, AlertTriangle, Plus, Clock, Settings } from 'lucide-react';
import CompleteFollowUpModal from './CompleteFollowUpModal';
import AddFollowUpModal from './AddFollowUpModal';

const FollowUpList = ({ vehicle }) => {
    const { followUps, completeFollowUp, deleteFollowUp, addFollowUp, getLatestRecord, toggleMaintenanceItem } = useVehicle();
    const [completeModalOpen, setCompleteModalOpen] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [selectedFollowUp, setSelectedFollowUp] = useState(null);

    // Filter for current vehicle
    const vehicleFollowUps = followUps.filter(f => f.vehicleId === vehicle.id && f.status !== 'completed');

    // Categorize
    const today = new Date();
    const overdue = [];
    const upcoming = [];
    const later = [];

    vehicleFollowUps.forEach(f => {
        let isOverdue = false;
        let isSoon = false;

        // Date check
        if ((f.frequencyType === 'date' || f.frequencyType === 'both') && f.dueDate) {
            const due = new Date(f.dueDate);
            if (isBefore(due, today)) isOverdue = true;
            else if (differenceInDays(due, today) <= 14) isSoon = true;
        }

        // Odometer check
        if ((f.frequencyType === 'odometer' || f.frequencyType === 'both') && f.dueOdometer) {
            const current = Number(vehicle.odometer) || 0;
            const due = Number(f.dueOdometer);
            if (current >= due) isOverdue = true;
            else if (due - current <= 500) isSoon = true;
        }

        const item = { ...f, isOverdue, isSoon };
        if (isOverdue) overdue.push(item);
        else if (isSoon) upcoming.push(item);
        else later.push(item);
    });

    // Sort by Due Date (approximate for odo)
    const sortFn = (a, b) => {
        // Simple sort: Date ones first if dates exist, else ID
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        return 0;
    };

    overdue.sort(sortFn);
    upcoming.sort(sortFn);
    later.sort(sortFn);

    const handleCompleteClick = (f) => {
        setSelectedFollowUp(f);
        setCompleteModalOpen(true);
    };

    const renderCard = (item, urgency) => (
        <div key={item.id} className={`bg-white dark:bg-slate-900 border rounded-xl p-3 mb-2 flex flex-col gap-2 shadow-sm ${urgency === 'overdue' ? 'border-red-200 dark:border-red-900/50' : urgency === 'upcoming' ? 'border-orange-200 dark:border-orange-900/50' : 'border-slate-100 dark:border-slate-800'}`}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${urgency === 'overdue' ? 'bg-red-100 text-red-600' : urgency === 'upcoming' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                        {item.frequencyType === 'date' ? <Calendar className="w-4 h-4" /> : <Gauge className="w-4 h-4" />}
                    </span>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.type}</h4>
                        <div className={`text-[10px] font-semibold flex flex-col ${urgency === 'overdue' ? 'text-red-500' : urgency === 'upcoming' ? 'text-orange-500' : 'text-slate-400'}`}>
                            {(item.frequencyType === 'date' || item.frequencyType === 'both') && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5" />
                                    {item.dueDate ? `Due ${format(parseISO(item.dueDate), 'MMM d, yyyy')}` : 'No date set'}
                                </span>
                            )}
                            {(item.frequencyType === 'odometer' || item.frequencyType === 'both') && (
                                <span className="flex items-center gap-1">
                                    <Gauge className="w-2.5 h-2.5" />
                                    {`Due at ${Number(item.dueOdometer).toLocaleString()} km`}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {item.isRecurring && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300">Recurring</span>}
            </div>

            <div className="flex justify-between items-end mt-1">
                <div>
                    {(() => {
                        const last = getLatestRecord(vehicle.id, item.type);
                        if (last) return (
                            <p className="text-[9px] text-slate-400 font-medium">
                                Last: {format(parseISO(last.date), 'MMM d, yyyy')} {last.odometer ? `(${Number(last.odometer).toLocaleString()} km)` : ''}
                            </p>
                        );
                        return null;
                    })()}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => deleteFollowUp(item.id)}
                        className="text-xs text-slate-400 hover:text-red-500 px-2 py-1"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={() => handleCompleteClick(item)}
                        className="flex items-center gap-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                    >
                        <CheckCircle className="w-3 h-3" /> Done
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white">Reminders & Service</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setConfigModalOpen(true)}
                        className="text-slate-600 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                    >
                        <Settings className="w-3 h-3" /> Manage
                    </button>
                    <button
                        onClick={() => setAddModalOpen(true)}
                        className="text-indigo-600 text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                    >
                        <Plus className="w-3 h-3" /> Add
                    </button>
                </div>
            </div>

            {configModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Standard Maintenance</h3>
                            <p className="text-xs text-slate-500 mt-1">Select items to track for your vehicle.</p>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-2">
                            {MAINTENANCE_TEMPLATES.filter(t => !t.applicable || t.applicable.includes(vehicle.type)).map(template => {
                                const isEnabled = followUps.some(f => f.vehicleId === vehicle.id && f.type === template.type && f.status !== 'completed');
                                return (
                                    <button
                                        key={template.type}
                                        onClick={() => toggleMaintenanceItem(vehicle.id, template)}
                                        className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border ${isEnabled
                                            ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                                            : 'bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700 opacity-60'}`}
                                    >
                                        <div className="text-left">
                                            <p className={`font-bold text-sm ${isEnabled ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {template.type}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                {template.frequencyType === 'both' ? `Every ${template.frequencyValue} ${template.frequencyUnit} / ${template.odometerValue}km` :
                                                    template.frequencyType === 'date' ? `Every ${template.frequencyValue} ${template.frequencyUnit}` :
                                                        template.frequencyType === 'odometer' ? `Every ${template.odometerValue}km` : 'Ad-hoc'}
                                            </p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isEnabled ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                                            {isEnabled && <CheckCircle className="w-3 h-3 text-white" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
                            <button onClick={() => setConfigModalOpen(false)} className="w-full bg-slate-900 text-white dark:bg-indigo-600 font-bold py-3 rounded-2xl">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {vehicleFollowUps.length === 0 && (
                <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No active reminders.</p>
                    <button onClick={() => setAddModalOpen(true)} className="text-indigo-500 text-xs font-bold mt-1">Set one up</button>
                </div>
            )}

            {overdue.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Overdue
                    </h4>
                    {overdue.map(item => renderCard(item, 'overdue'))}
                </div>
            )}

            {upcoming.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">Due Soon</h4>
                    {upcoming.map(item => renderCard(item, 'upcoming'))}
                </div>
            )}

            {later.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Upcoming</h4>
                    {later.map(item => renderCard(item, 'later'))}
                </div>
            )}

            <CompleteFollowUpModal
                isOpen={completeModalOpen}
                onClose={() => setCompleteModalOpen(false)}
                followUp={selectedFollowUp}
                vehicle={vehicle}
                onComplete={completeFollowUp}
            />

            <AddFollowUpModal
                isOpen={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                vehicle={vehicle}
                onSave={addFollowUp}
            />
        </div>
    );
};

export default FollowUpList;
