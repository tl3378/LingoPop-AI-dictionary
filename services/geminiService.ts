import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Language, WordEntry, ScanResult } from "../types";
import { playAudio } from "./audioUtils";

// Helper to get AI instance with latest key
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const lookupWord = async (
  input: string, 
  nativeLang: Language, 
  targetLang: Language
): Promise<Omit<WordEntry, 'id' | 'createdAt' | 'imageUrl'>> => {
  const ai = getAi();
  
  const prompt = `
    You are a world-class sociolinguist and a "cool" language coach. 
    Analyze the input: "${input}". 
    The user's native language is "${nativeLang}" and they are learning "${targetLang}".
    
    The input could be a single word, a phrase, or a description of an INTENT.
    
    CRITICAL RULES:
    1. "scenario" MUST be EXACTLY ONE OF: Academic, Formal, Social, Meme, Daily. DO NOT add explanations here.
    2. "posture" MUST be EXACTLY ONE OF: Neutral, Friendly, Ironic, Reserved, Direct. DO NOT add explanations here.
    3. "pragmaticNote" (Cultural Logic) is MANDATORY. Explain the hidden social vibration in ${nativeLang}. Why choose THIS expression?
    4. "usageNote" is your "Coach's Private Talk". Write it in ${nativeLang}.
    
    Output JSON format:
    {
      "term": "The most appropriate primary term in ${targetLang}",
      "nativeDefinition": "Concise summary in ${nativeLang}",
      "variants": [
        {
          "expression": "Full phrase in ${targetLang}",
          "scenario": "Meme", 
          "posture": "Confident",
          "pragmaticNote": "Explain the cultural vibe in ${nativeLang}"
        }
      ],
      "usageNote": "Detailed tip in ${nativeLang}",
      "synonyms": ["concept1", "concept2"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            term: { type: Type.STRING },
            nativeDefinition: { type: Type.STRING },
            variants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  expression: { type: Type.STRING },
                  scenario: { 
                    type: Type.STRING, 
                    description: "Strictly one of: Academic, Formal, Social, Meme, Daily" 
                  },
                  posture: { 
                    type: Type.STRING,
                    description: "Strictly one of: Neutral, Friendly, Ironic, Reserved, Direct, Confident"
                  },
                  pragmaticNote: { type: Type.STRING }
                },
                required: ["expression", "scenario", "posture", "pragmaticNote"]
              }
            },
            usageNote: { type: Type.STRING },
            synonyms: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["term", "nativeDefinition", "variants", "usageNote"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini lookupWord Error:", error);
    if (error instanceof Error && (error.message.includes("404") || error.message.includes("not found"))) {
        const fallbackResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(fallbackResponse.text || "{}");
    }
    throw error;
  }
};

export const scanAndTranslateImage = async (
  base64Image: string,
  nativeLang: Language,
  targetLang: Language
): Promise<ScanResult[]> => {
  const ai = getAi();
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  const prompt = `Analyze text in image. Target: ${nativeLang}.`;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            phonetic: { type: Type.STRING },
            translation: { type: Type.STRING },
          }
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}

export const generateWordImage = async (term: string): Promise<string | undefined> => {
  const ai = getAi();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: `High-quality, vibrant vector art illustration related to: ${term}`
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e) { 
    return undefined; 
  }
};

export const speakText = async (text: string) => {
  const ai = getAi();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) await playAudio(base64Audio);
  } catch (e) {
    console.error("TTS error", e);
  }
};

export const generateStory = async (words: WordEntry[], nativeLang: Language, targetLang: Language) => {
  const ai = getAi();
  const wordList = words.map(w => w.term).join(', ');
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Funny story in ${targetLang} using: ${wordList}. Translate: ${nativeLang}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          story: { type: Type.STRING },
          translation: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const chatWithAi = async (history: any[], message: string, contextWord: string, targetLang: Language) => {
    const ai = getAi();
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: `Expert language tutor for ${targetLang}. Focus on slang and culture.` },
        history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
    });
    const result = await chat.sendMessage({ message });
    return result.text;
}