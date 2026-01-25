
import React from 'react';
import { AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setView: (view: AppView) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, setView }) => {
  const navItems = [
    { view: AppView.DASHBOARD, icon: 'fa-house-chimney', label: 'ОБЗОР' },
    { view: AppView.FINANCE, icon: 'fa-coins', label: 'КАПИТАЛ' },
    { view: AppView.GOALS, icon: 'fa-mountain', label: 'ЦЕЛИ' },
    { view: AppView.SOCIAL, icon: 'fa-fire-burner', label: 'ПЛЕМЯ' },
    { view: AppView.ANALYTICS, icon: 'fa-chart-simple', label: 'АНАЛИЗ' },
    { view: AppView.SETTINGS, icon: 'fa-gears', label: 'ПРОФИЛЬ' },
  ];

  const isFocusMode = activeView === AppView.FOCUS;

  return (
    <div className={`flex flex-col h-screen max-w-md mx-auto relative overflow-hidden transition-all duration-700 ease-in-out shadow-2xl ${isFocusMode ? 'bg-slate-950' : 'bg-white'}`}>
      {/* Header: Hidden in Focus Mode */}
      {!isFocusMode && (
        <header className="px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 animate-fade-in">
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tighter italic">
            TRIBE
          </h1>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
               <i className="fa-solid fa-magnifying-glass text-xs"></i>
             </div>
             <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
               <i className="fa-solid fa-bell text-sm"></i>
             </div>
          </div>
        </header>
      )}

      {/* Main Content Area: Full screen in Focus Mode */}
      <main className={`flex-1 overflow-y-auto no-scrollbar transition-all duration-700 ${
        isFocusMode 
          ? 'p-0 bg-slate-950' 
          : 'px-4 pb-28 pt-4 bg-[#fcfdfe]'
      }`}>
        {children}
      </main>

      {/* Navigation: Hidden in Focus Mode */}
      {!isFocusMode && (
        <nav className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-100 flex justify-between items-center px-2 py-3 safe-area-bottom z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] animate-slide-up">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex-1 flex flex-col items-center gap-1.5 transition-all duration-300 relative py-1 ${
                activeView === item.view ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-400'
              }`}
            >
              <div className={`transition-all duration-300 ${activeView === item.view ? 'scale-110 -translate-y-0.5' : 'scale-100'}`}>
                <i className={`fa-solid ${item.icon} text-[1.15rem]`}></i>
              </div>
              <span className={`text-[7.5px] font-black uppercase tracking-tight italic transition-all duration-300 ${activeView === item.view ? 'opacity-100' : 'opacity-50'}`}>
                {item.label}
              </span>
              
              {/* Active indicator dot */}
              <div className={`absolute -bottom-0.5 w-1.5 h-1.5 bg-indigo-600 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(79,70,229,0.4)] transform ${
                activeView === item.view ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}></div>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};
