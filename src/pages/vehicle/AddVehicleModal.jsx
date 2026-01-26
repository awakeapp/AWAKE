import { useState, useEffect } from 'react';
import { X, Save, Car, Bike, Truck } from 'lucide-react';

const VEHICLE_TYPES = [
    { id: 'car', label: 'Car', icon: Car },
    { id: 'bike', label: 'Bike', icon: Bike },
    { id: 'scooter', label: 'Scooter', icon: Bike },
    { id: 'commercial', label: 'Commercial', icon: Truck },
];

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];

const AddVehicleModal = ({ isOpen, onClose, onSave, editVehicle = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'car',
        brandModel: '',
        regNumber: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        fuelType: 'Petrol',
        odometer: ''
    });

    useEffect(() => {
        if (editVehicle) {
            setFormData({
                name: editVehicle.name,
                type: editVehicle.type,
                brandModel: editVehicle.brandModel,
                regNumber: editVehicle.regNumber || '',
                purchaseDate: editVehicle.purchaseDate,
                fuelType: editVehicle.fuelType,
                odometer: editVehicle.odometer
            });
        } else {
            setFormData({
                name: '',
                type: 'car',
                brandModel: '',
                regNumber: '',
                purchaseDate: new Date().toISOString().split('T')[0],
                fuelType: 'Petrol',
                odometer: ''
            });
        }
    }, [editVehicle, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {editVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Vehicle Type Selection */}
                    <div className="grid grid-cols-4 gap-2">
                        {VEHICLE_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isSelected = formData.type === type.id;
                            return (
                                <button
                                    type="button"
                                    key={type.id}
                                    onClick={() => setFormData({ ...formData, type: type.id })}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${isSelected
                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-500 dark:text-indigo-400'
                                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                        }`}
                                >
                                    <Icon className="w-6 h-6 mb-1" />
                                    <span className="text-[10px] font-bold">{type.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vehicle Name (Nickname)</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. My Red Racer"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Brand & Model</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Honda City 2022"
                            value={formData.brandModel}
                            onChange={(e) => setFormData({ ...formData, brandModel: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reg. Number (Optional)</label>
                            <input
                                type="text"
                                placeholder="KL-01-AB-1234"
                                value={formData.regNumber}
                                onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fuel Type</label>
                            <select
                                value={formData.fuelType}
                                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                {FUEL_TYPES.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Purchase Date</label>
                            <input
                                type="date"
                                required
                                value={formData.purchaseDate}
                                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Odometer (km)</label>
                            <input
                                type="number"
                                required
                                placeholder="0"
                                value={formData.odometer}
                                onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl mt-4 transition-colors flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        {editVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddVehicleModal;
