export enum InterviewType {
  Behavioral = "Behavioral",
  Technical = "Technical",
  SystemDesign = "System Design",
  General = "General HR"
}

export enum ExperienceLevel {
  Intern = "Intern",
  Junior = "Junior",
  MidLevel = "Mid-Level",
  Senior = "Senior",
  Lead = "Lead/Manager"
}

export interface InterviewConfig {
  jobRole: string;
  type: InterviewType;
  experienceLevel: ExperienceLevel;
  companyContext?: string;
}

export interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isListening: boolean;
  color?: string;
}

export interface VoiceOrbProps {
  analyser: AnalyserNode | null; // AI Analyser
  inputAnalyser: AnalyserNode | null; // User Analyser
  isConnected: boolean;
}

export interface TranscriptionItem {
  text: string;
  sender: 'user' | 'model';
  timestamp: number;
}

export interface FeedbackReport {
  strengths: string[];
  improvements: string[];
  tips: string[];
  overallScore: number; // 0-100
  duration?: string;
}
