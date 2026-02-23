import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { useRef, useEffect } from 'react';

const DateStrip = ({ selectedDate, onSelectDate }) => {
    // Generate ~2 weeks of dates around today or selected date
    // For simplicity, let's start from start of this week and show next 14 days
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday start
    const dates = Array.from({ length: 14 }, (_, i) => addDays(startDate, i));

    const scrollRef = useRef(null);

    // Scroll to selected date on mount? 
    // Implementation for later polish.

    return (
        <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar px-1 -webkit-overflow-scrolling-touch" ref={scrollRef}>
            {dates.map((date) => {
                const isSelected = isSameDay(date, new Date(selectedDate));
                const dayName = format(date, 'd');
                const weekDay = format(date, 'EEE');

                return (
                    <button
                        key={date.toISOString()}
                        onClick={() => onSelectDate(format(date, 'yyyy-MM-dd'))}
                        className={`flex flex-col items-center justify-center min-w-[3.5rem] h-[5rem] rounded-[20px] transition-colors flex-shrink-0 scroll-snap-align-start ${
                            isSelected
                                ? 'bg-[#4F46E5] text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-white text-slate-400 hover:bg-slate-50'
                        }`}
                    >
                        <span className={`text-[20px] font-bold leading-none mb-1 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                            {dayName}
                        </span>
                        <span className="text-xs font-medium">
                            {weekDay}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default DateStrip;
