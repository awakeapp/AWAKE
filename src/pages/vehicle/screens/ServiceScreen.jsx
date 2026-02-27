import { useVehicle } from '../../../context/VehicleContext';
import { Settings, Calendar, History, Plus } from 'lucide-react';
import FollowUpList from '../../../components/organisms/vehicle/FollowUpList';
import { format } from 'date-fns';

const ServiceScreen = ({ activeVehicle, nextService, activeTab, setEditingVehicle, setIsAddOpen }) => {
    const { getVehicleStats, serviceRecords } = useVehicle();
    const stats = activeVehicle ? getVehicleStats(activeVehicle.id) : null;
    
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Next Service Countdown */}
            {nextService && (
                <section className="mt-2 mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white px-1 mb-2 text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Next Service Due
                    </h3>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-200 rounded-lg">
                                <Settings className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-indigo-900 dark:text-indigo-100 text-sm">{nextService.type}</p>
                                <p className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-0.5 max-w-[180px] break-words">
                                    {nextService.dueDate && `Due: ${format(new Date(nextService.dueDate), 'MMM d, yyyy')} `}
                                    {nextService.dueDate && nextService.dueOdometer && '| '}
                                    {nextService.dueOdometer && `At ${Number(nextService.dueOdometer).toLocaleString()} km`}
                                </p>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                            {nextService.dueDate && (
                                <div>
                                    <p className="font-bold text-indigo-900 dark:text-indigo-100 leading-none">
                                        {Math.max(0, Math.ceil((new Date(nextService.dueDate) - new Date()) / (1000 * 60 * 60 * 24)))}
                                    </p>
                                    <p className="text-[9px] text-indigo-600 dark:text-indigo-400 uppercase font-bold tracking-wider">Days</p>
                                </div>
                            )}
                            {nextService.dueOdometer && (
                                <div>
                                    <p className="font-bold text-indigo-900 dark:text-indigo-100 leading-none">
                                        {Math.max(0, Number(nextService.dueOdometer) - Number(activeVehicle?.odometer || 0)).toLocaleString()}
                                    </p>
                                    <p className="text-[9px] text-indigo-600 dark:text-indigo-400 uppercase font-bold tracking-wider">km left</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Upcoming List & Reminders via FollowUpList */}
             <FollowUpList vehicle={activeVehicle} />
             
             {/* Service Insight */}
            {stats?.lastServiceDate && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl flex items-start gap-3 border border-emerald-100 dark:border-emerald-800">
                    <div className="bg-emerald-100 dark:bg-emerald-800 p-2 rounded-full">
                        <History className="w-4 h-4 text-emerald-600 dark:text-white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm">Last Service</h4>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                            {stats.lastServiceType} on {format(new Date(stats.lastServiceDate), 'MMM d, yyyy')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceScreen;
