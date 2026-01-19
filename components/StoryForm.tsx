
import React, { useState } from 'react';
import { VisualStyle, Language, StoryRequest } from '../types';
import { VISUAL_STYLES, LANGUAGES } from '../constants';

interface StoryFormProps {
  onSubmit: (data: StoryRequest) => void;
  isLoading: boolean;
}

export const StoryForm: React.FC<StoryFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<StoryRequest>({
    title: '',
    numScenes: 5,
    visualStyle: VisualStyle.SoftClayPixar3D,
    language: Language.Indonesian
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-effect p-6 rounded-[2rem] space-y-6 colorful-border shadow-2xl">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-black ml-1">Judul Storytelling</label>
        <input
          type="text"
          placeholder="Topik: Keajaiban Semesta"
          className="w-full bg-neutral-900 border border-black/5 rounded-xl px-4 py-4 focus:outline-none focus:border-black/10 transition-all text-white placeholder:text-white/20 shadow-inner"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-black ml-1">Jumlah Scene</label>
          <input
            type="number"
            min="1"
            max="15"
            className="w-full bg-neutral-900 border border-black/5 rounded-xl px-4 py-4 focus:outline-none focus:border-black/10 transition-all text-white shadow-inner"
            value={formData.numScenes}
            onChange={(e) => setFormData({ ...formData, numScenes: parseInt(e.target.value) || 1 })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-black ml-1">Bahasa Narasi</label>
          <select
            className="w-full bg-neutral-900 border border-black/5 rounded-xl px-4 py-4 focus:outline-none focus:border-black/10 transition-all text-white appearance-none shadow-inner"
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value as Language })}
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang} className="bg-neutral-900 text-white">{lang}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-black ml-1">Gaya Visual</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VISUAL_STYLES.map(style => (
            <button
              key={style}
              type="button"
              onClick={() => setFormData({ ...formData, visualStyle: style })}
              className={`text-left px-4 py-3 rounded-xl border text-[11px] font-black transition-all shadow-sm ${
                formData.visualStyle === style 
                ? 'bg-black border-black/20 text-white' 
                : 'bg-white border-black/5 text-black/30 hover:border-black/10 hover:text-black/60'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !formData.title}
        className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all transform active:scale-95 border border-black/10 ${
          isLoading ? 'bg-neutral-800 cursor-not-allowed text-white/40' : 'bg-black text-white hover:bg-neutral-900 shadow-2xl'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <i className="fa-solid fa-spinner animate-spin opacity-50"></i> GENERATING SEQUENCE...
          </span>
        ) : (
          'START PROMPTING'
        )}
      </button>
    </form>
  );
};
