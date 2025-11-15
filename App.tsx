import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TopicInput } from './components/TopicInput';
import { WorkflowDisplay } from './components/WorkflowDisplay';
import * as geminiService from './services/geminiService';
import { Log, LogStatus, GeneratedAsset, AssetType } from './types';
import { decode } from './utils/audioUtils';
import { addTextToImage } from './utils/imageUtils';
import { GoogleAuth } from './components/GoogleAuth';

// =================================================================================
// STEP 1: YAHAN APNI GOOGLE CLIENT ID DAALEIN
// Google Cloud Console se copy karke 'YOUR_GOOGLE_CLIENT_ID_HERE' ki jagah paste karein.
// For example: '1234567890-abcdefg.apps.googleusercontent.com'
// =================================================================================
const GOOGLE_CLIENT_ID = '264170930084-rpsdfjboohsco9qsv3n1780m3a6u2u5o.apps.googleusercontent.com';

// =================================================================================
// STEP 2: YAHAN APNI GOOGLE DRIVE FOLDER ID DAALEIN
// Google Drive folder ke URL se copy karke 'YOUR_DRIVE_FOLDER_ID_HERE' ki jagah paste karein.
// For example: '1psxqy7OGWYQw-2V-EytAwlOvKdrBODXd'
// =================================================================================
const DRIVE_FOLDER_ID = 'https://drive.google.com/drive/u/6/folders/1psxqy7OGWYQw-2V-EytAwlOvKdrBODXd';


const GOOGLE_API_SCOPES = 'https://www.googleapis.com/auth/drive.file';


declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export default function App() {
  const [topic, setTopic] = useState<string>('');
  const [previousTopics, setPreviousTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<Log[]>([]);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  
  // Google Auth State
  const [gapiReady, setGapiReady] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  
  const tokenClientRef = useRef<any>(null);
  const logCounter = useRef(0);

  const addLog = useCallback((status: LogStatus, message: string) => {
    setLogs(prev => [...prev, { id: logCounter.current++, status, message }]);
  }, []);
  
  const addAsset = useCallback((type: AssetType, name: string, blob: Blob, driveUrl?: string) => {
    const asset: GeneratedAsset = {
        id: `${name}-${Date.now()}`,
        type,
        name,
        blob,
        url: URL.createObjectURL(blob),
        driveUrl,
    };
    setGeneratedAssets(prev => [asset, ...prev]);
  }, []);

  // --- Google Drive Integration ---
  useEffect(() => {
    // Load GAPI for Drive API
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.onload = () => window.gapi.load('client', () => setGapiReady(true));
    document.body.appendChild(gapiScript);

    // Load GIS for OAuth2
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.onload = () => setGisReady(true);
    document.body.appendChild(gisScript);
  }, []);

  useEffect(() => {
    if (gapiReady && gisReady) {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_API_SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            window.gapi.client.setToken(tokenResponse);
            setIsSignedIn(true);
            addLog(LogStatus.SUCCESS, "Successfully connected to Google Drive.");
          }
        },
      });
    }
  }, [gapiReady, gisReady, addLog]);

  const handleAuthClick = () => {
    if (tokenClientRef.current) {
        tokenClientRef.current.requestAccessToken();
    }
  };

  const handleSignoutClick = () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token, () => {
        window.gapi.client.setToken(null);
        setIsSignedIn(false);
        addLog(LogStatus.INFO, "Disconnected from Google Drive.");
      });
    }
  };
  
  const uploadToDrive = async (blob: Blob, fileName: string): Promise<string | undefined> => {
    if (!isSignedIn) {
        addLog(LogStatus.ERROR, `Cannot upload ${fileName}: Not signed in to Google.`);
        return undefined;
    }
    
    addLog(LogStatus.PENDING, `Uploading ${fileName} to Google Drive...`);

    const fileReader = new FileReader();
    const base64Data = await new Promise<string>((resolve, reject) => {
        fileReader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
        fileReader.onerror = (e) => reject(e);
        fileReader.readAsDataURL(blob);
    });

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const metadata = {
        name: fileName,
        mimeType: blob.type,
        parents: [DRIVE_FOLDER_ID]
    };

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + blob.type + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        base64Data +
        close_delim;
    
    try {
        const response = await window.gapi.client.request({
            path: 'https://www.googleapis.com/upload/drive/v3/files',
            method: 'POST',
            params: { uploadType: 'multipart' },
            headers: { 'Content-Type': `multipart/related; boundary="${boundary}"` },
            body: multipartRequestBody,
        });
        
        const fileId = response.result.id;
        // Make another request to get webViewLink
        const fileMetaResponse = await window.gapi.client.drive.files.get({
          fileId: fileId,
          fields: 'webViewLink'
        });

        addLog(LogStatus.SUCCESS, `${fileName} uploaded successfully.`);
        return fileMetaResponse.result.webViewLink;

    } catch (error: any) {
        const errorMessage = error.result?.error?.message || 'Unknown upload error';
        addLog(LogStatus.ERROR, `Failed to upload ${fileName}: ${errorMessage}`);
        console.error("Upload error:", error);
        return undefined;
    }
  };


  const handleStartWorkflow = async () => {
    if (!topic.trim() || isLoading || !isSignedIn) return;

    setIsLoading(true);
    setProgress(0);
    setLogs([]);
    setGeneratedAssets([]);
    logCounter.current = 0;
    
    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE' || DRIVE_FOLDER_ID === 'YOUR_DRIVE_FOLDER_ID_HERE') {
      addLog(LogStatus.ERROR, 'Please replace placeholders in App.tsx with your actual Google Client ID and Drive Folder ID.');
      setIsLoading(false);
      return;
    }

    setPreviousTopics(prev => [...prev, topic.trim()]);
    
    let totalSteps = 0;
    const sanitizedTopic = topic.trim().replace(/\s+/g, '_');

    try {
        addLog(LogStatus.INFO, `Starting content generation for topic: "${topic}"`);

        // Step 1: Generate Titles
        addLog(LogStatus.PENDING, 'Generating unique YouTube titles...');
        const titles = await geminiService.generateTitles(topic);
        if (titles.length === 0) throw new Error("Failed to generate titles.");
        addLog(LogStatus.SUCCESS, `Generated ${titles.length} titles.`);
        const titlesBlob = new Blob([titles.join('\n')], { type: 'text/plain' });
        const titlesDriveUrl = await uploadToDrive(titlesBlob, `${sanitizedTopic}_titles.txt`);
        addAsset(AssetType.TITLE_LIST, `${sanitizedTopic}_titles.txt`, titlesBlob, titlesDriveUrl);
        
        // Calculate total steps for progress bar
        totalSteps = 1 + (titles.length * 4);
        let completedSteps = 1;
        setProgress(completedSteps / totalSteps * 100);

        for (let i = 0; i < titles.length; i++) {
            const currentTitle = titles[i];
            const titleNumber = i + 1;
            const assetNamePrefix = `${sanitizedTopic}_${titleNumber}_${currentTitle.substring(0,20).replace(/\s+/g, '_')}`;

            // Step 2: Generate Script
            addLog(LogStatus.PENDING, `[${titleNumber}/${titles.length}] Generating script for: "${currentTitle}"`);
            const script = await geminiService.generateScript(currentTitle);
            addLog(LogStatus.SUCCESS, `[${titleNumber}/${titles.length}] Script generated.`);
            const scriptBlob = new Blob([script], { type: 'text/plain' });
            const scriptDriveUrl = await uploadToDrive(scriptBlob, `${assetNamePrefix}_script.txt`);
            addAsset(AssetType.SCRIPT, `${assetNamePrefix}_script.txt`, scriptBlob, scriptDriveUrl);
            completedSteps++;
            setProgress(completedSteps / totalSteps * 100);
            
            // Step 3: Generate Audio
            addLog(LogStatus.PENDING, `[${titleNumber}/${titles.length}] Generating voiceover...`);
            const audioBlob = await geminiService.generateAudio(script);
            addLog(LogStatus.SUCCESS, `[${titleNumber}/${titles.length}] Voiceover generated.`);
            const audioDriveUrl = await uploadToDrive(audioBlob, `${assetNamePrefix}_audio.wav`);
            addAsset(AssetType.AUDIO, `${assetNamePrefix}_audio.wav`, audioBlob, audioDriveUrl);
            completedSteps++;
            setProgress(completedSteps / totalSteps * 100);

            // Step 4: Generate Thumbnail Image
            addLog(LogStatus.PENDING, `[${titleNumber}/${titles.length}] Generating thumbnail prompt...`);
            const thumbnailPrompt = await geminiService.generateThumbnailPrompt(currentTitle);
            addLog(LogStatus.PENDING, `[${titleNumber}/${titles.length}] Generating image for: "${thumbnailPrompt.substring(0, 40)}..."`);
            const imagesBase64 = await geminiService.generateImages(thumbnailPrompt);
            const imageBase64 = imagesBase64[0];
            if (!imageBase64) throw new Error("Failed to generate image.");
            
            const imageBlob = new Blob([decode(imageBase64)], { type: 'image/jpeg' });
            const imageDriveUrl = await uploadToDrive(imageBlob, `${assetNamePrefix}_image.jpg`);
            addAsset(AssetType.IMAGE, `${assetNamePrefix}_image.jpg`, imageBlob, imageDriveUrl);
            addLog(LogStatus.SUCCESS, `[${titleNumber}/${titles.length}] Base image generated.`);
            completedSteps++;
            setProgress(completedSteps / totalSteps * 100);

            // Step 5: Create Thumbnail (Add Text to Image)
            addLog(LogStatus.PENDING, `[${titleNumber}/${titles.length}] Creating final thumbnail...`);
            const thumbnailBlob = await addTextToImage(imageBlob, currentTitle);
            const thumbnailDriveUrl = await uploadToDrive(thumbnailBlob, `${assetNamePrefix}_thumbnail.jpg`);
            addAsset(AssetType.THUMBNAIL, `${assetNamePrefix}_thumbnail.jpg`, thumbnailBlob, thumbnailDriveUrl);
            addLog(LogStatus.SUCCESS, `[${titleNumber}/${titles.length}] Thumbnail created successfully.`);
            completedSteps++;
            setProgress(completedSteps / totalSteps * 100);
        }
        
        addLog(LogStatus.SUCCESS, "Workflow completed successfully!");
        setProgress(100);

    } catch (error) {
        console.error("Workflow failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        addLog(LogStatus.ERROR, `Workflow failed: ${errorMessage}`);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            AI YouTube Content Factory
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Automate your content pipeline from a single topic.
          </p>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex flex-col gap-8">
            <GoogleAuth
                isReady={gapiReady && gisReady}
                isSignedIn={isSignedIn}
                onAuthClick={handleAuthClick}
                onSignoutClick={handleSignoutClick}
            />
            <TopicInput 
              topic={topic}
              setTopic={setTopic}
              onStart={handleStartWorkflow}
              isLoading={isLoading}
              previousTopics={previousTopics}
              isGoogleSignedIn={isSignedIn}
            />
          </div>
          <div className="lg:col-span-2 min-h-[600px]">
            <WorkflowDisplay
              logs={logs}
              assets={generatedAssets}
              progress={progress}
              isLoading={isLoading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
