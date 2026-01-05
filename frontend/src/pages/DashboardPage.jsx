import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedNavbar from '../components/AuthenticatedNavbar';
import CalendarWidget from '../components/CalendarWidget';

function DashboardPage() {
    const [applications, setApplications] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Delete Confirmation State
    const [deleteAppId, setDeleteAppId] = useState(null);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);

    // Form State
    const [newApp, setNewApp] = useState({
        company_name: '',
        role: '',
        status: 'Applied',
        job_description: ''
    });

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        const userId = localStorage.getItem('user_id');
        if (!userId) return;

        try {
            const res = await fetch(`http://localhost:8000/api/applications/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setApplications(data);
            }
        } catch (error) {
            console.error("Failed to fetch applications:", error);
        }
    };

    // Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleCreateApplication = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const userId = localStorage.getItem('user_id');

        try {
            // 1. Create Application
            const res = await fetch('http://localhost:8000/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: parseInt(userId),
                    ...newApp
                })
            });

            if (res.ok) {
                const createdApp = await res.json();
                setIsModalOpen(false);

                // 2. Trigger Analysis
                setIsAnalyzing(true);
                try {
                    const analyzeRes = await fetch('http://localhost:8000/api/analyze_application', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ application_id: createdApp.id })
                    });

                    if (analyzeRes.ok) {
                        // Success -> Redirect to Detail Page
                        navigate(`/applications/${createdApp.id}`);
                    } else {
                        console.error("Analysis failed to start");
                        // Still redirect, maybe show error on detail page later
                        navigate(`/applications/${createdApp.id}`);
                    }
                } catch (analyzeErr) {
                    console.error("Analysis network error:", analyzeErr);
                    navigate(`/applications/${createdApp.id}`);
                } finally {
                    setIsAnalyzing(false);
                }

                setNewApp({
                    company_name: '',
                    role: '',
                    status: 'Applied',
                    job_description: ''
                });
                fetchApplications();
            }
        } catch (error) {
            console.error("Failed to create application:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteApplication = async () => {
        if (!deleteAppId) return;
        setIsDeleteLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/applications/${deleteAppId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setDeleteAppId(null);
                fetchApplications(); // Refresh list
            }
        } catch (error) {
            console.error("Failed to delete application:", error);
        } finally {
            setIsDeleteLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative">
            <AuthenticatedNavbar
                title="Dashboard"
                subtitle="Manage your job applications and profile."
            />

            <div className="flex flex-col xl:flex-row gap-8">
                {/* Application Section */}
                <div className="flex-1 min-w-0">
                    <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-10 shadow-xl min-h-[700px]">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold">Your Applications</h2>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                            >
                                New Application
                                <Plus size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {applications.map((app) => (
                                <ApplicationCard key={app.id} app={app} onDelete={() => setDeleteAppId(app.id)} />
                            ))}

                            {/* Add New Placeholder */}
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="h-48 rounded-2xl border-2 border-dashed border-gray-700/50 hover:border-blue-500/30 hover:bg-blue-500/5 flex flex-col items-center justify-center gap-3 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-800 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                                    <Plus size={24} className="text-gray-500 group-hover:text-blue-400" />
                                </div>
                                <span className="text-gray-500 font-medium group-hover:text-blue-400">Add another application...</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Calendar Section */}
                <div className="w-full xl:w-[400px] shrink-0">
                    <CalendarWidget />
                </div>
            </div>

            {/* Analysis Loading Modal */}
            {isAnalyzing && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full animate-pulse"></div>
                            <Loader2 size={64} className="text-blue-400 animate-spin relative z-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mt-8 mb-2">Analyzing Application...</h2>
                        <p className="text-gray-400 max-w-sm text-center">
                            Our AI agents are evaluating your fit, identifying skill gaps, and generating recommendations.
                        </p>
                    </div>
                </div>
            )}

            {/* New Application Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-800">
                            <h3 className="text-xl font-bold text-white">New Application</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateApplication} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newApp.company_name}
                                    onChange={(e) => setNewApp({ ...newApp, company_name: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="e.g. Google"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                                <input
                                    type="text"
                                    required
                                    value={newApp.role}
                                    onChange={(e) => setNewApp({ ...newApp, role: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="e.g. Frontend Engineer"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                                <select
                                    value={newApp.status}
                                    onChange={(e) => setNewApp({ ...newApp, status: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                                >
                                    <option value="Applied">Applied</option>
                                    <option value="Interview Prep">Interview Prep</option>
                                    <option value="Offer">Offer</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Job Description</label>
                                <textarea
                                    required
                                    value={newApp.job_description}
                                    onChange={(e) => setNewApp({ ...newApp, job_description: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[120px]"
                                    placeholder="Paste the job description here..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                                >
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Create Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteAppId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Delete Application?</h3>
                            <p className="text-gray-400">
                                Are you sure you want to delete this application? This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setDeleteAppId(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteApplication}
                                disabled={isDeleteLoading}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {isDeleteLoading ? <Loader2 size={18} className="animate-spin" /> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ApplicationCard({ app, onDelete }) {
    const navigate = useNavigate();

    const getStatusColor = (status) => {
        switch (status) {
            case 'Interview Prep': return 'bg-blue-600';
            case 'Applied': return 'bg-yellow-600';
            case 'Offer': return 'bg-green-600';
            case 'Rejected': return 'bg-red-600';
            default: return 'bg-gray-600';
        }
    };

    return (
        <div className="bg-gray-800 border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent -mr-8 -mt-8 rounded-full blur-2xl group-hover:from-blue-500/10 transition-colors" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold truncate pr-4">{app.company_name}</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/applications/${app.id}`)}
                            className="text-xs font-medium text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-gray-700/50 border border-gray-600/50 transition-colors shrink-0"
                        >
                            View
                        </button>
                        <button
                            onClick={onDelete}
                            className="text-gray-400 hover:text-red-400 px-2 py-1.5 rounded-lg bg-gray-700/50 border border-gray-600/50 transition-colors shrink-0"
                            title="Delete Application"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Role</p>
                        <p className="font-medium truncate">{app.role}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500 mb-2">Status</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(app.status)}`}>
                            {app.status}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardPage;
