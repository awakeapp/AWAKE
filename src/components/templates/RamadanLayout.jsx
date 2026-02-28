import React from 'react';
import { Outlet } from 'react-router-dom';
import RamadanBottomNav from '../ramadan/RamadanBottomNav';

const RamadanLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-black text-black dark:text-white font-sans transition-colors relative">
            {/* The individual pages use PageLayout which handles max-width and internal padding */}
            {children || <Outlet />}
            <RamadanBottomNav />
        </div>
    );
};

export default RamadanLayout;
