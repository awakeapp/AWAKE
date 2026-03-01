import React, { createContext, useContext, useState, useEffect } from 'react';

const ClockContext = createContext();

export const useClock = () => {
    return useContext(ClockContext);
};

export const ClockProvider = ({ children }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <ClockContext.Provider value={{ now }}>
            {children}
        </ClockContext.Provider>
    );
};
