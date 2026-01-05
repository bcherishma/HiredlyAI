import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    UserCheck,
    ArrowRight,
    TrendingUp,
    Mail
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function LandingPage() {
    const navigate = useNavigate();
    const handleSignup = () => navigate('/auth', { state: { isLogin: false } });

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">

            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-blue-600/20 rounded-full blur-[100px]" />
                    <div className="absolute top-[30%] right-[10%] w-72 h-72 bg-violet-600/20 rounded-full blur-[100px]" />
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center">


                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
                        Enhance your career <br className="hidden md:block" />
                        with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-blue-400 animate-gradient">AI</span>
                    </h1>

                    <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Stop guessing. Start getting hired. Our AI analyzes your profile, tailoring your resume
                        and interview prep to land you the job you deserve.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={handleSignup}
                            className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-lg transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-1 flex items-center gap-2"
                        >
                            Get Started for Free
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-gray-900 relative">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to <span className="text-blue-400">excel !!!</span></h2>
                        <p className="text-gray-400 text-lg">Comprehensive tools designed to give you the competitive edge in today's job market.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<FileText className="w-6 h-6 text-blue-400" />}
                            title="Smart Resume Builder"
                            description="Our AI rewrites your resume for each application to pass ATS filters and impress recruiters."
                        />
                        <FeatureCard
                            icon={<UserCheck className="w-6 h-6 text-violet-400" />}
                            title="Mock Interview Agent"
                            description="Practice with a voice-activated AI recruiter that gives real-time feedback on your answers."
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-6 h-6 text-pink-400" />}
                            title="Career Analytics"
                            description="Track your application progress and identify skill gaps preventing you from getting hired."
                        />
                    </div>
                </div>
            </section>

            {/* Social Proof / Stats */}
            <section className="py-24 border-y border-white/5 bg-gray-800/30">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                        <Stat number="Unlimited" label="Resumes Optimization" />
                        <Stat number="Improved" label="Interview Success Rate" />
                        <Stat number="Major" label="Companies Hiring" />
                        <Stat number="24/7" label="AI Availability" />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <div className="max-w-4xl mx-auto bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 p-12 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-violet-500" />

                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to accelerate your career?</h2>
                        <p className="text-gray-400 mb-8 max-w-xl mx-auto">Join thousands of job seekers using Hiredly AI to land their dream roles.</p>

                        <button
                            onClick={handleSignup}
                            className="px-8 py-4 rounded-full bg-white text-gray-900 font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg shadow-white/10"
                        >
                            Begin your Journey
                        </button>
                    </div>
                </div>
            </section>

            <Footer />

        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <div className="p-8 rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/30 transition-all hover:bg-gray-800 group">
            <div className="w-12 h-12 rounded-xl bg-gray-700/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 group-hover:text-blue-400 transition-colors">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{description}</p>
        </div>
    )
}

function Stat({ number, label }) {
    return (
        <div>
            <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-2">{number}</div>
            <div className="text-sm font-medium text-gray-400 uppercase tracking-widest">{label}</div>
        </div>
    )
}

export default LandingPage;
