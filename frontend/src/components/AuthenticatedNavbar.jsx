import React, { useState, useEffect } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function AuthenticatedNavbar({ title, subtitle }) {
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [userName, setUserName] = useState('User');

    useEffect(() => {
        const storedName = localStorage.getItem('full_name');
        if (storedName) {
            setUserName(storedName);
        }
    }, []);

    const handleSignOut = () => {
        localStorage.removeItem('user_id');
        localStorage.removeItem('full_name');
        localStorage.removeItem('user_email');
        navigate('/');
    };

    return (
        <header className="flex justify-between items-center mb-10">
            <div>
                {title && (
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{title}</h1>
                )}
                {subtitle && (
                    <p className="text-gray-400 mt-1">{subtitle}</p>
                )}
            </div>

            <div className="relative z-50">
                <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-gray-800/50 border border-gray-700 hover:bg-gray-800 transition-colors"
                >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                        <User size={18} className="text-white" />
                    </div>
                    <span className="font-medium text-sm hidden sm:block text-white">{userName}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {isProfileOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 p-1">
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors text-left"
                        >
                            <User size={16} />
                            Profile
                        </button>
                        <div className="h-px bg-gray-700/50 my-1" />
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                        >
                            <LogOut size={16} />
                            Sign out
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}

export default AuthenticatedNavbar;
