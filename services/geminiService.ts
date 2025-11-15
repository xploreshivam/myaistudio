
const OPENAI_API_KEY = "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";
const API_URL = "https://api.openai.com/v1";

const textModel = 'gpt-4o';
const imageModel = 'dall-e-3';
const ttsModel = 'tts-1';
const ttsVoice = 'nova'; // A female voice, options: alloy, echo, fable, onyx, nova, shimmer

// Note: Using a smaller number for demonstration purposes to avoid excessive API calls.
const TITLE_COUNT = 5;
const IMAGE_GENERATION_PER_PROMPT = 1;

// Helper function to handle OpenAI API calls
async function fetchOpenAI(endpoint: string, body: object, isAudio = false) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // try to parse error, but don't fail if it's not JSON
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    if (isAudio) {
        return response.blob();
    }
    return response.json();
}

export const generateTitles = async (topic: string): Promise<string[]> => {
    const prompt = `Pregnancy topic "${topic}" par ${TITLE_COUNT} YouTube titles generate karo. Titles 100% unique, curiosity-based, emotional hook wale ho. Indian women ke perspective ke hisaab se likho. Words ‘Ladka’, ‘Safed Pani’, ‘Pregnancy Test Kit’, ‘Ultrasound’, ‘Ovulation’, ‘Implantation’, ‘Symptoms’ ka smart use karo. Title aise ho ki user turant click kare. koi heading mat dena, बस titles numbered list me do.`;
    
    const data = await fetchOpenAI('/chat/completions', {
        model: textModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
    });

    const rawText = data.choices[0].message.content;
    return rawText.split('\n').map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
};

export const generateScript = async (title: string): Promise<string> => {
    const prompt = `"${title}" ,  es par ek YouTube video script likho without heading with proper hooks give only answer LIKE EXPERT, please deep and unique insight, my video length is 1 to 1.2 minutes only, please make shorts as soon as possible and give clear answer, in completely dev Nagri , do not use full stop beyond use comma, like indian youtuber angry prash in hindi , speaker is female , make sure in devnagri, start with dekhiye   and  question , only give accurate answer only , make sure use comma,`;

    const data = await fetchOpenAI('/chat/completions', {
        model: textModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8
    });
    
    return data.choices[0].message.content;
};

export const generateAudio = async (script: string): Promise<Blob> => {
    const blob = await fetchOpenAI('/audio/speech', {
        model: ttsModel,
        input: script,
        voice: ttsVoice,
        response_format: 'mp3'
    }, true);
    return blob as Blob;
};

export const generateThumbnailPrompt = async (title: string): Promise<string> => {
    const prompt = `Generate a single, compelling, and photorealistic YouTube thumbnail image prompt for a video titled: "${title}". The prompt should describe a visually striking image with a clear focal point, vibrant colors, and an emotionally engaging scene relevant to an Indian audience. Do not include any text in the image description. The output should be only the prompt text, without any labels or quotes.`;
    
    const data = await fetchOpenAI('/chat/completions', {
        model: textModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
    });
    
    return data.choices[0].message.content.trim();
};

export const generateImages = async (prompt: string): Promise<string[]> => {
    const data = await fetchOpenAI('/images/generations', {
        model: imageModel,
        prompt: prompt,
        n: IMAGE_GENERATION_PER_PROMPT,
        size: '1792x1024', // DALL-E 3 16:9 aspect ratio
        response_format: 'b64_json',
        quality: 'hd'
    });

    return data.data.map((img: { b64_json: string }) => img.b64_json);
};
