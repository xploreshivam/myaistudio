import { GoogleGenAI, Modality } from "@google/genai";
import { decode, pcmToWav } from '../utils/audioUtils';

// --- LAZY INITIALIZATION FOR AI CLIENT ---
// We initialize the AI client only when it's first needed.
// This prevents the app from crashing on startup if the API_KEY environment variable isn't immediately available during deployment.
let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        if (!process.env.API_KEY) {
            // This error will be caught by the user-facing check in App.tsx, but it's a good safeguard.
            throw new Error("Gemini API Key is not configured. Please set the API_KEY environment variable.");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

const textModel = 'gemini-2.5-flash';
const imageModel = 'imagen-4.0-generate-001';
const ttsModel = 'gemini-2.5-flash-preview-tts';
const geminiTtsVoice = 'Kore'; // A female voice

const TITLE_COUNT = 5;
const IMAGE_GENERATION_PER_PROMPT = 1;

export const generateTitles = async (topic: string): Promise<string[]> => {
    const prompt = `Pregnancy topic "${topic}" par ${TITLE_COUNT} YouTube titles generate karo. Titles 100% unique, curiosity-based, emotional hook wale ho. Indian women ke perspective ke hisaab se likho. Words ‘Ladka’, ‘Safed Pani’, ‘Pregnancy Test Kit’, ‘Ultrasound’, ‘Ovulation’, ‘Implantation’, ‘Symptoms’ ka smart use karo. Title aise ho ki user turant click kare. koi heading mat dena, बस titles numbered list me do.`;
    
    const client = getAiClient();
    const response = await client.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            temperature: 0.7,
        },
    });

    const rawText = response.text;
    if (!rawText) {
        return [];
    }
    return rawText.split('\n').map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
};

export const generateScript = async (title: string): Promise<string> => {
    const prompt = `"${title}" ,  es par ek YouTube video script likho without heading with proper hooks give only answer LIKE EXPERT, please deep and unique insight, my video length is 1 to 1.2 minutes only, please make shorts as soon as possible and give clear answer, in completely dev Nagri , do not use full stop beyond use comma, like indian youtuber angry prash in hindi , speaker is female , make sure in devnagri, start with dekhiye   and  question , only give accurate answer only , make sure use comma,`;

    const client = getAiClient();
    const response = await client.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            temperature: 0.8,
        },
    });
    
    return response.text;
};

export const generateAudio = async (script: string): Promise<Blob> => {
    const client = getAiClient();
    const response = await client.models.generateContent({
        model: ttsModel,
        contents: [{ parts: [{ text: script }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: geminiTtsVoice }
                }
            }
        }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Audio generation failed: no audio data received.");
    }

    const audioBytes = decode(base64Audio);
    // Gemini TTS returns 16-bit, 24kHz, single-channel PCM audio.
    const wavBlob = pcmToWav(audioBytes, 24000, 1);
    return wavBlob;
};

export const generateThumbnailPrompt = async (title: string): Promise<string> => {
    const prompt = `Generate a single, compelling, and photorealistic YouTube thumbnail image prompt for a video titled: "${title}". The prompt should describe a visually striking image with a clear focal point, vibrant colors, and an emotionally engaging scene relevant to an Indian audience. Do not include any text in the image description. The output should be only the prompt text, without any labels or quotes.`;
    
    const client = getAiClient();
    const response = await client.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            temperature: 0.7,
        },
    });
    
    return response.text.trim();
};

export const generateImages = async (prompt: string): Promise<string[]> => {
    const client = getAiClient();
    const response = await client.models.generateImages({
        model: imageModel,
        prompt: prompt,
        config: {
            numberOfImages: IMAGE_GENERATION_PER_PROMPT,
            aspectRatio: '16:9',
            outputMimeType: 'image/jpeg',
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("Image generation failed: no images received.");
    }

    return response.generatedImages.map(img => img.image.imageBytes);
};
