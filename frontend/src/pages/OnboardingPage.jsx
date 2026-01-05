import React from 'react';
import { Upload, Mic, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function OnboardingPage() {
    const navigate = useNavigate();
    const fileInputRef = React.useRef(null);
    const [isUploading, setIsUploading] = React.useState(false);

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file.');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/upload_resume', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Upload failed');
            }

            const data = await response.json();
            console.log('Upload success:', data);

            // Save details to trigger "Proceed to Dashboard" flow or direct access
            // Storing basic info so dashboard can potentially use it
            if (data.extracted_email) localStorage.setItem('user_email', data.extracted_email);
            if (data.extracted_name) localStorage.setItem('user_name', data.extracted_name);

            navigate('/dashboard');
        } catch (error) {
            console.error('Upload Error:', error);
            alert('Failed to process resume: ' + error.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500 selection:text-white flex flex-col">
            <Navbar showAuthButtons={false} />

            {/* Content Container (flex-1 to push footer down) */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden pt-24 pb-24">

                {/* Background Gradients */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-[20%] right-[20%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[20%] left-[20%] w-96 h-96 bg-violet-600/10 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 w-full max-w-4xl text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400 pb-2 leading-normal">
                        Let's Begin your Career
                    </h1>
                    <p className="text-xl text-gray-400 mb-12">Choose how to begin</p>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Option 1: Upload Existing Resume */}
                        <button
                            onClick={handleUploadClick}
                            disabled={isUploading}
                            className="group relative p-8 rounded-3xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/50 transition-all hover:bg-gray-800 flex flex-col items-center text-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf"
                                className="hidden"
                            />
                            <div className="w-16 h-16 rounded-2xl bg-gray-700/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                {isUploading ? (
                                    <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Upload className="w-8 h-8 text-blue-400" />
                                )}
                            </div>
                            <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors">
                                {isUploading ? "Processing..." : "Upload existing resume"}
                            </h3>
                            <p className="text-gray-400">
                                We'll parse your PDF/Word resume and optimize it.
                            </p>
                        </button>

                        {/* Option 2: Create from Scratch (Emphasized) */}
                        <button
                            onClick={() => navigate('/onboarding/chat')}
                            className="group relative p-8 rounded-3xl bg-gradient-to-b from-blue-600/20 to-violet-600/20 border border-blue-500/30 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all flex flex-col items-center text-center ring-1 ring-blue-500/20"
                        >
                            <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                RECOMMENDED
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/30">
                                <Mic className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-white">Create from scratch</h3>
                            <p className="text-blue-200/80">
                                Use our AI voice assistant to build your professional profile.
                            </p>
                        </button>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default OnboardingPage;
