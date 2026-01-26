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

    const isToday = () => {
        return currentDate.getTime() === getLocalToday().getTime();
    };

    const setDate = (dateOrString) => {
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
    };

    const prevDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() - 1);
        setDate(newDate);
    };

    const nextDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 1);

        if (newDate > getLocalToday()) return; // Strict block
        setDate(newDate);
    };

    const jumpToToday = () => {
        setCurrentDate(getLocalToday());
    };

    const formattedDate = formatLocalDate(currentDate);

    // Provide maxDate for pickers
    const maxDate = formatLocalDate(getLocalToday());

    const isPast = () => {
        return currentDate < getLocalToday();
    };

    const value = useMemo(() => ({
        currentDate,
        formattedDate,
        isToday: isToday(),
        isPast: isPast(),
        setDate,
        prevDay,
        nextDay,
        jumpToToday,
        maxDate
    }), [currentDate, formattedDate, maxDate]);

    return (
        <DateContext.Provider value={value}>
            {children}
        </DateContext.Provider>
    );
};
