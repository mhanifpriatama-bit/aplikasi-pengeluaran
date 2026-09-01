import React from 'react';
import { PlusCircle, History, BarChart3, Settings } from 'lucide-react';

interface NavigationProps {
  activeTab: 'create' | 'history' | 'reports' | 'master';
  onTabChange: (tab: 'create' | 'history' | 'reports' | 'master') => void;
  historyCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  historyCount,
}) => {
  const tabs = [
    {
      id: 'create' as const,
      label: 'Catat',
      icon: PlusCircle,
      badge: null,
    },
    {
      id: 'history' as const,
      label: 'Riwayat',
      icon: History,
      badge: historyCount > 0 ? historyCount : null,
    },
    {
      id: 'reports' as const,
      label: 'Laporan',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'master' as const,
      label: 'Master',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-blue-600 font-bold scale-105'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  {tab.badge !== null && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>

                {isActive && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
