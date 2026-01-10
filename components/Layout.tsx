
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
    { view: AppView.VALUES, icon: 'fa-heart', label: 'Ценности' },
    { view: AppView.GOALS, icon: 'fa-bullseye', label: 'Цели' },
    { view: AppView.SOCIAL, icon: 'fa-users', label: 'Племя' },
    { view: AppView.ANALYTICS, icon: 'fa-microchip', label: 'Анализ' },
    { view: AppView.SETTINGS, icon: 'fa-user', label: 'Профиль' },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl relative overflow-hidden">
      <header className="px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tighter">
          TRIBE
        </h1>
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
          <i className="fa-solid fa-bell text-sm"></i>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-24 pt-4">
        {children}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 flex justify-around items-center px-2 py-3 safe-area-bottom z-50">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={`flex flex-col items-center gap-1 transition-all duration-200 ${
              activeView === item.view ? 'text-indigo-600 scale-110' : 'text-slate-400'
            }`}
          >
            <i className={`fa-solid ${item.icon} text-lg`}></i>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
