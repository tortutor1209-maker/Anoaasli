
import { GoogleGenAI, Type } from "@google/genai";
import { StoryRequest, StoryResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStoryContent = async (req: StoryRequest): Promise<StoryResult> => {
  const { title, numScenes, visualStyle, language } = req;

  const systemInstruction = `
    You are PIKHACU.AI ULTIMATE v4, a professional AI Fact-Based Content Analyzer and Cinematic Storytelling Architect.
    
    CORE MISSION:
    Verify, analyze, and structure educational content based on verifiable facts from trusted Indonesian media (detik.com, cnnindonesia.com, kompas.com).
    
    FACT-CHECKING RULES (MANDATORY):
    1. VERIFICATION: Before creating scenes, verify every claim via Google Search.
    2. SOURCES: Use ONLY trusted Indonesian media: detik.com, cnnindonesia.com, kompas.com.
    3. VALIDATION: Match dates, context, and news content. Do NOT hallucinate.
    4. NO FACT = NO SCENE: If a fact is not found in trusted sources, explicitly state: "Fakta ini tidak ditemukan pada sumber tepercaya."

    SCENE COUNT RULE (N+1):
    - User requested: ${numScenes} scenes.
    - You MUST generate: ${numScenes + 1} scenes.
    - SCENE ${numScenes + 1} (The Last Scene) is the SOURCE VERIFICATION SCENE.
    - Tone for the last scene MUST be: "SOURCE_VERIFICATION".
    - Narration for the last scene MUST follow this format:
      "MEDIA: [Name of media] | JUDUL BERITA: [News Title] | RINGKASAN: [Short factual summary] | VALIDASI: Mengapa sumber ini tepercaya."

    CINEMATIC PROMPT RULES:
    1. DUAL STRUCTURED PROMPTING for scenes 1 to ${numScenes}.
    2. Visual Identity: Every 'subject' MUST start with: "${visualStyle}".
    3. Narration limit: ~20-25 words per scene (educational and dense).

    OUTPUT FORMAT: Strict JSON.
  `;

  const prompt = `Lakukan verifikasi fakta dan buatkan storytelling edukatif sinematik tentang: "${title}". Buatkan total ${numScenes + 1} scene (termasuk 1 scene verifikasi sumber di akhir). Gaya: "${visualStyle}". Bahasa: ${language}`;

  const structuredPromptSchema = {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING },
      action: { type: Type.STRING },
      environment: { type: Type.STRING },
      camera_movement: { type: Type.STRING },
      lighting: { type: Type.STRING },
      visual_style_tags: { type: Type.STRING }
    },
    required: ['subject', 'action', 'environment', 'camera_movement', 'lighting', 'visual_style_tags']
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          numScenes: { type: Type.NUMBER },
          visualStyle: { type: Type.STRING },
          language: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                number: { type: Type.NUMBER },
                narration: { type: Type.STRING },
                tone: { type: Type.STRING },
                structuredPrompt1: structuredPromptSchema,
                structuredPrompt2: structuredPromptSchema
              },
              required: ['number', 'narration', 'tone', 'structuredPrompt1', 'structuredPrompt2']
            }
          },
          tiktokCover: { type: Type.STRING },
          youtubeCover: { type: Type.STRING },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['title', 'numScenes', 'visualStyle', 'language', 'scenes', 'tiktokCover', 'youtubeCover', 'hashtags']
      }
    }
  });

  const jsonStr = response.text || '{}';
  const result = JSON.parse(jsonStr) as StoryResult;
  
  // Extract URLs from grounding metadata if available to add transparency
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks && result.scenes.length > 0) {
    const lastScene = result.scenes[result.scenes.length - 1];
    const urls = groundingChunks
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => chunk.web.uri);
    
    if (urls.length > 0) {
      lastScene.narration += `\n\nREFERENSI URL: ${urls.join(', ')}`;
    }
  }

  return result;
};

export const generateAffiliateContent = async (
  productName: string, 
  customInstructions: string, 
  productImg: string | undefined, 
  modelImg: string | undefined,
  style: string,
  numScenes: number
) => {
  const systemInstruction = `
    Kamu adalah PIKHACU UGC TOOL - Pakar AI Video & Affiliate Marketing.
    Tugas: Menghasilkan Video Prompt untuk VEO 3.1 & FLOW dengan fitur LIP-SYNC & VOICE PROMOTION.

    Gaya Konten: ${style}
    Target Jumlah Adegan: ${numScenes}

    ATURAN EMAS VIDEO PROMPT (VEO 3 / FLOW):
    1. VOICE SYNC (WAJIB): Sertakan narasi promosi spesifik dalam Bahasa Indonesia di dalam prompt. 
    2. AFFILIATE PERSUASION: Dialog harus persuasif untuk produk ${productName}.
    3. VISUAL LOCK: Sebutkan detail visual produk dari gambar.
    4. TECHNICAL: Instruction "Natural mouth movements", "8k cinematic".

    OUTPUT STRUCTURE: JSON (summary, caption, assets).
  `;

  const parts: any[] = [{ text: `Generate ${numScenes} scenes for "${productName}" in style "${style}".` }];
  if (productImg) parts.push({ inlineData: { mimeType: "image/png", data: productImg.split(',')[1] } });
  if (modelImg) parts.push({ inlineData: { mimeType: "image/png", data: modelImg.split(',')[1] } });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          caption: { type: Type.STRING },
          assets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                imagePrompt: { type: Type.STRING },
                videoPrompt: { type: Type.STRING }
              },
              required: ['label', 'imagePrompt', 'videoPrompt']
            }
          }
        },
        required: ['summary', 'caption', 'assets']
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateImage = async (prompt: string, aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1", referenceImg?: string): Promise<string> => {
  const parts: any[] = [{ text: `High quality cinematic photo. ${prompt}` }];
  if (referenceImg) parts.push({ inlineData: { mimeType: "image/png", data: referenceImg.split(',')[1] } });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: { imageConfig: { aspectRatio } },
  });

  const responseParts = response.candidates?.[0]?.content?.parts || [];
  for (const part of responseParts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Gagal generate gambar.");
};
