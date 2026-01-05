import React from 'react';
import { Logo } from './Logo';
import { FeedbackReport } from '../types';
import { ArrowLeft, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

interface FeedbackScreenProps {
    report: FeedbackReport;
    onHome: () => void;
}

export const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ report, onHome }) => {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400 border-green-500/50';
        if (score >= 60) return 'text-yellow-400 border-yellow-500/50';
        return 'text-red-400 border-red-500/50';
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8 flex flex-col items-center justify-center">

            <div className="w-full max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header */}
                <div className="text-center space-y-4">
                    <Logo size="lg" className="mx-auto" />
                    <h2 className="text-3xl font-bold tracking-tight">Interview Analysis</h2>
                    <div className={`inline-flex items-center justify-center p-8 rounded-full border-4 shadow-2xl relative bg-gray-900/50 backdrop-blur-xl ${getScoreColor(report.overallScore)}`}>
                        <span className={`text-5xl font-black ${getScoreColor(report.overallScore).split(' ')[0]}`}>
                            {report.overallScore}
                        </span>
                        <span className="absolute -bottom-6 text-sm font-medium text-gray-500 uppercase tracking-widest">Score</span>
                    </div>
                    {report.duration && (
                        <div className="text-gray-400 text-sm font-medium mt-2">
                            Duration: <span className="text-white">{report.duration}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Strengths */}
                    <div className="bg-gray-900/40 border border-green-500/20 rounded-2xl p-6 backdrop-blur-sm">
                        <h3 className="flex items-center gap-2 text-green-400 font-semibold mb-4">
                            <CheckCircle size={20} /> Strengths
                        </h3>
                        <ul className="space-y-3">
                            {report.strengths.map((item, i) => (
                                <li key={i} className="text-gray-300 text-sm leading-relaxed flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 mt-1.5 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Improvements */}
                    <div className="bg-gray-900/40 border border-yellow-500/20 rounded-2xl p-6 backdrop-blur-sm">
                        <h3 className="flex items-center gap-2 text-yellow-400 font-semibold mb-4">
                            <AlertTriangle size={20} /> Improvements
                        </h3>
                        <ul className="space-y-3">
                            {report.improvements.map((item, i) => (
                                <li key={i} className="text-gray-300 text-sm leading-relaxed flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/50 mt-1.5 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Tips */}
                    <div className="bg-gray-900/40 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-sm">
                        <h3 className="flex items-center gap-2 text-blue-400 font-semibold mb-4">
                            <Lightbulb size={20} /> Pro Tips
                        </h3>
                        <ul className="space-y-3">
                            {report.tips.map((item, i) => (
                                <li key={i} className="text-gray-300 text-sm leading-relaxed flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 mt-1.5 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="flex justify-center pt-8">
                    <button
                        onClick={onHome}
                        className="flex items-center gap-2 px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full font-medium transition-all shadow-lg hover:shadow-gray-500/20 border border-gray-700"
                    >
                        <ArrowLeft size={20} />
                        Back to Home
                    </button>
                </div>

            </div>
        </div>
    );
};
