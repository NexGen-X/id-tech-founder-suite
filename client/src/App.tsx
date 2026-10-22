import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { FounderLoginPage } from './features/auth/FounderLoginPage';
import { FounderSuite } from './features/founder/FounderSuite';
import { ThemeProvider } from './context/ThemeContext';

export const AppContent: React.FC = () => {
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
      <div className="min-h-screen bg-neutral-950 dark:bg-[#000000] flex flex-col items-center justify-center text-neutral-400 font-sans">
        <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-lg mb-3">
          <div className="w-5 h-5 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
        </div>
        <p className="text-xs font-mono text-neutral-400 tracking-wider uppercase animate-pulse">
          Verifying Founder Clearance...
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

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};
