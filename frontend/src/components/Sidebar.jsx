import React from 'react';
import { LayoutDashboard, User, Mic, Stars } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="w-64 border-r border-white/10 bg-gray-900/50 backdrop-blur-xl fixed h-full z-20 hidden md:flex flex-col">
            <div className="p-6 h-16 flex items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center">
                        <Stars className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">Hiredly</span>
                </div>
            </div>

            <nav className="mt-6 px-4 space-y-2 flex-1">
                <NavItem
                    icon={<LayoutDashboard size={20} />}
                    label="Dashboard"
                    active={isActive('/dashboard')}
                    onClick={() => navigate('/dashboard')}
                />
                <NavItem
                    icon={<Mic size={20} />}
                    label="Interview Prep"
                    active={isActive('/interview-prep')}
                    onClick={() => navigate('/interview-prep')}
                />
                <NavItem
                    icon={<User size={20} />}
                    label="Profile"
                    active={isActive('/profile')}
                    onClick={() => navigate('/profile')}
                />
            </nav>
        </aside>
    );
}

function NavItem({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
                ? 'bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
        >
            {icon}
            <span className="font-medium">{label}</span>
        </button>
    )
}

export default Sidebar;
