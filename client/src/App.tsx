import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { FounderLoginPage } from './features/auth/FounderLoginPage';
import { FounderSuite } from './features/founder/FounderSuite';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if auth_token passed in URL params (e.g. from single sign-on redirect)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryToken = urlParams.get('auth_token');
      if (queryToken) {
        api.setToken(queryToken);
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    const token = api.getToken();
    if (!token) {
      setIsCheckingAuth(false);
      return;
    }

    api.getMe()
      .then((res) => {
        if (res.authenticated && res.user && res.user.role === 'ADMIN') {
          setCurrentUser(res.user);
        } else {
          api.removeToken();
          setCurrentUser(null);
        }
      })
      .catch(() => {
        api.removeToken();
        setCurrentUser(null);
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    setCurrentUser(null);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#07090E] flex flex-col items-center justify-center text-amber-400 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 animate-pulse">
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
        </div>
        <p className="text-xs font-mono text-amber-400 tracking-widest uppercase animate-pulse">
          Memverifikasi Kredensial Founder...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <FounderLoginPage
        onLoginSuccess={(user) => setCurrentUser(user)}
      />
    );
  }

  return (
    <FounderSuite
      currentUser={currentUser}
      onExit={handleLogout}
    />
  );
};
