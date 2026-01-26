import { useState } from 'react';
import { X, Save, Calendar, Gauge, Repeat, AlertCircle } from 'lucide-react';

const FOLLOW_UP_TYPES = [
    'Refuel', 'Servicing', 'Oil Change', 'Tyre Change',
    'Insurance Renewal', 'Pollution Check', 'Registration Renewal',
    'Repair', 'Custom'
];

const AddFollowUpModal = ({ isOpen, onClose, onSave, vehicle }) => {
    const [formData, setFormData] = useState({
        type: 'Servicing',
        customType: '',
        triggerType: 'date', // date, odometer
        date: '',
        odometer: '',
        isRecurring: false,
        frequencyValue: 3,
        frequencyUnit: 'months', // days, months, years
        frequencyOdo: 3000
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (formData.triggerType === 'date' && !formData.date) return;
        if (formData.triggerType === 'odometer' && !formData.odometer) return;

        const submission = {
            type: formData.type === 'Custom' ? formData.customType : formData.type,
            vehicleId: vehicle.id,
            status: 'pending',
            isRecurring: formData.isRecurring
        };

        if (formData.triggerType === 'date') {
            submission.frequencyType = 'date';
            submission.dueDate = formData.date;
            if (formData.isRecurring) {
                submission.frequencyValue = formData.frequencyValue;
                submission.frequencyUnit = formData.frequencyUnit;
            }
        } else {
            submission.frequencyType = 'odometer';
            submission.dueOdometer = formData.odometer;
            if (formData.isRecurring) {
                submission.frequencyValue = formData.frequencyOdo; // For odometer reuse 'frequencyValue' but context handles logic
            }
        }

        onSave(submission);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Reminder</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Type Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Event Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                        >
                            {FOLLOW_UP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {formData.type === 'Custom' && (
                            <input
                                type="text"
                                placeholder="Enter custom event name"
                                value={formData.customType}
                                onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                                className="mt-2 w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                                required
                            />
                        )}
                    </div>

                    {/* Trigger Type Toggle */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, triggerType: 'date' })}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.triggerType === 'date' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
                        >
                            Date Based
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, triggerType: 'odometer' })}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.triggerType === 'odometer' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
                        >
                            Odometer Based
                        </button>
                    </div>

                    {/* Trigger Inputs */}
                    {formData.triggerType === 'date' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="recurring_date"
                                    checked={formData.isRecurring}
                                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="recurring_date" className="flex-1 text-sm font-medium text-indigo-900 dark:text-indigo-200">
                                    Recurring Event
                                </label>
                            </div>

                            {formData.isRecurring && (
                                <div className="flex gap-2 items-center animate-in slide-in-from-top-2">
                                    <span className="text-sm font-bold text-slate-500">Every</span>
                                    <input
                                        type="number"
                                        value={formData.frequencyValue}
                                        onChange={(e) => setFormData({ ...formData, frequencyValue: e.target.value })}
                                        className="w-20 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-center font-bold"
                                    />
                                    <select
                                        value={formData.frequencyUnit}
                                        onChange={(e) => setFormData({ ...formData, frequencyUnit: e.target.value })}
                                        className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-sm font-bold"
                                    >
                                        <option value="days">Days</option>
                                        <option value="months">Months</option>
                                        <option value="years">Years</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Odometer (km)</label>
                                <div className="text-xs text-slate-400 mb-2">Current: {vehicle.odometer} km</div>
                                <input
                                    type="number"
                                    required
                                    placeholder={Number(vehicle.odometer) + 3000}
                                    value={formData.odometer}
                                    onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="recurring_odo"
                                    checked={formData.isRecurring}
                                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="recurring_odo" className="flex-1 text-sm font-medium text-indigo-900 dark:text-indigo-200">
                                    Recurring Event
                                </label>
                            </div>

                            {formData.isRecurring && (
                                <div className="flex gap-2 items-center animate-in slide-in-from-top-2">
                                    <span className="text-sm font-bold text-slate-500">Every</span>
                                    <input
                                        type="number"
                                        placeholder="3000"
                                        value={formData.frequencyOdo}
                                        onChange={(e) => setFormData({ ...formData, frequencyOdo: e.target.value })}
                                        className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-center font-bold"
                                    />
                                    <span className="text-sm font-bold text-slate-500">km</span>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl mt-4 transition-colors flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Set Reminder
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddFollowUpModal;
