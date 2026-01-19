
import React, { useState } from 'react';
import { APP_CONFIG } from '../constants';

interface AuthFormProps {
  onLoginSuccess: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alert, setAlert] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  const showAlert = (message: string, type: 'error' | 'success' = 'error') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const validateGmail = (email: string) => {
    return email.toLowerCase().endsWith('@gmail.com');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return showAlert('Harap isi semua bidang');
    
    if (!validateGmail(email)) {
      return showAlert('email tidak terdeteksi coba masukan email dengan benar');
    }

    if (password.length < 6) {
      return showAlert('Sandi harus lebih dari 5 digit');
    }

    const users = JSON.parse(localStorage.getItem('anoalabs_users') || '[]');
    if (users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      return showAlert('Email sudah terdaftar, silakan gunakan email lain');
    }

    users.push({ email, password });
    localStorage.setItem('anoalabs_users', JSON.stringify(users));
    showAlert('Akun berhasil dibuat! Silahkan login.', 'success');
    setMode('login');
    setPassword('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateGmail(email)) {
      return showAlert('email tidak terdeteksi coba masukan email dengan benar');
    }

    if (password.length < 6) {
      return showAlert('Sandi harus lebih dari 5 digit');
    }

    const users = JSON.parse(localStorage.getItem('anoalabs_users') || '[]');
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return showAlert('Email belum terdaftar, silakan buat akun terlebih dahulu');
    }

    if (user.password !== password) {
      return showAlert('sandi anda salah mohon periksa ulang sandi anda');
    }

    localStorage.setItem('anoalabs_current_user', JSON.stringify(user));
    onLoginSuccess();
  };

  return (
    <div className="max-w-md mx-auto mt-10 space-y-8 animate-in fade-in zoom-in duration-500">
      {/* Dynamic Top Alert */}
      {alert && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl border shadow-2xl animate-in slide-in-from-top-4 duration-300 ${
          alert.type === 'error' ? 'bg-red-600 border-red-700 text-white' : 'bg-green-600 border-green-700 text-white'
        }`}>
          <div className="flex items-center gap-3 font-bold text-sm tracking-wide">
            <i className={`fa-solid ${alert.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
            {alert.message}
          </div>
        </div>
      )}

      <div className="text-center space-y-2">
        <h2 className="text-6xl font-bebas tracking-[0.1em] colorful-text uppercase">
          {APP_CONFIG.NAME}
        </h2>
        <p className="colorful-text text-[10px] font-black uppercase tracking-[0.4em]">
          {APP_CONFIG.VERSION} • ACCESS SYSTEM
        </p>
      </div>

      <div className="glass-effect p-8 rounded-[2rem] colorful-border shadow-2xl relative overflow-hidden">
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-black ml-1">Email (@gmail.com)</label>
            <div className="relative group">
              <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-black transition-colors"></i>
              <input
                type="email"
                placeholder="emailanda@gmail.com"
                className="w-full bg-neutral-900 border border-black/5 rounded-xl pl-12 pr-4 py-4 text-white font-medium placeholder:text-white/20 focus:outline-none focus:border-black/20 transition-all shadow-inner"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-black ml-1">Password</label>
            <div className="relative group">
              <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-black transition-colors"></i>
              <input
                type="password"
                placeholder="Password (Min. 6 digit)"
                className="w-full bg-neutral-900 border border-black/5 rounded-xl pl-12 pr-4 py-4 text-white font-medium placeholder:text-white/20 focus:outline-none focus:border-black/20 transition-all shadow-inner"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-black hover:bg-neutral-900 text-white border border-black/10 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-2xl transform active:scale-95 flex items-center justify-center gap-2 group"
          >
            {mode === 'login' ? (
              <>
                MASUK SEKARANG 
                <i className="fa-solid fa-right-to-bracket group-hover:translate-x-1 transition-transform opacity-50"></i>
              </>
            ) : (
              <>
                DAFTAR AKUN
                <i className="fa-solid fa-user-plus group-hover:scale-110 transition-transform opacity-50"></i>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-black/5 text-center">
          <p className="text-black/40 text-[10px] font-bold uppercase tracking-widest mb-3">
            {mode === 'login' ? 'Belum punya akses?' : 'Sudah punya akun?'}
          </p>
          <button 
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setAlert(null);
            }}
            className="text-black hover:underline font-black text-[10px] uppercase tracking-[0.2em] transition-colors pb-1"
          >
            {mode === 'login' ? 'Buat Akun Baru' : 'Login ke Akun'}
          </button>
        </div>
      </div>
    </div>
  );
};
