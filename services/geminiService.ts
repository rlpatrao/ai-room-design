import { GoogleGenAI, Modality } from "@google/genai";
import { decode, decodeAudioData, audioBufferToWav } from './audioUtils';
import { DesignStyle } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are Lumina, a world-class AI Interior Design Consultant. 
Your goal is to help users redesign their rooms. 
Be helpful, creative, and specific about furniture and color choices.
When searching for items, be precise.
`;

export async function generateDesignImage(
  base64Image: string, 
  style: string, 
  additionalPrompt: string = ""
): Promise<{ imageUrl: string; description: string }> {
  
  const prompt = `Redesign this room in a ${style} style. 
  Keep the structural elements (windows, walls, floor plan) exactly the same, 
  but replace the furniture, decor, and color palette to match the ${style} aesthetic. 
  ${additionalPrompt}
  High resolution, photorealistic, interior design photography.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      },
      config: {
        // Image generation specific config not fully available in simple generateContent for all models yet
        // depending on exact version, but prompting is key here.
        // For gemini-2.5-flash-image, it behaves as an image editor/generator.
      }
    });

    let imageUrl = '';
    let description = '';

    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            } else if (part.text) {
                description = part.text;
            }
        }
    }
    
    // Fallback if the model returns only text or fails to edit (rare but possible)
    if (!imageUrl) {
        throw new Error("No image generated. Please try again.");
    }

    return { imageUrl, description };

  } catch (error) {
    console.error("Error generating design:", error);
    throw error;
  }
}

export async function generateChatResponse(
  history: { role: string; text: string }[],
  currentMessage: string,
  contextImage?: string,
  currentStyle?: string
): Promise<{ text: string; groundingLinks?: any[] }> {
  
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }] // Enable search for shoppable links
    }
  });

  // Reconstruct history roughly if needed, or just send context + message
  // For simplicity and to include the image context efficiently for this turn:
  
  const parts: any[] = [{ text: currentMessage }];
  
  if (contextImage) {
    parts.unshift({
        inlineData: {
            mimeType: 'image/jpeg',
            data: contextImage
        }
    });
    parts.unshift({
        text: `(User is looking at a design in ${currentStyle || 'unknown'} style).`
    });
  }

  // Note: For a real persistent chat, we'd replay history. 
  // Here we treat it as a refined query on the current state.
  
  const response = await chat.sendMessage({ 
      message: { 
          role: 'user', 
          parts: parts 
      } 
  });

  const text = response.text || "I couldn't generate a text response.";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

  return { text, groundingLinks: groundingChunks };
}

export async function generateSpeech(text: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Fenrir, Kore, Puck, Charon, Zephyr
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data received");

        // Decode and convert to play-able blob
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const audioBuffer = await decodeAudioData(
            decode(base64Audio),
            audioContext,
            24000,
            1
        );

        const wavBlob = audioBufferToWav(audioBuffer);
        return URL.createObjectURL(wavBlob);

    } catch (error) {
        console.error("TTS Error:", error);
        return "";
    }
}