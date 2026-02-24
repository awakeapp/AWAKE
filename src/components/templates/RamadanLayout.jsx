import React from 'react';
import { Outlet } from 'react-router-dom';
import RamadanBottomNav from '../ramadan/RamadanBottomNav';

const RamadanLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-black text-black dark:text-white font-sans transition-colors">
            <main 
                className="w-full max-w-screen-md mx-auto relative min-h-screen"
                style={{ 
                    paddingTop: 'env(safe-area-inset-top)',
                    paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))'
                }}
            >
                <div className="px-4 h-full">
                    {children || <Outlet />}
                </div>
            </main>
            <RamadanBottomNav />
        </div>
    );
};

export default RamadanLayout;
