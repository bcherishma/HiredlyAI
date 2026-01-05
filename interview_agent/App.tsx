import React, { useState } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { InterviewSession } from './components/InterviewSession';
import { InterviewConfig, FeedbackReport } from './types';
import { FeedbackScreen } from './components/FeedbackScreen';

const App: React.FC = () => {
  const [sessionConfig, setSessionConfig] = useState<InterviewConfig | null>(null);
  const [feedbackReport, setFeedbackReport] = useState<FeedbackReport | null>(null);

  // Get userId from URL
  const queryParams = new URLSearchParams(window.location.search);
  const userId = queryParams.get('userId');

  const handleSessionEnd = (report?: FeedbackReport) => {
    setSessionConfig(null);
    if (report) {
      setFeedbackReport(report);
    }
  };

  const handleHome = () => {
    window.location.href = 'http://localhost:5173/interview-prep';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-blue-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 h-full">
        {feedbackReport ? (
          <FeedbackScreen report={feedbackReport} onHome={handleHome} />
        ) : !sessionConfig ? (
          <div className="min-h-screen flex items-center justify-center">
            <SetupScreen onStart={setSessionConfig} />
          </div>
        ) : (
          <InterviewSession
            config={sessionConfig}
            onEnd={handleSessionEnd}
            userId={userId}
          />
        )}
      </div>
    </div>
  );
};

export default App;