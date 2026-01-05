import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import OnboardingPage from './pages/OnboardingPage';
import OnboardingChatPage from './pages/OnboardingChatPage';
import ProfilePage from './pages/ProfilePage';
import InterviewPrepPage from './pages/InterviewPrepPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import AppLayout from './components/AppLayout';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/onboarding/chat" element={<OnboardingChatPage />} />

        {/* Authenticated Layout */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/interview-prep" element={<InterviewPrepPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          {/* Add other authenticated routes here */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
