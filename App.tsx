
import React, { useState, useEffect } from 'react';
import { StoryForm } from './components/StoryForm';
import { StoryDisplay } from './components/StoryDisplay';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { AffiliateModule } from './components/AffiliateModule';
import { APP_CONFIG } from './constants';
import { StoryRequest, StoryResult } from './types';
import { generateStoryContent } from './services/geminiService';

const PikhacuLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="40" stroke="black" strokeWidth="6" fill="transparent" />
    <path 
      d="M20 35C25 25 35 20 50 20C65 20 75 25 80 35C75 45 65 50 50 50C35 50 25 45 20 35Z" 
      fill="black" 
    />
    <path 
      d="M30 35C30 35 35 60 50 85C65 60 70 35 70 35C65 40 55 45 50 45C45 45 35 40 30 35Z" 
      fill="black" 
    />
    <path 
      d="M35 15C32 15 25 22 28 32M65 15C68 15 75 22 72 32" 
      stroke="black" 
      strokeWidth="8" 
      strokeLinecap="round" 
    />
  </svg>
);

type ViewState = 'auth' | 'dashboard' | 'story' | 'affiliate';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('auth');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StoryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('anoalabs_current_user');
    if (savedUser) {
      setIsLoggedIn(true);
      setView('dashboard');
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('anoalabs_current_user');
    setIsLoggedIn(false);
    setView('auth');
    setResult(null);
  };

  const handleGenerateStory = async (data: StoryRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const generatedData = await generateStoryContent(data);
      setResult(generatedData);
      setTimeout(() => {
        const resultSection = document.getElementById('story-result');
        if (resultSection) resultSection.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err: any) {
      console.error(err);
      setError('Gagal membuat cerita. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  const resetToDashboard = () => {
    setResult(null);
    setView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-black selection:text-white">
      <header className="sticky top-0 z-50 glass-effect border-b border-black/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={isLoggedIn ? resetToDashboard : undefined}>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white border border-black/10 rounded-xl md:rounded-2xl flex items-center justify-center text-black shadow-lg transition-transform hover:scale-105 active:scale-95">
              <PikhacuLogo className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <div>
              <h1 className="font-bebas text-2xl md:text-3xl tracking-widest colorful-text leading-none uppercase">{APP_CONFIG.NAME}</h1>
              <p className="text-[10px] font-bold colorful-text uppercase tracking-[0.2em]">{APP_CONFIG.VERSION}</p>
            </div>
          </div>
          
          {isLoggedIn && (
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-black border border-black/10 rounded-full text-[10px] font-bold text-white uppercase tracking-widest hover:bg-neutral-800 transition-all"
            >
              Logout <i className="fa-solid fa-right-from-bracket ml-2"></i>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-12">
        {view === 'auth' && (
          <AuthForm onLoginSuccess={handleLoginSuccess} />
        )}

        {view === 'dashboard' && (
          <Dashboard 
            onSelectStory={() => setView('story')} 
            onSelectAffiliate={() => setView('affiliate')} 
          />
        )}

        {view === 'story' && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <section className="text-center space-y-4">
               <button 
                onClick={resetToDashboard}
                className="bg-black border border-black/10 px-6 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 mx-auto mb-4 hover:bg-neutral-900 transition-all"
              >
                <i className="fa-solid fa-arrow-left"></i> Dashboard
              </button>
              <h2 className="text-4xl md:text-6xl font-bebas tracking-tighter text-black">
                TOOLS <span className="colorful-text">PIKHACU STORY</span>
              </h2>
              <p className="text-black/60 max-w-xl mx-auto text-sm leading-relaxed font-semibold">
                Generate unlimited educational cinematic stories optimized for TikTok & Reels.
              </p>
            </section>
            
            <div className="max-w-2xl mx-auto">
              <StoryForm onSubmit={handleGenerateStory} isLoading={loading} />
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm flex items-center gap-3">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {error}
                </div>
              )}
            </div>

            {result && (
              <div id="story-result" className="pt-8">
                <StoryDisplay data={result} />
              </div>
            )}
          </div>
        )}

        {view === 'affiliate' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <button 
                onClick={resetToDashboard}
                className="bg-black border border-black/10 px-6 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 mx-auto hover:bg-neutral-900 transition-all"
              >
                <i className="fa-solid fa-arrow-left"></i> Kembali ke Dashboard
              </button>
              <AffiliateModule />
          </div>
        )}
      </main>

      <footer className="mt-20 py-10 border-t border-black/5 text-center">
        <p className="text-black/30 text-[10px] uppercase tracking-widest font-black">
          © {new Date().getFullYear()} {APP_CONFIG.NAME} • UNLIMITED CINEMATIC ENGINE
        </p>
      </footer>
    </div>
  );
};

export default App;
