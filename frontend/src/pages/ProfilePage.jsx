import React, { useEffect, useState } from 'react';
import { User, Mail, MapPin, Linkedin, Save, Plus, Trash2, Loader2, Briefcase, GraduationCap, Code, Pencil, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedNavbar from '../components/AuthenticatedNavbar';

function ProfilePage() {
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Core User Data
    const [userData, setUserData] = useState({
        full_name: '',
        email: '',
        phone: ''
    });

    // Resume Data Structure
    const [resumeData, setResumeData] = useState({
        personal_info: { name: "", email: "", phone: "", location: "", linkedin: "" },
        education: [],
        experience: [],
        projects: [],
        skills: { languages: [], web_technologies: [], databases: [], tools_and_software: [] }
    });

    useEffect(() => {
        const storedUserId = localStorage.getItem('user_id');
        if (!storedUserId) {
            navigate('/auth');
            return;
        }
        setUserId(storedUserId);
        fetchProfile(storedUserId);
    }, [navigate]);

    const fetchProfile = async (id) => {
        try {
            const response = await fetch(`http://localhost:8000/api/profile/${id}`);
            if (!response.ok) throw new Error('Failed to fetch profile');

            const data = await response.json();
            setUserData({
                full_name: data.full_name,
                email: data.email,
                phone: data.phone
            });

            if (data.resume_data && Object.keys(data.resume_data).length > 0) {
                setResumeData(prev => ({ ...prev, ...data.resume_data }));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`http://localhost:8000/api/profile/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resume_data: resumeData })
            });

            if (!response.ok) throw new Error('Failed to update profile');

            setHasChanges(false);
            setIsEditing(false);
            alert('Profile updated successfully!');

        } catch (error) {
            console.error(error);
            alert('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setHasChanges(false);
        // Re-fetch to reset data? Or just let it be (re-fetch is safer to undo changes)
        fetchProfile(userId);
    };

    const markChanged = () => {
        if (!hasChanges) setHasChanges(true);
    };

    const handlePersonalInfoChange = (e) => {
        const { name, value } = e.target;
        setResumeData(prev => ({
            ...prev,
            personal_info: { ...prev.personal_info, [name]: value }
        }));
        markChanged();
    };

    const handleListChange = (section, index, field, value) => {
        const newList = [...resumeData[section]];
        newList[index] = { ...newList[index], [field]: value };
        setResumeData(prev => ({ ...prev, [section]: newList }));
        markChanged();
    };

    const addListItem = (section, template) => {
        setResumeData(prev => ({ ...prev, [section]: [...prev[section], template] }));
        markChanged();
    };

    const removeListItem = (section, index) => {
        const newList = [...resumeData[section]];
        newList.splice(index, 1);
        setResumeData(prev => ({ ...prev, [section]: newList }));
        markChanged();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <AuthenticatedNavbar
                title="Profile"
                subtitle="Manage your personal information and resume."
            />

            <div className="flex-1 relative z-10 max-w-5xl mx-auto w-full">

                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div></div>

                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="text-gray-400 hover:text-white px-4 py-2 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!hasChanges || saving}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-xl font-semibold border border-gray-700 shadow-lg flex items-center gap-2 transition-all"
                            >
                                <Pencil className="w-4 h-4" />
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Sidebar / Personal Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 shadow-xl">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 p-1 shadow-lg shadow-blue-500/20 mb-4">
                                    <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                                        <User className="w-10 h-10 text-gray-300" />
                                    </div>
                                </div>
                                {isEditing ? (
                                    <input
                                        name="name"
                                        value={resumeData.personal_info.name || ''}
                                        onChange={handlePersonalInfoChange}
                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-center font-bold text-lg focus:outline-none focus:border-blue-500 transition-colors mb-1"
                                        placeholder="Full Name"
                                    />
                                ) : (
                                    <h2 className="text-xl font-bold">{resumeData.personal_info.name || userData.full_name}</h2>
                                )}
                                <p className="text-gray-400 text-sm">{userData.email}</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Email</label>
                                    {isEditing ? (
                                        <input
                                            name="email"
                                            value={resumeData.personal_info.email || ''}
                                            onChange={handlePersonalInfoChange}
                                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Email Address"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <Mail className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm">{resumeData.personal_info.email || 'N/A'}</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Phone</label>
                                    {isEditing ? (
                                        <input
                                            name="phone"
                                            value={resumeData.personal_info.phone || ''}
                                            onChange={handlePersonalInfoChange}
                                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Phone Number"
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-300 block">{resumeData.personal_info.phone || 'N/A'}</span>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">LinkedIn</label>
                                    {isEditing ? (
                                        <div className="flex items-center bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2">
                                            <Linkedin className="w-4 h-4 text-gray-500 mr-2" />
                                            <input
                                                name="linkedin"
                                                value={resumeData.personal_info.linkedin || ''}
                                                onChange={handlePersonalInfoChange}
                                                className="bg-transparent w-full text-sm focus:outline-none"
                                                placeholder="LinkedIn Profile"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <Linkedin className="w-4 h-4 text-gray-500" />
                                            <a href={resumeData.personal_info.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline truncate">
                                                {resumeData.personal_info.linkedin || 'N/A'}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Location</label>
                                    {isEditing ? (
                                        <div className="flex items-center bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2">
                                            <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                                            <input
                                                name="location"
                                                value={resumeData.personal_info.location || ''}
                                                onChange={handlePersonalInfoChange}
                                                className="bg-transparent w-full text-sm focus:outline-none"
                                                placeholder="City, Country"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <MapPin className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm">{resumeData.personal_info.location || 'N/A'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Skills Section */}
                        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                    <Code className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-lg">Skills</h3>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(resumeData.skills).map(([category, items]) => (
                                    <div key={category}>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                            {category.replace('_', ' ')}
                                        </label>
                                        {isEditing ? (
                                            <textarea
                                                value={Array.isArray(items) ? items.join(', ') : items}
                                                onChange={(e) => {
                                                    const val = e.target.value.split(',').map(s => s.trim());
                                                    setResumeData(prev => ({
                                                        ...prev,
                                                        skills: { ...prev.skills, [category]: val }
                                                    }));
                                                    markChanged();
                                                }}
                                                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors h-20 resize-none"
                                                placeholder="Java, Python, React..."
                                            />
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {Array.isArray(items) && items.length > 0 ? items.map((skill, i) => (
                                                    <span key={i} className="px-2 py-1 bg-gray-700/50 rounded-md text-xs text-gray-300 border border-gray-600/30">
                                                        {skill}
                                                    </span>
                                                )) : <span className="text-sm text-gray-500 italic">None</span>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content / Experience & Education */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Experience Section */}
                        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-xl">Experience</h3>
                                </div>
                                {isEditing && (
                                    <button
                                        onClick={() => addListItem('experience', { company: '', role: '', period: '', description: '' })}
                                        className="p-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6">
                                {resumeData.experience.map((exp, index) => (
                                    <div key={index} className={`bg-gray-900/50 rounded-xl p-5 border ${isEditing ? 'border-gray-700/50' : 'border-transparent'} relative group transition-colors`}>
                                        {isEditing && (
                                            <button
                                                onClick={() => removeListItem('experience', index)}
                                                className="absolute top-4 right-4 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all z-10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}

                                        {isEditing ? (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                    <input
                                                        value={exp.role || ''}
                                                        onChange={(e) => handleListChange('experience', index, 'role', e.target.value)}
                                                        className="bg-transparent border-b border-gray-700 focus:border-blue-500 text-lg font-bold w-full focus:outline-none pb-1"
                                                        placeholder="Job Title"
                                                    />
                                                    <input
                                                        value={exp.company || ''}
                                                        onChange={(e) => handleListChange('experience', index, 'company', e.target.value)}
                                                        className="bg-transparent border-b border-gray-700 focus:border-blue-500 text-blue-400 font-medium w-full focus:outline-none pb-1"
                                                        placeholder="Company Name"
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <input
                                                        value={exp.period || ''}
                                                        onChange={(e) => handleListChange('experience', index, 'period', e.target.value)}
                                                        className="bg-transparent text-sm text-gray-500 w-full focus:outline-none"
                                                        placeholder="Period (e.g. 2020 - Present)"
                                                    />
                                                </div>
                                                <textarea
                                                    value={Array.isArray(exp.responsibilities) ? exp.responsibilities.join('\n') : (exp.description || '')}
                                                    onChange={(e) => {
                                                        const val = e.target.value.split('\n');
                                                        handleListChange('experience', index, 'responsibilities', val)
                                                    }}
                                                    className="w-full bg-transparent text-gray-300 text-sm focus:outline-none h-24 resize-none border border-gray-800 rounded p-2"
                                                    placeholder="Responsibilities (one per line)..."
                                                />
                                            </>
                                        ) : (
                                            <div className="relative">
                                                <h4 className="text-lg font-bold text-white">{exp.role}</h4>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-blue-400 font-medium">{exp.company}</span>
                                                    <span className="text-sm text-gray-500">{exp.period}</span>
                                                </div>
                                                <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                                                    {Array.isArray(exp.responsibilities) ? exp.responsibilities.map((r, i) => (
                                                        <li key={i} className="leading-relaxed">{r}</li>
                                                    )) : <p>{exp.description}</p>}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {resumeData.experience.length === 0 && (
                                    <p className="text-gray-500 text-center py-4 italic">No experience added yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Education Section */}
                        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                        <GraduationCap className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-xl">Education</h3>
                                </div>
                                {isEditing && (
                                    <button
                                        onClick={() => addListItem('education', { institution: '', degree: '', period: '' })}
                                        className="p-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6">
                                {resumeData.education.map((edu, index) => (
                                    <div key={index} className={`bg-gray-900/50 rounded-xl p-5 border ${isEditing ? 'border-gray-700/50' : 'border-transparent'} relative group`}>
                                        {isEditing && (
                                            <button
                                                onClick={() => removeListItem('education', index)}
                                                className="absolute top-4 right-4 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all z-10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}

                                        {isEditing ? (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                                    <input
                                                        value={edu.degree || ''}
                                                        onChange={(e) => handleListChange('education', index, 'degree', e.target.value)}
                                                        className="bg-transparent border-b border-gray-700 focus:border-emerald-500 text-lg font-bold w-full focus:outline-none pb-1"
                                                        placeholder="Degree / Major"
                                                    />
                                                    <input
                                                        value={edu.institution || ''}
                                                        onChange={(e) => handleListChange('education', index, 'institution', e.target.value)}
                                                        className="bg-transparent border-b border-gray-700 focus:border-emerald-500 text-emerald-400 font-medium w-full focus:outline-none pb-1"
                                                        placeholder="University / School"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        value={edu.period || ''}
                                                        onChange={(e) => handleListChange('education', index, 'period', e.target.value)}
                                                        className="bg-transparent text-sm text-gray-500 w-full focus:outline-none"
                                                        placeholder="Period (e.g. 2018 - 2022)"
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <div>
                                                <h4 className="text-lg font-bold text-white">{edu.degree}</h4>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-emerald-400 font-medium">{edu.institution}</span>
                                                    <span className="text-sm text-gray-500">{edu.period}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {resumeData.education.length === 0 && (
                                    <p className="text-gray-500 text-center py-4 italic">No education added yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
