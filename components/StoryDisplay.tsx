
import React, { useState } from 'react';
import { StoryResult, StructuredPrompt } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";
import { generateImage } from '../services/geminiService';

interface StoryDisplayProps {
  data: StoryResult;
}

const PikhacuLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="40" stroke="black" strokeWidth="6" fill="transparent" />
    <path d="M20 35C25 25 35 20 50 20C65 20 75 25 80 35C75 45 65 50 50 50C35 50 25 45 20 35Z" fill="black" />
    <path d="M30 35C30 35 35 60 50 85C65 60 70 35 70 35C65 40 55 45 50 45C45 45 35 40 30 35Z" fill="black" />
    <path d="M35 15C32 15 25 22 28 32M65 15C68 15 75 22 72 32" stroke="black" strokeWidth="8" strokeLinecap="round" />
  </svg>
);

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function pcmToWav(pcmData: Uint8Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);
  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + pcmData.length, true);
  view.setUint32(8, 0x57415645, false);
  view.setUint32(12, 0x666d7420, false);
  view.setUint16(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, pcmData.length, true);
  const pcmArray = new Uint8Array(pcmData.buffer);
  for (let i = 0; i < pcmArray.length; i++) view.setUint8(44 + i, pcmArray[i]);
  return new Blob([buffer], { type: 'audio/wav' });
}

export const StoryDisplay: React.FC<StoryDisplayProps> = ({ data }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [sceneVoices, setSceneVoices] = useState<Record<number, string>>(
    data.scenes.reduce((acc, s) => ({ ...acc, [s.number]: 'Kore' }), {})
  );
  const [playingScene, setPlayingScene] = useState<number | null>(null);
  const [sceneAudioUrls, setSceneAudioUrls] = useState<Record<number, string>>({});
  const [activeVisualizer, setActiveVisualizer] = useState<{ scene: number, variant: string } | null>(null);
  const [visualizedImages, setVisualizedImages] = useState<Record<string, { url: string, ratio: "16:9" | "9:16" }>>({});
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null);

  const getConsolidatedPrompt = (p: StructuredPrompt) => `${p.subject}, ${p.action}, in ${p.environment}. Camera: ${p.camera_movement}. Lighting: ${p.lighting}. Style: ${p.visual_style_tags}`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleVisualize = async (prompt: string, id: string, ratio: "16:9" | "9:16") => {
    setIsGeneratingImage(id);
    setActiveVisualizer(null);
    try {
      const imageUrl = await generateImage(prompt, ratio);
      setVisualizedImages(prev => ({ ...prev, [id]: { url: imageUrl, ratio } }));
    } catch (err) {
      alert("Gagal memvisualisasikan gambar.");
    } finally {
      setIsGeneratingImage(null);
    }
  };

  const handlePlayVoice = async (text: string, sceneNum: number) => {
    if (playingScene !== null) return;
    if (sceneAudioUrls[sceneNum]) {
      playStoredAudio(sceneAudioUrls[sceneNum], sceneNum);
      return;
    }
    setPlayingScene(sceneNum);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: sceneVoices[sceneNum] } } },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBytes = decodeBase64(base64Audio);
        const wavBlob = pcmToWav(audioBytes, 24000);
        const url = URL.createObjectURL(wavBlob);
        setSceneAudioUrls(prev => ({ ...prev, [sceneNum]: url }));
        playStoredAudio(url, sceneNum);
      } else {
        setPlayingScene(null);
      }
    } catch (err) {
      setPlayingScene(null);
    }
  };

  const playStoredAudio = async (url: string, sceneNum: number) => {
    setPlayingScene(sceneNum);
    const audio = new Audio(url);
    audio.onended = () => setPlayingScene(null);
    audio.play();
  };

  const handleRefreshAudio = (sceneNum: number) => {
    if (sceneAudioUrls[sceneNum]) {
      URL.revokeObjectURL(sceneAudioUrls[sceneNum]);
      const nextUrls = { ...sceneAudioUrls };
      delete nextUrls[sceneNum];
      setSceneAudioUrls(nextUrls);
      setPlayingScene(null);
    }
  };

  const PromptGrid = ({ prompt, label, sceneNum, variant }: { prompt: StructuredPrompt, label: string, sceneNum: number, variant: string }) => {
    const id = `img-${sceneNum}-${variant}`;
    const visualized = visualizedImages[id];
    const isGenerating = isGeneratingImage === id;
    const consolidated = getConsolidatedPrompt(prompt);

    return (
      <div className="space-y-4 p-5 rounded-2xl bg-white/60 border border-black/5 hover:border-black/20 transition-all flex flex-col">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">{label}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => copyToClipboard(consolidated, `text-${sceneNum}-${variant}`)} className="text-[9px] font-black px-3 py-1.5 bg-white border border-black/10 rounded-lg text-black hover:bg-neutral-50 transition-all">
              {copied === `text-${sceneNum}-${variant}` ? 'COPIED' : 'COPY PROMPT'}
            </button>
            <div className="relative">
              <button 
                onClick={() => setActiveVisualizer(activeVisualizer?.scene === sceneNum && activeVisualizer?.variant === variant ? null : { scene: sceneNum, variant })} 
                disabled={isGenerating} 
                className="text-[9px] font-black px-3 py-1.5 border rounded-lg bg-black text-white hover:bg-neutral-800 transition-all disabled:opacity-50"
              >
                {isGenerating ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>} VISUAL
              </button>
              {activeVisualizer?.scene === sceneNum && activeVisualizer?.variant === variant && (
                <div className="absolute right-0 top-full mt-2 z-50 glass-effect p-2 rounded-xl border border-black/10 shadow-2xl min-w-[150px] animate-in fade-in zoom-in duration-200">
                   <button onClick={() => handleVisualize(consolidated, id, "16:9")} className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold text-black hover:bg-black hover:text-white transition-colors">16:9 (YouTube)</button>
                   <button onClick={() => handleVisualize(consolidated, id, "9:16")} className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold text-black hover:bg-black hover:text-white transition-colors">9:16 (TikTok)</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(prompt).map(([key, value]) => (
            <div key={key} className="bg-white p-2 rounded-lg border border-black/5">
              <div className="text-[8px] font-black text-black/30 uppercase mb-0.5">{key.replace('_', ' ')}</div>
              <p className="text-[10px] text-black font-semibold leading-tight line-clamp-2">{value}</p>
            </div>
          ))}
        </div>
        {visualized && !isGenerating && (
          <div className="mt-4 space-y-3 animate-in fade-in duration-500">
            <div className={`overflow-hidden rounded-xl border border-black/10 shadow-lg ${visualized.ratio === "9:16" ? "aspect-[9/16] max-w-[180px] mx-auto" : "aspect-video"}`}>
              <img src={visualized.url} className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2">
               <a href={visualized.url} download={`pikhacu_${sceneNum}_${variant}.png`} className="flex-1 py-2 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center hover:bg-neutral-800 transition-all">
                  <i className="fa-solid fa-download mr-1"></i> DOWNLOAD
               </a>
               <button onClick={() => handleVisualize(consolidated, id, visualized.ratio)} className="px-3 py-2 bg-white border border-black/10 rounded-xl hover:bg-neutral-50 transition-all">
                  <i className="fa-solid fa-rotate-right text-xs"></i>
               </button>
            </div>
          </div>
        )}
        {isGenerating && (
          <div className="mt-4 flex flex-col items-center justify-center p-8 bg-neutral-100/50 rounded-xl border border-dashed border-black/10 animate-pulse">
             <i className="fa-solid fa-spinner animate-spin text-black/20 text-2xl mb-2"></i>
             <span className="text-[10px] font-black text-black/30 uppercase">Generating Visual...</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Summary Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-effect p-8 rounded-3xl colorful-border shadow-2xl bg-white/80">
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex w-16 h-16 bg-black rounded-2xl items-center justify-center text-white shadow-lg"><PikhacuLogo className="w-10 h-10" /></div>
          <div>
            <span className="text-[10px] font-black text-black/30 uppercase tracking-[0.4em] mb-2 block">AI Fact Analyzer Engine</span>
            <h2 className="text-4xl font-bebas tracking-wide text-black">{data.title}</h2>
            <div className="flex gap-2 mt-2">
               <span className="px-2 py-0.5 bg-black text-white rounded text-[8px] font-black uppercase">{data.visualStyle}</span>
               <span className="px-2 py-0.5 bg-black/10 text-black rounded text-[8px] font-black uppercase">{data.language}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scenes List */}
      <div className="space-y-10">
        {data.scenes.map((scene, idx) => {
          const isSourceVerification = scene.tone === "SOURCE_VERIFICATION";

          return (
            <div key={scene.number} className={`glass-effect overflow-hidden rounded-3xl colorful-border group transition-all shadow-xl bg-white/60 ${isSourceVerification ? 'border-blue-500/30' : ''}`}>
              <div className={`px-8 py-4 border-b border-black/5 flex items-center justify-between ${isSourceVerification ? 'bg-blue-50' : 'bg-neutral-50'}`}>
                <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bebas text-2xl ${isSourceVerification ? 'bg-blue-600' : 'bg-black'}`}>
                     {isSourceVerification ? <i className="fa-solid fa-shield-check text-sm"></i> : scene.number}
                   </div>
                   <div>
                      <span className="font-bebas text-2xl tracking-wider text-black block leading-none uppercase">
                        {isSourceVerification ? "VERIFIKASI SUMBER TEPERCAYA" : "Sequence Part"}
                      </span>
                      <span className="text-[10px] text-black/40 font-black uppercase tracking-widest italic">{scene.tone}</span>
                   </div>
                </div>
                
                {/* Voice Selection & Controls for each scene */}
                <div className="flex items-center gap-3">
                  {!isSourceVerification && (
                    <select 
                      value={sceneVoices[scene.number]} 
                      onChange={(e) => { handleRefreshAudio(scene.number); setSceneVoices(prev => ({ ...prev, [scene.number]: e.target.value })); }}
                      className="bg-black text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest outline-none hover:bg-neutral-800 transition-all border border-white/10"
                    >
                      <optgroup label="Pria" className="bg-neutral-900">
                        <option value="Kore">Kore (Formal)</option>
                        <option value="Charon">Charon (Deep)</option>
                      </optgroup>
                      <optgroup label="Wanita" className="bg-neutral-900">
                        <option value="Puck">Puck (Ceria)</option>
                        <option value="Zephyr">Zephyr (Lembut)</option>
                      </optgroup>
                    </select>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handlePlayVoice(scene.narration, scene.number)} 
                      disabled={playingScene !== null} 
                      className="px-3 py-1.5 bg-black text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-neutral-800 transition-all disabled:opacity-50"
                    >
                      {playingScene === scene.number ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-play"></i>} PUTAR
                    </button>
                    {sceneAudioUrls[scene.number] && (
                      <>
                        <a href={sceneAudioUrls[scene.number]} download={`Pikhacu_Scene_${scene.number}.wav`} className="w-8 h-8 flex items-center justify-center bg-white border border-black/10 text-black rounded-lg hover:bg-black hover:text-white transition-all">
                          <i className="fa-solid fa-download text-[10px]"></i>
                        </a>
                        <button onClick={() => handleRefreshAudio(scene.number)} className="w-8 h-8 flex items-center justify-center bg-white border border-black/10 text-black rounded-lg hover:text-red-500 transition-all">
                          <i className="fa-solid fa-rotate-right text-[10px]"></i>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="relative space-y-6">
                  <div className={`absolute -left-4 top-0 bottom-0 w-1 rounded-full ${isSourceVerification ? 'bg-blue-500/20' : 'bg-black/10'}`}></div>
                  <p className={`text-xl md:text-2xl leading-relaxed font-bold italic p-6 rounded-2xl border transition-all ${isSourceVerification ? 'bg-blue-500/5 text-blue-900 border-blue-500/20' : 'bg-black/5 text-black border-black/5'}`}>
                    "{scene.narration}"
                  </p>
                </div>

                {!isSourceVerification && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PromptGrid prompt={scene.structuredPrompt1} label="CINEMATIC VARIANT A" sceneNum={scene.number} variant="a" />
                    <PromptGrid prompt={scene.structuredPrompt2} label="CINEMATIC VARIANT B" sceneNum={scene.number} variant="b" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Production Assets Section */}
      <div className="space-y-8 pt-16 border-t border-black/10">
        <div className="flex items-center gap-4">
          <PikhacuLogo className="w-8 h-8" />
          <h3 className="font-bebas text-4xl text-black tracking-widest uppercase">PRODUCTION ASSETS</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* TikTok Cover */}
          <div className="glass-effect p-8 rounded-[2rem] colorful-border bg-white space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-black font-black text-[10px] uppercase tracking-widest">
                <i className="fa-brands fa-tiktok text-lg"></i> TikTok Thumbnail (9:16)
              </span>
              <button 
                onClick={() => copyToClipboard(data.tiktokCover, 'tk')} 
                className="w-10 h-10 rounded-xl bg-black text-white hover:bg-neutral-800 transition-all flex items-center justify-center"
              >
                <i className={copied === 'tk' ? "fa-solid fa-check text-green-400" : "fa-solid fa-copy"}></i>
              </button>
            </div>
            <div className="p-5 bg-neutral-50 rounded-2xl border border-black/5 text-sm font-semibold italic text-black/70 leading-relaxed">
              {data.tiktokCover}
            </div>
          </div>

          {/* YouTube Cover */}
          <div className="glass-effect p-8 rounded-[2rem] colorful-border bg-white space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-black font-black text-[10px] uppercase tracking-widest">
                <i className="fa-brands fa-youtube text-lg"></i> YouTube Thumbnail (16:9)
              </span>
              <button 
                onClick={() => copyToClipboard(data.youtubeCover, 'yt')} 
                className="w-10 h-10 rounded-xl bg-black text-white hover:bg-neutral-800 transition-all flex items-center justify-center"
              >
                <i className={copied === 'yt' ? "fa-solid fa-check text-green-400" : "fa-solid fa-copy"}></i>
              </button>
            </div>
            <div className="p-5 bg-neutral-50 rounded-2xl border border-black/5 text-sm font-semibold italic text-black/70 leading-relaxed">
              {data.youtubeCover}
            </div>
          </div>
        </div>

        {/* Viral Hashtags */}
        <div className="glass-effect p-8 rounded-[2rem] border border-black/10 bg-white shadow-xl">
           <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-black/40 uppercase tracking-[0.4em]">Viral Engagement Strategy</span>
              <button 
                onClick={() => copyToClipboard(data.hashtags.join(' '), 'tags')} 
                className="px-4 py-1.5 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all"
              >
                {copied === 'tags' ? 'COPIED' : 'COPY ALL TAGS'}
              </button>
           </div>
           <div className="flex flex-wrap gap-3">
             {data.hashtags.map((tag, i) => (
               <span key={i} className="px-5 py-2.5 bg-white border border-black/10 rounded-xl text-xs font-black text-black uppercase hover:bg-black hover:text-white transition-all cursor-default shadow-sm">
                 {tag}
               </span>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};
