import React, { useState } from 'react';
import {
  Crown,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Cpu,
  ArrowRight,
  Terminal,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../services/api';

interface FounderLoginPageProps {
  onLoginSuccess: (user: any) => void;
}

export const FounderLoginPage: React.FC<FounderLoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Harap masukkan email dan kata sandi Founder.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.login(email.trim(), password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Kredensial tidak valid atau tidak memiliki hak otorisasi Founder Level 5.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#07090E] text-slate-100 overflow-hidden font-sans select-none">
      {/* Ambient Glowing Orbs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f59e0b08_1px,transparent_1px),linear-gradient(to_bottom,#f59e0b08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Holographic Header Badge */}
        <div className="flex flex-col items-center mb-8 text-center space-y-3">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/25 via-yellow-500/20 to-orange-500/25 border border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.3)] backdrop-blur-md">
            <Crown className="w-8 h-8 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 ring-4 ring-[#07090E] animate-pulse" />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/50 border border-amber-500/40 text-[10px] font-mono tracking-widest uppercase text-amber-300 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Founder Security Clearance Level 5
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>ID-TECH CLOUD</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono">
                EXECUTIVE
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Portal Pribadi Pemilik Startup PT NexGen Digital Nusantara
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="relative rounded-3xl bg-[#0B0E14]/90 border border-amber-500/30 shadow-[0_0_50px_-10px_rgba(245,158,11,0.2)] backdrop-blur-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="border-b border-slate-800/80 pb-4">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Founder Credential Clearance</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Masukkan kredensial akun pemilik untuk membuka panel metrik finansial, omzet, dan kontrol platform.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Email Founder</span>
                <span className="text-[10px] font-mono text-amber-400/80">C-LEVEL</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arpayid.dev@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Master Password</span>
                <span className="text-[10px] font-mono text-amber-400/80">E2EE</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold py-3 px-4 shadow-[0_0_25px_rgba(245,158,11,0.5)] focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Memverifikasi Otorisasi Founder...</span>
                </>
              ) : (
                <>
                  <span>AUTHORIZE & ENTER FOUNDER SUITE</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Badge */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span className="flex items-center gap-1 text-amber-400/80">
              <Cpu className="w-3 h-3" />
              AIR-GAPPED PORTAL
            </span>
            <span className="flex items-center gap-1 text-emerald-400/80">
              <Terminal className="w-3 h-3" />
              SESSION ENCRYPTED
            </span>
          </div>
        </div>

        {/* Back link to customer app */}
        <div className="text-center mt-6 text-xs text-slate-500">
          Bukan pemilik startup? Kunjungi{' '}
          <a
            href="https://app.id-tech.cloud"
            className="text-amber-400 hover:underline font-semibold"
          >
            Tenant Platform (app.id-tech.cloud)
          </a>
        </div>
      </div>
    </div>
  );
};
