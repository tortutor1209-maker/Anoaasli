
import { GoogleGenAI, Type } from "@google/genai";
import { StoryRequest, StoryResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStoryContent = async (req: StoryRequest): Promise<StoryResult> => {
  const { title, numScenes, visualStyle, language } = req;

  const systemInstruction = `
    Peran Anda:
    Anda adalah AI Fact-Based Content Analyzer (ANOALABS ULTIMATE v4) yang bertugas memverifikasi, menganalisis, dan menyusun konten berbasis fakta yang dapat diverifikasi dari media tepercaya Indonesia.

    Tujuan Utama:
    Setiap permintaan user yang mengandung berita, fakta menarik, atau klaim informasi WAJIB diverifikasi terlebih dahulu sebelum diubah menjadi scene konten.

    ATURAN SUMBER (WAJIB):
    Gunakan hanya sumber media tepercaya, prioritas utama: detik.com, cnnindonesia.com, kompas.com.
    Jika memungkinkan, gunakan minimal 2 sumber berbeda untuk satu fakta.

    Tolak atau beri peringatan jika:
    - Sumber tidak jelas.
    - Berasal dari opini pribadi, gosip, atau akun media sosial tanpa rujukan media tepercaya.
    Jangan mengarang fakta. Jika data tidak ditemukan, nyatakan secara eksplisit: “Fakta ini tidak ditemukan pada sumber tepercaya.”

    ATURAN JUMLAH SCENE (PENTING):
    Jika user meminta N scene, maka:
    Buat N + 1 scene.
    Scene tambahan (scene terakhir) wajib berisi:
    - Penjelasan sumber berita
    - Nama media
    - Ringkasan verifikasi fakta
    - (Wajib) Tahun/tanggal publikasi berita

    STRUKTUR OUTPUT SCENE (JSON):
    Scene 1 to N: Storytelling cinematic.
    Scene N+1: Tone MUST be "SOURCE_VERIFICATION". Narration MUST contain:
    "MEDIA: [Nama Media] | JUDUL BERITA: [Judul] | RINGKASAN: [Ringkasan] | VALIDASI: [Alasan Tepercaya]".

    ASSETS PRODUKSI:
    1. tiktokCover: Prompt cinematic rasio 9:16 menyesuaikan judul dan gaya visual.
    2. youtubeCover: Prompt cinematic rasio 16:9 menyesuaikan judul dan gaya visual.
    3. hashtags: Daftar 5 hashtag viral sesuai judul.

    Visual Style for Prompts: Every 'subject' MUST start with: "${visualStyle}".
  `;

  const prompt = `Lakukan verifikasi fakta dan buatkan storytelling edukatif sinematik tentang: "${title}". User meminta ${numScenes} scene cerita. Anda wajib menghasilkan total ${numScenes + 1} scene (N+1 rule). Gaya: "${visualStyle}". Bahasa: ${language}`;

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
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 5, maxItems: 5 }
        },
        required: ['title', 'numScenes', 'visualStyle', 'language', 'scenes', 'tiktokCover', 'youtubeCover', 'hashtags']
      }
    }
  });

  const jsonStr = response.text || '{}';
  return JSON.parse(jsonStr) as StoryResult;
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
    Kamu adalah ANOALABS UGC TOOL - Pakar AI Video & Affiliate Marketing.
    Tugas: Menghasilkan Video Prompt untuk VEO 3.1 & FLOW dengan fitur LIP-SYNC & VOICE PROMOTION.
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
