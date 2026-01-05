import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Stars, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

function AuthPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: ''
    });

    // Set initial state based on navigation state
    useEffect(() => {
        if (location.state && location.state.isLogin !== undefined) {
            setIsLogin(location.state.isLogin);
            setError(null);
        }
    }, [location.state]);

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(null);
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Basic Validation
        if (!isLogin && formData.password !== formData.confirm_password) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const endpoint = isLogin ? 'http://localhost:8000/login' : 'http://localhost:8000/register';
            const payload = isLogin
                ? { email: formData.email, password: formData.password }
                : {
                    full_name: formData.full_name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password
                };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Authentication failed');
            }

            // Success - Navigate
            // Success - Store User Info & Navigate
            if (data.user_id) localStorage.setItem('user_id', data.user_id);
            if (data.full_name) localStorage.setItem('full_name', data.full_name);
            localStorage.setItem('user_email', formData.email);

            if (isLogin) {
                navigate('/dashboard');
            } else {
                navigate('/onboarding');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500 selection:text-white flex flex-col">

            {/* Simple Navbar */}
            <nav className="absolute top-0 w-full z-50 p-6">
                <div className="container mx-auto flex justify-between items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm font-medium">Back to Home</span>
                    </button>
                </div>
            </nav>

            {/* Auth Container */}
            <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-violet-600/10 rounded-full blur-[120px]" />
                </div>

                <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 animate-fade-in-up">

                    <div className="text-center mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                            <Stars className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">
                            {isLogin ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p className="text-gray-400">
                            {isLogin ? 'Enter your details to access your account' : 'Start your career enhancement journey today'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="grid grid-cols-1 gap-5 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
                                    <input
                                        name="full_name"
                                        type="text"
                                        required={!isLogin}
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                            />
                        </div>

                        {!isLogin && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Phone Number</label>
                                <input
                                    name="phone"
                                    type="tel"
                                    required={!isLogin}
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+1 (555) 000-0000"
                                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
                            <input
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                            />
                        </div>

                        {!isLogin && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Re-enter Password</label>
                                <input
                                    name="confirm_password"
                                    type="password"
                                    required={!isLogin}
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-lg transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 mt-2 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <p className="text-gray-400">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={toggleMode}
                                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                            >
                                {isLogin ? 'Sign up' : 'Log in'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthPage;
