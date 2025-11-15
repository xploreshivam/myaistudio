import React from 'react';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon.tsx';

interface GoogleAuthProps {
  isReady: boolean;
  isSignedIn: boolean;
  onAuthClick: () => void;
  onSignoutClick: () => void;
}

export const GoogleAuth: React.FC<GoogleAuthProps> = ({ isReady, isSignedIn, onAuthClick, onSignoutClick }) => {
  if (!isReady) {
    return (
      <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
        <p className="text-sm text-slate-400">Loading Google Drive connection...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-700">
      <h2 className="text-xl font-bold text-white mb-4">1. Connect to Google Drive</h2>
      <p className="text-sm text-slate-400 mb-4">
        Generated files will be automatically uploaded to your Google Drive. You must be connected to start.
      </p>
      {isSignedIn ? (
        <div className="flex items-center justify-between">
            <p className="text-emerald-400 font-semibold flex items-center gap-2">
                <GoogleDriveIcon className="w-5 h-5" />
                Connected to Google Drive
            </p>
            <button
                onClick={onSignoutClick}
                className="bg-rose-600 text-white font-bold py-2 px-4 rounded-md transition-colors hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-rose-500 text-sm"
            >
                Sign Out
            </button>
        </div>
      ) : (
        <button
          onClick={onAuthClick}
          className="w-full bg-sky-600 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center gap-3 transition-colors hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500"
        >
          <GoogleDriveIcon className="w-5 h-5" />
          Connect Google Drive
        </button>
      )}
    </div>
  );
};
