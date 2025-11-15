import { GoogleGenAI, Modality } from "@google/genai";

// The user has provided an API key to be used for this session.
// In a real application, this should be handled securely, e.g., via environment variables.
const ai = new GoogleGenAI({ apiKey: "AIzaSyAxlKE8uUFiVbQgapEuImwtj_XFC0gKSBA" });

const textModel = ai.models['gemini-2.5-flash'];
const imageModel = 'imagen-4.0-generate-001';
const ttsModel = 'gemini-2.5-flash-preview-tts';

// Note: Using a smaller number for demonstration purposes to avoid excessive API calls.
const TITLE_COUNT = 5;
const IMAGE_PROMPT_COUNT = 4;
const IMAGE_GENERATION_PER_PROMPT = 1; // User asked for 2, using 1 for speed.

export const generateTitles = async (topic: string): Promise<string[]> => {
    const prompt = `Pregnancy topic "${topic}" par ${TITLE_COUNT} YouTube titles generate karo. Titles 100% unique, curiosity-based, emotional hook wale ho. Indian women ke perspective ke hisaab se likho. Words ‘Ladka’, ‘Safed Pani’, ‘Pregnancy Test Kit’, ‘Ultrasound’, ‘Ovulation’, ‘Implantation’, ‘Symptoms’ ka smart use karo. Title aise ho ki user turant click kare. koi heading mat dena, बस titles numbered list me do.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    const rawText = response.text;
    return rawText.split('\n').map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
};

export const generateScript = async (title: string): Promise<string> => {
    const prompt = `"${title}" ,  es par ek YouTube video script likho without heading with proper hooks give only answer LIKE EXPERT, please deep and unique insight, my video length is 1 to 1.2 minutes only, please make shorts as soon as possible and give clear answer, in completely dev Nagri , do not use full stop beyond use comma, like indian youtuber angry prash in hindi , speaker is female , make sure in devnagri, start with dekhiye   and  question , only give accurate answer only , make sure use comma,`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
};

export const generateAudio = async (script: string): Promise<Uint8Array> => {
    const response = await ai.models.generateContent({
        model: ttsModel,
        contents: [{ parts: [{ text: script }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' }, // Female voice
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Audio data not found in response");
    }
    
    // Custom decode function from audioUtils will be used in App.tsx
    return new TextEncoder().encode(base64Audio); // Returning as a placeholder, will be decoded in App
};

export const generateImagePrompts = async (script: string): Promise<string[]> => {
    const prompt = `from this script: "${script}", write prompt for image generation, and make sure cover all topic one by one from the script and make sure close up, and background clean smooth dark but alternate, please not in single, you can make listing, only prompt write, at least ${IMAGE_PROMPT_COUNT}, in english ,focus on key every have at least one prompt on each points ,and if human need so include another you can ignore. Output only a numbered list of prompts, with no other text.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    
    const rawText = response.text;
    return rawText.split('\n').map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
};

export const generateImages = async (prompt: string): Promise<string[]> => {
    const response = await ai.models.generateImages({
        model: imageModel,
        prompt: prompt,
        config: {
            numberOfImages: IMAGE_GENERATION_PER_PROMPT,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    });

    return response.generatedImages.map(img => img.image.imageBytes);
};
