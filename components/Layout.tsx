
import React from 'react';
import { AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setView: (view: AppView) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, setView }) => {
  const navItems = [
    { view: AppView.DASHBOARD, icon: 'fa-chart-line', label: 'Обзор' },
    { view: AppView.FINANCE, icon: 'fa-wallet', label: 'Капитал' },
    { view: AppView.GOALS, icon: 'fa-bullseye', label: 'Цели' },
    { view: AppView.SOCIAL, icon: 'fa-users', label: 'Племя' },
    { view: AppView.ANALYTICS, icon: 'fa-microchip', label: 'Анализ' },
    { view: AppView.SETTINGS, icon: 'fa-user', label: 'Профиль' },
  ];

  const isFocusMode = activeView === AppView.FOCUS;

  return (
    <div className={`flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl relative overflow-hidden ${isFocusMode ? 'bg-slate-950' : ''}`}>
      {!isFocusMode && (
        <header className="px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tighter italic">
            TRIBE
          </h1>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
               <i className="fa-solid fa-search text-xs"></i>
             </div>
             <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
               <i className="fa-solid fa-bell text-sm"></i>
             </div>
          </div>
        </header>
      )}

      <main className={`flex-1 overflow-y-auto custom-scrollbar ${isFocusMode ? 'p-0 bg-slate-950' : 'px-4 pb-24 pt-4 bg-[#fcfdfe]'}`}>
        {children}
      </main>

      {!isFocusMode && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 flex justify-around items-center px-1 py-3 safe-area-bottom z-50">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex flex-col items-center gap-1 transition-all duration-200 w-14 ${
                activeView === item.view ? 'text-indigo-600 scale-105' : 'text-slate-300'
              }`}
            >
              <i className={`fa-solid ${item.icon} text-[1.1rem]`}></i>
              <span className="text-[9px] font-black uppercase tracking-tighter italic">{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};
