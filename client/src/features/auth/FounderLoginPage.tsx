import React, { useState } from 'react';
import {
  Crown,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Server,
  Database,
  Lock
} from 'lucide-react';
import { api } from '../../services/api';
import { ThemeSelector } from '../../components/ThemeSelector';
import { useTheme } from '../../context/ThemeContext';

interface FounderLoginPageProps {
  onLoginSuccess: (user: any) => void;
}

export const FounderLoginPage: React.FC<FounderLoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accent, resolvedMode } = useTheme();

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
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 bg-neutral-50 dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 overflow-hidden font-sans select-none transition-colors duration-200">
      {/* Vercel & Railway Minimal Dot Grid */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] dark:bg-[radial-gradient(#1f1f1f_1px,transparent_1px)] bg-[size:1.75rem_1.75rem] pointer-events-none opacity-80" 
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[42rem] h-[20rem] bg-gradient-to-b from-neutral-200/50 dark:from-white/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Floating Theme Switcher at Top-Right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeSelector />
      </div>

      {/* Top Status Pill ala Railway */}
      <div className="relative z-10 mb-6 sm:mb-8 flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#222] text-[11px] font-mono text-neutral-600 dark:text-neutral-400 shadow-sm">
        <span 
          className="w-2 h-2 rounded-full animate-pulse" 
          style={{ backgroundColor: accent.hex }}
        />
        <span className="font-medium text-neutral-800 dark:text-neutral-200">Railway PostgreSQL Cluster</span>
        <span className="text-neutral-400 dark:text-neutral-600">•</span>
        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">100% Healthy</span>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-sm px-2 sm:px-0">
        <div className="rounded-2xl bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#222] shadow-[0_4px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_0_60px_rgba(0,0,0,0.8)] p-6 sm:p-7 space-y-6 transition-colors">
          {/* Brand & Clearance Title */}
          <div className="space-y-1.5 text-center">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white shadow-inner mb-2">
              <Crown className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-neutral-950 dark:text-white flex items-center justify-center gap-2">
              <span>ID-TECH CLOUD</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 font-mono font-medium border border-neutral-200 dark:border-neutral-700">
                FOUNDER
              </span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Executive Management & Multi-Tenant Cockpit
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                <span>Founder Email</span>
                <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">LEVEL 5</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arpayid.dev@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-[#000000] border border-neutral-200 dark:border-[#262626] text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Master Password</label>
                <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">PBKDF2 E2EE</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-[#000000] border border-neutral-200 dark:border-[#262626] text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button ala Vercel */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 rounded-xl bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black font-semibold py-2.5 px-4 text-xs tracking-tight shadow transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-neutral-400 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                  <span>Verifying Founder Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Executive Suite</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Security & Verification Badges */}
          <div className="pt-4 border-t border-neutral-100 dark:border-[#1a1a1a] grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>Anti-Brute Force</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0" />
              <span>2FA Step-Up PIN</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-sky-500 dark:text-sky-400 shrink-0" />
              <span>PostgreSQL 18</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Server className="w-3 h-3 text-purple-500 dark:text-purple-400 shrink-0" />
              <span>Railway ap-se-1</span>
            </div>
          </div>
        </div>

        {/* Back Link to Customer Tenant App */}
        <div className="text-center mt-5 text-[11px] text-neutral-500 dark:text-neutral-500 font-mono">
          Customer Tenant Platform:{' '}
          <a
            href="https://app.id-tech.cloud"
            className="text-neutral-800 dark:text-neutral-300 hover:text-black dark:hover:text-white underline underline-offset-2 transition"
          >
            app.id-tech.cloud
          </a>
        </div>
      </div>
    </div>
  );
};
