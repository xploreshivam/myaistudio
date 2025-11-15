import React from 'react';

interface TopicInputProps {
  topic: string;
  setTopic: (topic: string) => void;
  onStart: () => void;
  isLoading: boolean;
  previousTopics: string[];
  isGoogleSignedIn: boolean;
}

export const TopicInput: React.FC<TopicInputProps> = ({ topic, setTopic, onStart, isLoading, previousTopics, isGoogleSignedIn }) => {
  const isDuplicate = previousTopics.includes(topic.trim()) && topic.trim() !== '';

  const buttonDisabled = isLoading || !topic.trim() || !isGoogleSignedIn;

  const getButtonText = () => {
    if (isLoading) return 'Generating Content...';
    if (!isGoogleSignedIn) return 'Connect Drive to Start';
    return 'Make Content';
  };

  return (
    <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-700">
      <h2 className="text-xl font-bold text-white mb-4">2. Enter Your Topic</h2>
      <p className="text-sm text-slate-400 mb-4">
        Provide a topic (e.g., "pregnancy diet"). The AI will remember past topics to ensure future content is unique.
      </p>
      <div className="relative">
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., 'early pregnancy symptoms'"
          className="w-full h-24 p-3 bg-slate-900 border border-slate-700 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          disabled={isLoading}
        />
        {isDuplicate && (
          <p className="text-xs text-amber-400 mt-1">This topic has been used before. Using it again will generate new, unique content.</p>
        )}
      </div>
      <button
        onClick={onStart}
        disabled={buttonDisabled}
        className="mt-4 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition-all duration-300 ease-in-out disabled:bg-slate-700 disabled:cursor-not-allowed hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {getButtonText()}
      </button>
    </div>
  );
};
