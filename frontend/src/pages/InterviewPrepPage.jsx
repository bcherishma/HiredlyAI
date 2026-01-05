import React, { useState, useEffect } from 'react';
import { Mic, Brain, Clock, ChevronRight, Play } from 'lucide-react';
import AuthenticatedNavbar from '../components/AuthenticatedNavbar';

function InterviewPrepPage() {
    const [stats, setStats] = useState({
        sessions_completed: 0,
        practice_time: "0m",
        avg_score: "-"
    });

    const [history, setHistory] = useState([]);

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (userId) {
            // Fetch Stats
            fetch(`http://localhost:8000/api/interview/stats/${userId}`)
                .then(res => res.json())
                .then(data => setStats(data))
                .catch(err => console.error("Failed to fetch stats:", err));

            // Fetch History
            fetch(`http://localhost:8000/api/interview/history/${userId}`)
                .then(res => res.json())
                .then(data => setHistory(data))
                .catch(err => console.error("Failed to fetch history:", err));
        }
    }, []);

    return (
        <div className="flex flex-col h-full">
            <AuthenticatedNavbar
                title="Interview Prep"
                subtitle="Practice with our AI interviewer to ace your next job."
            />

            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">

                    {/* Hero Section / Start New */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

                        <div className="relative z-10 max-w-2xl">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 mb-6 border border-white/10">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                <span className="text-sm font-medium">AI Interviewer Ready</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                                Master Your Interview Skills with AI
                            </h1>
                            <p className="text-blue-100 text-lg mb-8 leading-relaxed max-w-xl">
                                Simulate real interview scenarios, get instant feedback on your answers, and track your progress over time.
                            </p>
                            <button
                                onClick={() => {
                                    const userId = localStorage.getItem('user_id');
                                    window.location.href = `http://localhost:3000?userId=${userId}`;
                                }}
                                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:bg-blue-50 transition-all flex items-center gap-3 group-hover:scale-105 transform duration-200"
                            >
                                <Play className="fill-current w-5 h-5" />
                                Start New Session
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid Placeholder */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            icon={<Brain className="w-6 h-6 text-purple-400" />}
                            title="Sessions Completed"
                            value={stats.sessions_completed}
                            trend="Start your first one!"
                            color="bg-purple-500/10 border-purple-500/20"
                        />
                        <StatCard
                            icon={<Clock className="w-6 h-6 text-blue-400" />}
                            title="Practice Time"
                            value={stats.practice_time}
                            trend="Ready to learn?"
                            color="bg-blue-500/10 border-blue-500/20"
                        />
                        <StatCard
                            icon={<Mic className="w-6 h-6 text-emerald-400" />}
                            title="Avg. Score"
                            value={stats.avg_score}
                            trend="No data yet"
                            color="bg-emerald-500/10 border-emerald-500/20"
                        />
                    </div>

                    {/* Recent Sessions Placeholder */}
                    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Recent Sessions</h2>
                        </div>

                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/30">
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                                    <Mic className="w-8 h-8 text-gray-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-300">No sessions yet</h3>
                                    <p className="text-gray-500 max-w-sm mt-1">Start a new session above to begin your interview preparation journey.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                                            <th className="py-4 pl-4 font-medium">Date</th>
                                            <th className="py-4 font-medium">Duration</th>
                                            <th className="py-4 font-medium">Score</th>
                                            <th className="py-4 pr-4 font-medium text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-300">
                                        {history.map((session) => (
                                            <tr key={session.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                                <td className="py-4 pl-4 text-sm">{session.date}</td>
                                                <td className="py-4 text-sm">{session.duration}</td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${session.score >= 80 ? 'bg-green-500/20 text-green-400' :
                                                        session.score >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {session.score}/100
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-4 text-right">
                                                    <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Completed</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, title, value, trend, color }) {
    return (
        <div className={`p-6 rounded-2xl border backdrop-blur-xl ${color}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-900/50 rounded-xl">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                <h4 className="text-3xl font-bold text-white mb-2">{value}</h4>
                <p className="text-xs text-gray-500">{trend}</p>
            </div>
        </div>
    )
}

export default InterviewPrepPage;
