import React from 'react';
import { GeneratedAsset, AssetType } from '../types';
import { downloadBlob } from '../utils/fileUtils';
import { TextFileIcon } from './icons/TextFileIcon.tsx';
import { AudioFileIcon } from './icons/AudioFileIcon.tsx';
import { ImageFileIcon } from './icons/ImageFileIcon.tsx';
import { TitleIcon } from './icons/TitleIcon.tsx';
import { ThumbnailIcon } from './icons/ThumbnailIcon.tsx';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon.tsx';

interface AssetCardProps {
  asset: GeneratedAsset;
}

const getAssetInfo = (type: AssetType): { icon: React.ReactNode, color: string } => {
  switch (type) {
    case AssetType.TITLE_LIST:
      return { icon: <TitleIcon className="w-8 h-8" />, color: 'text-sky-400' };
    case AssetType.SCRIPT:
      return { icon: <TextFileIcon className="w-8 h-8" />, color: 'text-emerald-400' };
    case AssetType.AUDIO:
      return { icon: <AudioFileIcon className="w-8 h-8" />, color: 'text-purple-400' };
    case AssetType.IMAGE:
      return { icon: <ImageFileIcon className="w-8 h-8" />, color: 'text-amber-400' };
    case AssetType.THUMBNAIL:
      return { icon: <ThumbnailIcon className="w-8 h-8" />, color: 'text-rose-400' };
    default:
      return { icon: <div />, color: 'text-slate-400' };
  }
};

export const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const { icon, color } = getAssetInfo(asset.type);
  const fileExtension = asset.name.split('.').pop();

  return (
    <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-3 transition-transform transform hover:scale-105 hover:bg-slate-700/50">
      <div className={color}>
        {icon}
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{asset.name}</p>
        <p className="text-xs text-slate-400">{fileExtension?.toUpperCase()}</p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        {asset.driveUrl && (
           <a
            href={asset.driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-600 hover:bg-slate-500 text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-white"
            aria-label={`Open ${asset.name} in Google Drive`}
          >
            <GoogleDriveIcon className="h-5 w-5" />
          </a>
        )}
        <button
          onClick={() => downloadBlob(asset.blob, asset.name)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
          aria-label={`Download ${asset.name}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};
