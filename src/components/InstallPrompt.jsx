import { useState, useEffect } from 'react';
import { Download, X, Share2, ArrowUp } from 'lucide-react';

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true;
}

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);   // Android deferred prompt
  const [showIOS, setShowIOS] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (isStandalone() || sessionStorage.getItem('hs_install_dismissed')) return;

    if (isIOS()) {
      setShowIOS(true);
      return;
    }

    const handler = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('hs_install_dismissed', '1');
    setPrompt(null);
    setShowIOS(false);
    setGone(true);
  };

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setGone(true);
    setPrompt(null);
  };

  if (gone) return null;

  /* ── Android install banner ─────────────────────────────────────────── */
  if (prompt) return (
    <div className="fixed top-3 left-3 right-3 z-50 bg-white rounded-2xl shadow-xl border border-green-200 p-4 flex items-center gap-3 animate-slide-up">
      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <Download size={18} className="text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800">Install HabitSnap</p>
        <p className="text-xs text-gray-400">Add to your home screen</p>
      </div>
      <button
        onClick={install}
        className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex-shrink-0 transition-colors"
      >
        Install
      </button>
      <button onClick={dismiss} className="p-1 flex-shrink-0">
        <X size={16} className="text-gray-400" />
      </button>
    </div>
  );

  /* ── iOS hint banner ────────────────────────────────────────────────── */
  if (showIOS) return (
    <div className="fixed bottom-24 left-3 right-3 z-50 bg-white rounded-2xl shadow-xl border border-green-200 p-4 animate-slide-up">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <ArrowUp size={16} className="text-green-500" />
          <p className="text-sm font-bold text-gray-800">Add to Home Screen</p>
        </div>
        <button onClick={dismiss}><X size={16} className="text-gray-400" /></button>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        Tap the <Share2 size={12} className="inline text-blue-500 mx-0.5" />
        <strong> Share</strong> button in Safari, then tap{' '}
        <strong>"Add to Home Screen"</strong> to install HabitSnap like an app.
      </p>
    </div>
  );

  return null;
}
