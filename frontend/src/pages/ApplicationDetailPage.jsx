import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, FileText, Play, BookOpen, Wand2, Download, ExternalLink, Loader2, ChevronDown } from 'lucide-react';
import AuthenticatedNavbar from '../components/AuthenticatedNavbar';

function ApplicationDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [application, setApplication] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [atsData, setAtsData] = useState(null);
    const [skillData, setSkillData] = useState(null);
    const [resourceData, setResourceData] = useState(null);
    const [resumeData, setResumeData] = useState(null);

    useEffect(() => {
        fetchApplicationDetails();
    }, [id]);

    const fetchApplicationDetails = async () => {
        try {
            const userId = localStorage.getItem('user_id');
            if (!userId) return;

            const res = await fetch(`http://localhost:8000/api/applications/${userId}`);
            if (res.ok) {
                const apps = await res.json();
                const app = apps.find(a => a.id === parseInt(id));

                if (app) {
                    setApplication(app);

                    // Parse JSON columns safely
                    try { setAtsData(JSON.parse(app.ats_score_data || 'null')); } catch (e) { }
                    try { setSkillData(JSON.parse(app.skill_gap_data || 'null')); } catch (e) { }
                    try { setResourceData(JSON.parse(app.resource_data || 'null')); } catch (e) { }
                    try { setResumeData(JSON.parse(app.enhanced_resume_data || 'null')); } catch (e) { }
                }
            }
        } catch (error) {
            console.error("Failed to fetch application:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const res = await fetch(`http://localhost:8000/api/applications/${application.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                setApplication(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/generate_pdf/${application.id}`, {
                method: 'POST',
            });

            if (!res.ok) throw new Error('PDF Generation failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${application.company_name}_Resume.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            alert("Failed to download PDF. Ensure analysis is complete.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white">
                <Loader2 size={48} className="animate-spin text-blue-500" />
            </div>
        );
    }

    if (!application) {
        return <div className="text-white p-10">Application not found.</div>;
    }

    const atsScore = atsData?.score || 0;
    const missingHardSkills = skillData?.missing_hard_skills || [];
    const missingSoftSkills = skillData?.missing_soft_skills || [];
    const courses = resourceData?.recommended_courses || [];
    const videos = resourceData?.recommended_videos || [];
    const improvements = resumeData?.improvement_summary || [];

    return (
        <div className="flex flex-col h-full relative">
            <AuthenticatedNavbar title="Application Details" subtitle={`Manage your application for ${application.company_name}`} />

            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                    {/* Header / Back Button */}
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => navigate('/dashboard')} className="p-2 bg-gray-900/50 rounded-lg hover:bg-gray-800 transition-colors border border-gray-800">
                            <ArrowLeft size={20} className="text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                {application.company_name}
                                <span className="text-lg font-normal text-gray-500">/ {application.role}</span>
                            </h1>
                            <div className="mt-2 relative group inline-block">
                                <button className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg text-sm font-medium text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 transition-all">
                                    <div className={`w-2 h-2 rounded-full ${application.status === 'Offer' ? 'bg-green-500' :
                                        application.status === 'Rejected' ? 'bg-red-500' :
                                            application.status === 'Interview Prep' ? 'bg-blue-500' :
                                                'bg-gray-500'
                                        }`}></div>
                                    {application.status || 'Applied'}
                                    <ChevronDown size={14} />
                                </button>
                                <div className="absolute top-full left-0 pt-2 w-48 hidden group-hover:block z-50">
                                    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
                                        {['Applied', 'Interview Prep', 'Offer', 'Rejected', 'Archived'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusChange(status)}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
                                            >
                                                <div className={`w-2 h-2 rounded-full ${status === 'Offer' ? 'bg-green-500' :
                                                    status === 'Rejected' ? 'bg-red-500' :
                                                        status === 'Interview Prep' ? 'bg-blue-500' :
                                                            'bg-gray-500'
                                                    }`}></div>
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="ml-auto flex items-center gap-3">
                            <button
                                onClick={() => {
                                    const userId = localStorage.getItem('user_id');
                                    window.location.href = `http://localhost:3000?userId=${userId}`;
                                }}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                            >
                                <Play size={18} className="fill-current" />
                                Practice Interview
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LEFT COLUMN - ATS & RESUME */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Glass Container for ATS & Resume */}
                            <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-xl space-y-8">

                                {/* ATS Score Card */}
                                <div className="bg-gray-800 border border-gray-700/50 rounded-2xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <FileText className="text-purple-400" />
                                        ATS Resume Score
                                    </h2>

                                    {atsData ? (
                                        <div className="flex items-center gap-8">
                                            <div className="relative w-32 h-32 flex-shrink-0">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="64" cy="64" r="56" stroke="#1f2937" strokeWidth="12" fill="none" />
                                                    <circle cx="64" cy="64" r="56" stroke="#a855f7" strokeWidth="12" fill="none" strokeDasharray="351" strokeDashoffset={351 - (351 * atsScore) / 100} className="transition-all duration-1000 ease-out" />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                    <span className="text-3xl font-bold text-white">{atsScore}</span>
                                                    <span className="text-xs text-gray-400">/ 100</span>
                                                </div>
                                            </div>

                                            <div className="space-y-3 flex-1">
                                                <p className="text-gray-300">
                                                    Match Level: <span className="text-purple-400 font-bold">{atsScore >= 80 ? 'Excellent' : atsScore >= 60 ? 'Good' : 'Needs Work'}</span>
                                                </p>
                                                <div className="space-y-2">
                                                    {atsData.match_reasons && atsData.match_reasons.slice(0, 2).map((reason, i) => (
                                                        <div key={i} className="flex items-start gap-2 text-sm text-green-400">
                                                            <CheckCircle size={14} className="mt-0.5 shrink-0" /> {reason}
                                                        </div>
                                                    ))}
                                                    {atsData.missing_keywords && atsData.missing_keywords.length > 0 && (
                                                        <div className="flex items-start gap-2 text-sm text-red-400">
                                                            <AlertCircle size={14} className="mt-0.5 shrink-0" /> Missing: {atsData.missing_keywords.slice(0, 3).join(", ")}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 italic">ATS Analysis pending...</div>
                                    )}
                                </div>

                                {/* Enhanced Resume Section */}
                                <div className="bg-gray-800 border border-gray-700/50 rounded-2xl p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                                                <Wand2 className="text-blue-400" />
                                                Enhanced Resume
                                            </h2>
                                            <p className="text-gray-400 text-sm">We've generated an optimized version of your resume tailored for this job.</p>
                                        </div>
                                        {/* Download not implemented yet, placeholder */}
                                        {/* Download Button */}
                                        <button
                                            onClick={handleDownloadPDF}
                                            disabled={!resumeData}
                                            className={`px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 text-sm font-medium ${!resumeData ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <Download size={16} />
                                            Download PDF
                                        </button>
                                    </div>

                                    {resumeData ? (
                                        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white">{application.company_name}_Optimized_Resume.json</p>
                                                            <p className="text-xs text-gray-500">Ready for review</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                                                        <CheckCircle size={14} /> Ready
                                                    </span>
                                                </div>

                                                <div className="text-sm text-gray-400 ml-1">
                                                    <p className="mb-2 font-semibold text-gray-300">Improvements made:</p>
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {improvements.map((imp, i) => (
                                                            <li key={i}>{imp}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 italic">Resume enhancement pending...</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN - INSIGHTS */}
                        <div className="space-y-8">
                            {/* Glass Container for Insights */}
                            <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-xl space-y-8 h-full">

                                {/* Skill Gaps */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <AlertCircle className="text-yellow-500" size={18} />
                                        Skill Gap Analysis
                                    </h3>
                                    {missingHardSkills.length > 0 || missingSoftSkills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {missingHardSkills.map((skill, idx) => (
                                                <div key={`h-${idx}`} className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 flex items-center gap-2">
                                                    <span>{skill.skill}</span>
                                                </div>
                                            ))}
                                            {missingSoftSkills.map((skill, idx) => (
                                                <div key={`s-${idx}`} className="px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs font-semibold text-yellow-400 flex items-center gap-2">
                                                    <span>{skill.skill}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 text-sm">No significant skill gaps found.</div>
                                    )}
                                </div>

                                {/* Recommended Courses */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <BookOpen className="text-green-500" size={18} />
                                        Recommended Courses
                                    </h3>
                                    {courses.length > 0 ? (
                                        <div className="space-y-3">
                                            {courses.slice(0, 3).map((course, idx) => (
                                                <div key={idx} className="flex gap-3 p-3 bg-gray-800 border border-gray-700/50 rounded-xl hover:border-gray-600 transition-colors group">
                                                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center shrink-0">
                                                        <BookOpen size={16} className="text-green-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{course.title}</h4>
                                                        <p className="text-xs text-gray-500">{course.provider} • {course.duration}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 text-sm">No courses recommended.</div>
                                    )}
                                </div>

                                {/* YouTube Videos */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Play className="text-red-500" size={18} />
                                        Relevant Videos
                                    </h3>
                                    {videos.length > 0 ? (
                                        <div className="space-y-3">
                                            {videos.slice(0, 3).map((video, idx) => (
                                                <div key={idx} className="flex gap-3 p-3 bg-gray-800 border border-gray-700/50 rounded-xl hover:border-gray-600 transition-colors group">
                                                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center shrink-0">
                                                        <Play size={16} className="text-red-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors">{video.title}</h4>
                                                        <p className="text-xs text-gray-500">{video.channel} • {video.views}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 text-sm">No videos recommended.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ApplicationDetailPage;
