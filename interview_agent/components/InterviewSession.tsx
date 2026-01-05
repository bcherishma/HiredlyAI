import React, { useEffect, useRef, useState } from 'react';
import { useLiveAudio } from '../hooks/useLiveAudio';
import { InterviewConfig, TranscriptionItem, FeedbackReport } from '../types';
import { VoiceOrb } from './VoiceOrb';
import { Mic, MicOff, PhoneOff, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import { generateFeedback } from '../utils/feedbackGenerator';
import { Logo } from './Logo';

interface InterviewSessionProps {
  config: InterviewConfig;
  onEnd: (report?: FeedbackReport) => void;
  userId: string | null;
}

export const InterviewSession: React.FC<InterviewSessionProps> = ({ config, onEnd, userId }) => {
  const {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    error,
    inputAnalyser,
    outputAnalyser,
    transcripts,
    streamingTranscript,
    isMuted,
    toggleMute
  } = useLiveAudio();

  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  const handleEndSession = async () => {
    if (isEnding) return;
    setIsEnding(true);

    try {
      await disconnect();

      // Calculate duration
      const endTime = Date.now();
      const durationMs = endTime - startTimeRef.current;
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      const durationStr = `${minutes}m ${seconds}s`;

      // Generate feedback
      const report = await generateFeedback(transcripts, durationStr);

      // Save session to backend
      if (userId) {
        try {
          await fetch('http://localhost:8000/api/interview/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: parseInt(userId),
              duration_seconds: Math.floor(durationMs / 1000),
              score: report.overallScore
            })
          });
        } catch (err) {
          console.error("Failed to save session:", err);
        }
      }

      onEnd(report);
    } catch (e) {
      console.error("Error ending session:", e);
      onEnd(); // Fallback to home
    }
  };

  useEffect(() => {
    // Generate system instruction based on config
    const contextStr = config.companyContext ? `The company context is: ${config.companyContext}.` : "";

    const instruction = `
      You are an expert interviewer conducting a ${config.type} interview for a ${config.jobRole} position.
      The candidate has an experience level of: ${config.experienceLevel}.
      ${contextStr}
      
      Your goal is to evaluate the candidate's fit for the role.
      1. Start by briefly introducing yourself as the AI interviewer and asking the candidate to introduce themselves.
      2. Ask relevant questions based on the ${config.type} style.
      3. Listen to their answers, provide brief acknowledgement, and then ask a maximum of 3 follow-up questions or move to the next topic.
      4. Keep your responses concise and conversational (spoken English). 
      5. Be professional but encouraging.
      6. Do not use markdown formatting in your response, as this is a voice conversation.
    `;

    connect(instruction);
    startTimeRef.current = Date.now();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, streamingTranscript]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="bg-red-500/10 p-4 rounded-full mb-4">
          <AlertCircle size={48} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
        <p className="text-gray-400 mb-6 max-w-md">{error}</p>
        <button
          onClick={() => onEnd()}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
        >
          Return to Setup
        </button>
      </div>
    );
  }

  // Combine history and streaming for display
  const displayTranscripts = [...transcripts];
  if (streamingTranscript) {
    displayTranscripts.push({
      text: streamingTranscript.text,
      sender: streamingTranscript.sender,
      timestamp: Date.now()
    });
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-950 overflow-hidden relative selection:bg-blue-500/30">

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-center bg-gradient-to-b from-gray-950 to-transparent">
        <div className="flex items-center gap-4">
          <Logo size="sm" showText={false} />
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{config.jobRole}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/20">
                {config.type}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">{config.experienceLevel}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isConnected ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            <span className="text-xs font-medium">{isConnected ? 'Live' : isConnecting ? 'Connecting...' : 'Disconnected'}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 w-full max-w-7xl mx-auto p-6 pt-24 pb-28 grid grid-cols-1 ${isChatOpen ? 'lg:grid-cols-2' : ''} gap-8 lg:gap-12 h-full transition-all duration-500 ease-in-out`}>

        {/* Left Column: Voice Orb (Visual) */}
        <div className={`flex flex-col items-center justify-center relative h-full min-h-[300px] transition-all duration-500 ${!isChatOpen ? 'lg:max-w-3xl mx-auto w-full' : ''}`}>
          <div className="w-full aspect-square max-w-[500px] max-h-[500px] flex items-center justify-center relative">
            <VoiceOrb
              analyser={outputAnalyser}
              inputAnalyser={inputAnalyser}
              isConnected={isConnected}
            />
            {/* Connection Status Text Overlay */}
            <div className="absolute bottom-10 text-center pointer-events-none">
              {isConnecting && (
                <p className="text-gray-400 animate-pulse font-medium text-sm tracking-wider uppercase">Connecting...</p>
              )}
              {isConnected && (
                <p className="text-gray-500 text-xs font-medium tracking-widest uppercase opacity-50">Listening</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Transcript (Chat) */}
        {isChatOpen && (
          <div className="flex flex-col h-full min-h-0 bg-gray-900/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative animate-in fade-in slide-in-from-right-10 duration-500">

            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <MessageSquare size={16} />
                Live Transcript
              </h3>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold bg-gray-950/50 px-2 py-1 rounded">
                Real-time
              </span>
            </div>

            {/* Chat Body */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
            >
              {displayTranscripts.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-60">
                  <MessageSquare size={32} />
                  <p className="text-sm">Conversation will appear here...</p>
                </div>
              )}

              {displayTranscripts.map((t, i) => (
                <div key={i} className={`flex flex-col ${t.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${t.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-800 text-gray-200 rounded-bl-none'
                    }`}>
                    {t.text}
                    {/* Cursor for streaming */}
                    {t === displayTranscripts[displayTranscripts.length - 1] && streamingTranscript && (
                      <span className="inline-block w-1.5 h-3 ml-1 bg-current opacity-70 animate-pulse align-middle" />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1.5 px-1 uppercase tracking-wide">
                    {t.sender === 'user' ? 'You' : 'Interviewer'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Controls Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center bg-gradient-to-t from-gray-950 via-gray-950 to-transparent z-20">
        <div className="flex items-center gap-6">

          {/* Toggle Mic */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all shadow-lg border ${isMuted
              ? 'bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30'
              : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
              }`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndSession}
            disabled={isEnding}
            className={`group relative flex items-center justify-center w-16 h-16 rounded-full shadow-xl transition-all hover:scale-105 ${isEnding
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
              }`}
          >
            {isEnding ? (
              <Loader2 size={28} className="text-white animate-spin" />
            ) : (
              <PhoneOff size={28} className="text-white" />
            )}
          </button>

          {/* Generating Feedback Overlay */}
          {isEnding && (
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur px-6 py-3 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-bottom-5">
              <Loader2 size={18} className="text-blue-400 animate-spin" />
              <span className="text-sm font-medium text-gray-200">Generating Performance Report...</span>
            </div>
          )}

          {/* Chat Toggle */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-4 rounded-full transition-all shadow-lg border ${isChatOpen
              ? 'bg-blue-500 text-white border-blue-500 shadow-blue-500/20'
              : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
              }`}
          >
            <MessageSquare size={24} />
          </button>
        </div>
      </footer>
    </div>
  );
};