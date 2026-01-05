import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';

function AppLayout() {
    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col selection:bg-blue-500 selection:text-white">
            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 md:ml-64 flex flex-col relative">
                    {/* Background Decor Shared */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                        <div className="absolute top-[5%] right-[20%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
                        <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px]" />
                    </div>

                    <div className="p-8 flex-1 relative z-10 w-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            <div className="md:ml-64 border-t border-white/10">
                <Footer />
            </div>
        </div>
    );
}

export default AppLayout;
