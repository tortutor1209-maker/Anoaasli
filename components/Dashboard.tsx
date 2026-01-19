
import React from 'react';

interface DashboardProps {
  onSelectStory: () => void;
  onSelectAffiliate: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectStory, onSelectAffiliate }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-12 py-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="text-center space-y-4">
        <h2 className="text-5xl md:text-7xl font-bebas tracking-tighter text-black">
          MODUL <span className="colorful-text">COMMAND CENTER</span>
        </h2>
        <p className="text-black/60 font-black text-xs uppercase tracking-[0.4em]">
          Silahkan pilih modul yang ingin anda gunakan
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Story Button */}
        <button 
          onClick={onSelectStory}
          className="group relative overflow-hidden bg-white p-8 md:p-10 rounded-[2.5rem] colorful-border hover:scale-[1.01] transition-all text-left flex items-center justify-between shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center gap-8">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-black border border-black/10 rounded-3xl flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-wand-magic-sparkles text-3xl md:text-4xl"></i>
            </div>
            <div>
              <h3 className="font-bebas text-3xl md:text-5xl text-black tracking-widest leading-none mb-2 uppercase">TOOLS FAKTA MENARIK</h3>
              <p className="text-black/40 text-xs md:text-sm font-black uppercase tracking-wider">Cinematic Educational Storytelling with AI Engine v4</p>
            </div>
          </div>
          <i className="fa-solid fa-chevron-right text-black/10 group-hover:text-black group-hover:translate-x-2 transition-all text-3xl hidden md:block"></i>
        </button>

        {/* Affiliate Button */}
        <button 
          onClick={onSelectAffiliate}
          className="group relative overflow-hidden bg-white p-8 md:p-10 rounded-[2.5rem] colorful-border hover:scale-[1.01] transition-all text-left flex items-center justify-between shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center gap-8">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-black border border-black/10 rounded-3xl flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-cart-shopping text-3xl md:text-4xl"></i>
            </div>
            <div>
              <h3 className="font-bebas text-3xl md:text-5xl text-black tracking-widest leading-none mb-2 uppercase">TOOLS AFILIATE PRODUK</h3>
              <p className="text-black/40 text-xs md:text-sm font-black uppercase tracking-wider">Auto-Optimize Product Marketing Content</p>
            </div>
          </div>
          <i className="fa-solid fa-chevron-right text-black/10 group-hover:text-black group-hover:translate-x-2 transition-all text-3xl hidden md:block"></i>
        </button>
      </div>

      <div className="flex justify-center pt-10">
         <div className="px-6 py-3 bg-white border border-black/10 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="flex -space-x-2">
               {[1,2,3,4].map(i => <div key={i} className="w-6 h-6 rounded-full bg-neutral-200 border border-white"></div>)}
            </div>
            <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">Join 2,400+ Active Creators</span>
         </div>
      </div>
    </div>
  );
};
