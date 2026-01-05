import React, { useState } from 'react';
import { Logo } from './Logo';
import { InterviewConfig, InterviewType, ExperienceLevel } from '../types';
import { Briefcase, User, Building, ArrowRight } from 'lucide-react';

interface SetupScreenProps {
  onStart: (config: InterviewConfig) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const [config, setConfig] = useState<InterviewConfig>({
    jobRole: "Frontend Engineer",
    type: InterviewType.Technical,
    experienceLevel: ExperienceLevel.MidLevel,
    companyContext: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(config);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="text-center mb-10 flex flex-col items-center">
        <Logo size="xl" className="mb-6" />
        <p className="text-gray-400 text-lg">
          Configure your AI interview session. Master your next opportunity.
        </p>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Job Role */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Briefcase size={16} /> Target Role
            </label>
            <input
              type="text"
              required
              value={config.jobRole}
              onChange={(e) => setConfig({ ...config, jobRole: e.target.value })}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. Product Manager, React Developer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interview Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Interview Style
              </label>
              <select
                value={config.type}
                onChange={(e) => setConfig({ ...config, type: e.target.value as InterviewType })}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
              >
                {Object.values(InterviewType).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <User size={16} /> Experience Level
              </label>
              <select
                value={config.experienceLevel}
                onChange={(e) => setConfig({ ...config, experienceLevel: e.target.value as ExperienceLevel })}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
              >
                {Object.values(ExperienceLevel).map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Company Context */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Building size={16} /> Company/Context (Optional)
            </label>
            <textarea
              value={config.companyContext}
              onChange={(e) => setConfig({ ...config, companyContext: e.target.value })}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-24 resize-none"
              placeholder="e.g. A fast-paced fintech startup. Focus on scalability and security."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
          >
            Start Interview <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};