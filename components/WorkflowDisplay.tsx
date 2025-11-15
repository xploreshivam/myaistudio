import React, { useRef, useEffect } from 'react';
import { Log, GeneratedAsset } from '../types';
import { LogItem } from './LogItem';
import { AssetCard } from './AssetCard';

interface WorkflowDisplayProps {
  logs: Log[];
  assets: GeneratedAsset[];
  progress: number;
  isLoading: boolean;
}

export const WorkflowDisplay: React.FC<WorkflowDisplayProps> = ({ logs, assets, progress, isLoading }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-white mb-2">3. Generation Progress</h2>
        <div className="w-full bg-slate-700 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        {/* Logs Panel */}
        <div className="flex flex-col min-h-0">
          <h3 className="text-md font-semibold text-slate-300 p-4 pb-2">Logs</h3>
          <div className="flex-grow overflow-y-auto p-4 pt-0">
            {logs.length === 0 && !isLoading && (
              <div className="text-center text-slate-500 pt-8">
                <p>Waiting to start...</p>
                <p className="text-xs">Enter a topic and click "Make Content".</p>
              </div>
            )}
            {logs.map(log => <LogItem key={log.id} log={log} />)}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Assets Panel */}
        <div className="flex flex-col min-h-0 border-t md:border-t-0 md:border-l border-slate-700">
          <h3 className="text-md font-semibold text-slate-300 p-4 pb-2">Generated Assets</h3>
          <div className="flex-grow overflow-y-auto p-4 pt-0">
            {assets.length === 0 && (
              <div className="text-center text-slate-500 pt-8">
                 <p>Generated files will appear here.</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3">
              {assets.map(asset => <AssetCard key={asset.id} asset={asset} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
