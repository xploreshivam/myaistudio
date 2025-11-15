export enum LogStatus {
  INFO = 'info',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface Log {
  id: number;
  message: string;
  status: LogStatus;
}

export enum AssetType {
  TITLE_LIST = 'title_list',
  SCRIPT = 'script',
  AUDIO = 'audio',
  IMAGE = 'image',
  THUMBNAIL = 'thumbnail',
}

export interface GeneratedAsset {
  id: string;
  type: AssetType;
  name: string;
  url: string;
  blob: Blob;
  driveUrl?: string;
}
