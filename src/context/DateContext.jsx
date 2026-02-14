import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const DateContext = createContext();

export const useDate = () => {
    const context = useContext(DateContext);
    if (!context) {
        throw new Error('useDate must be used within a DateContextProvider');
    }
    return context;
};

export const DateContextProvider = ({ children }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Helper: Get local Date object normalized to 00:00:00
    const getLocalToday = () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    };

    // Helper: Parse YYYY-MM-DD string to local Date 00:00:00
    const parseLocalDate = (dateStr) => {
        if (!dateStr) return null;
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    // Helper: Format local Date to YYYY-MM-DD
    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Initialize State
    const getInitialDate = () => {
        const dateParam = searchParams.get('date');
        if (dateParam) {
            const parsed = parseLocalDate(dateParam);
            // Verify validity and future guard
            if (parsed && parsed <= getLocalToday()) {
                return parsed;
            }
        }
        return getLocalToday();
    };

    const [currentDate, setCurrentDate] = useState(getInitialDate);

    // Sync URL when date changes
    useEffect(() => {
        const dateString = formatLocalDate(currentDate);
        setSearchParams({ date: dateString });
    }, [currentDate, setSearchParams]);

    const setDate = useCallback((dateOrString) => {
        let newDate;
        if (typeof dateOrString === 'string') {
            newDate = parseLocalDate(dateOrString);
        } else {
            newDate = new Date(dateOrString);
            newDate.setHours(0, 0, 0, 0);
        }

        const today = getLocalToday();

        // Prevent future dates
        if (newDate > today) {
            console.warn('Cannot navigate to future date');
            return;
        }
        setCurrentDate(newDate);
    }, []); // getLocalToday and parseLocalDate are stable utils (defined outside or inside? They are inside, need to move out or memoize)

    // Move utils inside component to be stable or use ref? 
    // Actually, getLocalToday creates new object. 
    // Let's rely on state.

    const prevDay = useCallback(() => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() - 1);
            return newDate;
        });
    }, []);

    const nextDay = useCallback(() => {
        setCurrentDate(prev => {
            const today = getLocalToday();
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() + 1);
            if (newDate > today) return prev;
            return newDate;
        });
    }, []);

    const jumpToToday = useCallback(() => {
        setCurrentDate(getLocalToday());
    }, []);

    const formattedDate = useMemo(() => formatLocalDate(currentDate), [currentDate]);
    const maxDate = useMemo(() => formatLocalDate(getLocalToday()), []);

    const isToday = currentDate.getTime() === getLocalToday().getTime();
    const isPastDate = currentDate < getLocalToday();

    const value = useMemo(() => ({
        currentDate,
        formattedDate,
        isToday,
        isPast: isPastDate,
        setDate,
        prevDay,
        nextDay,
        jumpToToday,
        maxDate
    }), [currentDate, formattedDate, isToday, isPastDate, setDate, prevDay, nextDay, jumpToToday, maxDate]);

    return (
        <DateContext.Provider value={value}>
            {children}
        </DateContext.Provider>
    );
};
