import React from 'react';
import { Stars } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Navbar({ showAuthButtons = true }) {
    const navigate = useNavigate();

    const handleLogin = () => navigate('/auth', { state: { isLogin: true } });
    const handleSignup = () => navigate('/auth', { state: { isLogin: false } });

    return (
        <nav className="fixed top-0 w-full z-50 bg-gray-900/80 backdrop-blur-md border-b border-white/10">
            <div className="container mx-auto px-6 h-16 flex justify-between items-center relative">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center">
                        <Stars className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">Hiredly</span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <a href="#" className="hover:text-white transition-colors">Features</a>
                    <a href="#" className="hover:text-white transition-colors">How it Works</a>
                </div>

                <div className="flex items-center gap-4">
                    {showAuthButtons && (
                        <>
                            <button
                                onClick={handleLogin}
                                className="hidden sm:block text-sm font-medium text-gray-300 hover:text-white transition-colors"
                            >
                                Log in
                            </button>
                            <button
                                onClick={handleSignup}
                                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                            >
                                Sign up
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
