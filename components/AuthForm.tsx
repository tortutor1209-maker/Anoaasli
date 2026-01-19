
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
    if (!validateGmail(email)) return showAlert('email tidak terdeteksi coba masukan email dengan benar');
    if (password.length < 6) return showAlert('Sandi harus lebih dari 5 digit');

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
    if (!validateGmail(email)) return showAlert('email tidak terdeteksi coba masukan email dengan benar');
    if (password.length < 6) return showAlert('Sandi harus lebih dari 5 digit');

    const users = JSON.parse(localStorage.getItem('anoalabs_users') || '[]');
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) return showAlert('Email belum terdaftar, silakan buat akun terlebih dahulu');
    if (user.password !== password) return showAlert('sandi anda salah mohon periksa ulang sandi anda');

    localStorage.setItem('anoalabs_current_user', JSON.stringify(user));
    onLoginSuccess();
  };

  return (
    <div className="max-w-md mx-auto mt-10 space-y-8 animate-in fade-in zoom-in duration-500">
      {alert && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl border shadow-2xl ${
          alert.type === 'error' ? 'bg-red-600 border-red-700 text-white' : 'bg-green-600 border-green-700 text-white'
        }`}>
          <div className="flex items-center gap-3 font-bold text-sm">
            <i className={`fa-solid ${alert.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
            {alert.message}
          </div>
        </div>
      )}

      <div className="text-center space-y-2">
        <h2 className="text-6xl font-bebas tracking-[0.1em] colorful-text uppercase">{APP_CONFIG.NAME}</h2>
        <p className="colorful-text text-[10px] font-black uppercase tracking-[0.4em]">{APP_CONFIG.VERSION} • FACT ANALYZER ACCESS</p>
      </div>

      <div className="glass-effect p-8 rounded-[2rem] colorful-border shadow-2xl relative overflow-hidden">
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-black ml-1">Email (@gmail.com)</label>
            <input
              type="email"
              placeholder="emailanda@gmail.com"
              className="w-full bg-neutral-900 border border-black/5 rounded-xl px-4 py-4 text-white focus:outline-none shadow-inner"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-black ml-1">Password</label>
            <input
              type="password"
              placeholder="Min. 6 digit"
              className="w-full bg-neutral-900 border border-black/5 rounded-xl px-4 py-4 text-white focus:outline-none shadow-inner"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="w-full py-4 bg-black text-white border border-black/10 font-black text-xs uppercase tracking-widest rounded-xl shadow-2xl active:scale-95 transition-all">
            {mode === 'login' ? 'MASUK SEKARANG' : 'DAFTAR AKUN'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-black/5 text-center">
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-black hover:underline font-black text-[10px] uppercase tracking-widest">
            {mode === 'login' ? 'Buat Akun Baru' : 'Login ke Akun'}
          </button>
        </div>
      </div>
    </div>
  );
};
