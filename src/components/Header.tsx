import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: 'create' | 'history' | 'reports' | 'master') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-inner">
            <span className="font-bold text-lg text-white">Rp</span>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight flex items-center gap-1.5">
              Catat Pengeluaran
              <span className="text-[10px] uppercase font-semibold bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/30">
                PWA
              </span>
            </h1>
            <p className="text-xs text-slate-400">HPP • OPEX • CAPEX • Prive</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Online/Offline Badge */}
          <div
            title={isOnline ? 'Tersambung ke Jaringan' : 'Mode Offline (Data tersimpan di perangkat)'}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
              isOnline
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                : 'bg-amber-950/60 text-amber-300 border-amber-700/50'
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
            <span className="hidden sm:inline font-medium">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* PWA Install Button */}
          {deferredPrompt && !isInstalled && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium px-2.5 py-1 rounded-full shadow transition"
              title="Install Aplikasi ke Layar Utama Ponsel"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pasang PWA</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
