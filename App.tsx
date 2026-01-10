
import React, { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import { AppView, GoalCategory, YearGoal, AccountabilityPartner, ProgressLog, PartnerRole } from './types';
import { Layout } from './components/Layout';
import { ValueCard } from './components/ValueCard';
import { GoalWizard } from './components/GoalWizard';
import { geminiService } from './services/gemini';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, 
  Tooltip, Cell, Legend
} from 'recharts';

const roleMeta: Record<PartnerRole, { label: string, emoji: string, color: string, bg: string }> = {
  accomplice: { label: 'Сообщник', emoji: '🤝', color: 'text-blue-600', bg: 'bg-blue-50' },
  guardian: { label: 'Хранитель', emoji: '🛡️', color: 'text-rose-600', bg: 'bg-rose-50' },
  sensei: { label: 'Сэнсэй', emoji: '🥋', color: 'text-amber-600', bg: 'bg-amber-50' },
  teammate: { label: 'Тиммейт', emoji: '💼', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  navigator: { label: 'Штурман', emoji: '🧭', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  roaster: { label: 'Критик', emoji: '🔥', color: 'text-orange-600', bg: 'bg-orange-50' },
};

const sphereLabels: Record<string, string> = {
  finance: 'Финансы',
  sport: 'Спорт',
  growth: 'Рост',
  work: 'Работа',
  other: 'Прочее'
};

const App: React.FC = () => {
  const store = useStore();
  const [showWizard, setShowWizard] = useState(false);
  const [reviewingLog, setReviewingLog] = useState<{goal: YearGoal, log: ProgressLog} | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<AccountabilityPartner | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', reaction: 'fire' as any, is_verified: true });
  const [synergyData, setSynergyData] = useState<any>(null);

  useEffect(() => {
    if (store.view !== AppView.LANDING) {
      store.handleCheckIn();
      if (store.reviews.length > 0) store.refreshSocialInsight();
    }
  }, [store.reviews.length, store.view]);

  useEffect(() => {
    if (store.view === AppView.ANALYTICS && store.goals.length > 0) {
      geminiService.analyzeCrossSphereSynergy(store.goals).then(setSynergyData);
    }
  }, [store.view]);

  const getRadarData = () => {
    const categories: GoalCategory[] = ['finance', 'sport', 'growth', 'work', 'other'];
    return categories.map(cat => {
      const catGoals = store.goals.filter(g => g.category === cat);
      const avgProgress = catGoals.length 
        ? catGoals.reduce((acc, g) => acc + (g.current_value / g.target_value), 0) / catGoals.length 
        : 0;
      return {
        subject: sphereLabels[cat],
        A: Math.min(100, Math.round(avgProgress * 100)),
        fullMark: 100,
      };
    });
  };

  const getScatterData = () => {
    return store.goals.map(g => ({
      name: g.title,
      x: Math.round((g.current_value / g.target_value) * 100),
      y: g.confidence_level,
      z: g.target_value,
      category: g.category
    }));
  };

  const renderLanding = () => (
    <div className="fixed inset-0 bg-slate-900 z-[200] overflow-y-auto">
       <div className="min-h-screen flex flex-col items-center justify-center p-8 space-y-12 animate-fade-in text-center">
          <div className="space-y-4">
             <h1 className="text-6xl font-black text-white tracking-tighter italic italic-uppercase">TRIBE</h1>
             <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full"></div>
             <p className="text-slate-400 font-medium max-w-xs mx-auto">Твое племя достижений. Социальная операционная система для твоей жизни.</p>
          </div>

          <div className="w-full max-w-xs space-y-4">
             <button 
               onClick={store.startDemo}
               className="w-full py-5 bg-white text-slate-900 font-black rounded-[2rem] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
             >
                <i className="fa-solid fa-eye"></i>
                ПОСМОТРЕТЬ ДЕМО
             </button>
             <button 
               onClick={store.startFresh}
               className="w-full py-5 bg-indigo-600 text-white font-black rounded-[2rem] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
             >
                СОЗДАТЬ СВОЁ ПЛЕМЯ
             </button>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
             <div className="p-6 bg-slate-800/50 rounded-3xl border border-white/5 space-y-2">
                <i className="fa-solid fa-bolt-lightning text-amber-400 text-xl"></i>
                <div className="text-[10px] font-black text-slate-500 uppercase">AI Аналитика</div>
                <div className="text-xs text-slate-300 font-bold">Связи между спортом и карьерой</div>
             </div>
             <div className="p-6 bg-slate-800/50 rounded-3xl border border-white/5 space-y-2">
                <i className="fa-solid fa-shield-halved text-emerald-400 text-xl"></i>
                <div className="text-[10px] font-black text-slate-500 uppercase">Верификация</div>
                <div className="text-xs text-slate-300 font-bold">Поддержка от близких (Племя)</div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6 pb-12 animate-fade-in">
      {store.user.is_demo && (
        <div className="bg-indigo-600 text-white text-[10px] font-black py-1 px-4 rounded-full mx-auto w-max uppercase tracking-widest shadow-lg shadow-indigo-200">
          Демо-режим активности
        </div>
      )}

      {/* Header with XP and Streaks */}
      <div className="flex items-center justify-between px-2 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">
            {store.user.level}
          </div>
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-tighter">Уровень {store.user.level}</div>
            <div className="w-32 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
               <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(store.user.xp / (store.user.level * 1000)) * 100}%` }}></div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100 shadow-sm">
           <i className="fa-solid fa-fire text-orange-500 animate-pulse"></i>
           <span className="text-sm font-black text-orange-600">{store.user.streak} ДНЕЙ</span>
        </div>
      </div>

      {/* Social Insight Card */}
      {store.socialInsight && (
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-6 rounded-[2.5rem] border border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
             <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs">
                <i className="fa-solid fa-users"></i>
             </div>
             <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Голос племени</span>
          </div>
          <p className="text-sm text-indigo-800 font-medium italic mb-2">"{store.socialInsight.summary}"</p>
          <div className="flex items-center justify-between mt-4 bg-white/50 p-3 rounded-2xl">
             <span className="text-[9px] font-bold text-slate-500 uppercase">Социальное доверие</span>
             <span className="text-sm font-black text-indigo-600">{store.socialInsight.socialCredibilityScore}%</span>
          </div>
        </div>
      )}

      {/* Verification Queue */}
      {store.goals.some(g => g.logs.some(l => !l.is_verified)) && (
        <section className="space-y-4">
           <h3 className="text-lg font-black text-slate-800 px-1 flex items-center gap-2">
             <i className="fa-solid fa-shield-halved text-amber-500"></i>
             Нужна верификация
           </h3>
           <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
             {store.goals.flatMap(g => g.logs.filter(l => !l.is_verified).map(l => ({goal: g, log: l}))).map(({goal, log}) => (
               <div key={log.id} 
                    onClick={() => setReviewingLog({goal, log})}
                    className="shrink-0 w-64 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-3 active:scale-95 transition-all">
                  <div className="flex justify-between items-center">
                     <span className="text-[8px] font-black text-indigo-500 uppercase px-2 py-0.5 bg-indigo-50 rounded-full">{goal.category}</span>
                     <span className="text-[8px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">{goal.title}</h4>
                  <div className="flex items-center gap-2">
                     <span className="text-lg font-black text-slate-900">{log.value} {goal.metric}</span>
                  </div>
               </div>
             ))}
           </div>
        </section>
      )}

      {/* Main Focus */}
      <section className="space-y-4">
        <h3 className="text-lg font-black text-slate-800 px-1">Ежедневный фокус</h3>
        <div className="space-y-3">
          {store.actions.filter(a => !a.completion_status).slice(0, 3).map(a => (
            <div key={a.id} onClick={() => store.toggleAction(a.id)} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all group">
               <div className="w-7 h-7 rounded-xl border-2 border-slate-200 group-hover:border-indigo-400 transition-colors shrink-0 flex items-center justify-center">
                  <i className="fa-solid fa-check text-indigo-500 opacity-0 group-hover:opacity-20"></i>
               </div>
               <span className="text-sm font-bold text-slate-700 flex-1">{a.title}</span>
               <div className="bg-slate-50 px-3 py-1 rounded-lg text-[10px] font-black text-slate-400 uppercase">
                  +{store.user.streak > 5 ? 75 : 50} XP
               </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-8 pb-12 animate-fade-in">
       <div className="px-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Нексус</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium italic">Визуализация баланса твоих жизненных сфер.</p>
       </div>

       {/* Balance Radar */}
       <div className="p-4 bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
          <h3 className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pt-4">Колесо Баланса</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                <Radar
                  name="Прогресс"
                  dataKey="A"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
       </div>

       {/* Synergy Insights */}
       {(synergyData || store.user.is_demo) && (
         <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-800 px-1 flex items-center gap-2">
               <i className="fa-solid fa-bolt-lightning text-amber-500"></i>
               AI Связки (Синергия)
            </h3>
            <div className="space-y-3">
               {(synergyData?.synergies || [
                 { spheres: ['sport', 'work'], reason: 'Ваши утренние тренировки коррелируют с высокой концентрацией в рабочих блоках. Продолжайте бегать по утрам.', impactScore: 15 },
                 { spheres: ['finance', 'growth'], reason: 'Инвестиции в обучение приносят плоды. Рост навыков напрямую отражается на ваших доходах.', impactScore: 22 }
               ]).map((syn: any, i: number) => (
                 <div key={i} className="p-6 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                       <i className="fa-solid fa-circle-nodes text-6xl"></i>
                    </div>
                    <div className="flex gap-2 mb-2">
                       {syn.spheres.map((s: string) => (
                         <span key={s} className="px-3 py-1 bg-white/20 rounded-full text-[8px] font-black uppercase">{sphereLabels[s] || s}</span>
                       ))}
                    </div>
                    <p className="text-sm font-medium leading-relaxed mb-4">{syn.reason}</p>
                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-2xl">
                       <span className="text-[9px] font-bold uppercase">Влияние на баланс</span>
                       <span className="text-sm font-black text-emerald-300">+{syn.impactScore}%</span>
                    </div>
                 </div>
               ))}
            </div>
         </section>
       )}
    </div>
  );

  const renderSocial = () => (
    <div className="space-y-8 pb-12 animate-fade-in">
       <div className="px-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Племя</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium italic">Близкие, которые не дадут тебе сойти с пути.</p>
       </div>
       
       <div className="grid grid-cols-1 gap-4">
          {store.partners.map(p => {
            const meta = roleMeta[p.role];
            return (
              <div key={p.id} className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-indigo-200 transition-all">
                 <div className={`w-14 h-14 ${meta.bg} rounded-full flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform`}>
                    {meta.emoji}
                 </div>
                 <div className="flex-1">
                    <h4 className="font-black text-slate-800 text-lg">{p.name}</h4>
                    <span className={`role-badge ${meta.bg} ${meta.color}`}>{meta.label}</span>
                 </div>
                 <div className="text-right">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Проверки</div>
                    <div className="font-black text-slate-700 text-xl">{store.reviews.filter(r => r.partner_id === p.id).length}</div>
                 </div>
              </div>
            );
          })}
       </div>

       <section className="space-y-4">
          <h3 className="text-lg font-black text-slate-800 px-1">Голоса племени</h3>
          <div className="space-y-4">
             {store.reviews.length === 0 ? (
               <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-[2rem]">
                  Пока нет отзывов от твоего племени...
               </div>
             ) : store.reviews.slice().reverse().map(r => {
               const partner = store.partners.find(p => p.id === r.partner_id);
               const meta = partner ? roleMeta[partner.role] : null;
               return (
                 <div key={r.id} className="p-6 bg-white border border-slate-50 rounded-[2.5rem] shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">{partner?.name}</span>
                          {meta && <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>}
                       </div>
                       <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className={`fa-solid fa-star text-[8px] ${i < r.rating ? 'text-amber-400' : 'text-slate-100'}`}></i>
                          ))}
                       </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600 italic leading-relaxed">"{r.comment}"</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                       <div className="flex items-center gap-2">
                          <span className="text-[18px]">{r.reaction === 'fire' ? '🔥' : r.reaction === 'slow' ? '🐌' : r.reaction === 'doubt' ? '🧐' : '💪'}</span>
                          <span className={`text-[9px] font-black uppercase ${r.is_verified ? 'text-emerald-500' : 'text-rose-500'}`}>
                             {r.is_verified ? 'ПОДТВЕРЖДЕНО' : 'ПОД ВОПРОСОМ'}
                          </span>
                       </div>
                       <span className="text-[8px] font-bold text-slate-300">{new Date(r.timestamp).toLocaleDateString()}</span>
                    </div>
                 </div>
               );
             })}
          </div>
       </section>
    </div>
  );

  return (
    <div className="relative">
      {store.view === AppView.LANDING ? renderLanding() : (
        <Layout activeView={store.view} setView={store.setView}>
          {store.view === AppView.DASHBOARD && renderDashboard()}
          {store.view === AppView.SOCIAL && renderSocial()}
          {store.view === AppView.ANALYTICS && renderAnalytics()}
          {store.view === AppView.VALUES && (
             <div className="space-y-6">
               <h2 className="text-2xl font-black text-slate-800 px-1">Ценности</h2>
               {store.values.map(v => <ValueCard key={v.id} value={v} />)}
               {store.values.length === 0 && (
                 <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-slate-400">
                    Начни с определения того, что тебе важно.
                 </div>
               )}
             </div>
          )}
          {store.view === AppView.SETTINGS && (
            <div className="space-y-8 pb-12">
               <div className="p-8 bg-slate-900 rounded-[3rem] text-center space-y-4">
                  <div className="w-20 h-20 bg-indigo-500 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-black">
                     {store.user.name[0]}
                  </div>
                  <h3 className="text-xl font-black text-white">{store.user.name}</h3>
                  <div className="flex justify-center gap-6">
                    <div className="text-center">
                       <div className="text-[10px] font-black text-slate-500 uppercase">Уровень</div>
                       <div className="text-white font-black">{store.user.level}</div>
                    </div>
                    <div className="text-center">
                       <div className="text-[10px] font-black text-slate-500 uppercase">Стрик</div>
                       <div className="text-white font-black">{store.user.streak} дн.</div>
                    </div>
                  </div>
               </div>
               
               <div className="space-y-3">
                  <button onClick={() => window.location.reload()} className="w-full p-5 bg-slate-50 rounded-2xl text-left font-bold text-slate-700 flex justify-between items-center">
                     Сбросить данные и выйти
                     <i className="fa-solid fa-arrow-right-from-bracket text-slate-300"></i>
                  </button>
               </div>
            </div>
          )}
          {store.view === AppView.GOALS && (
            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-2xl font-black text-slate-800">Цели</h2>
                <button onClick={() => setShowWizard(true)} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center">
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
              <div className="space-y-4">
                 {store.goals.map(g => (
                   <div key={g.id} className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase">{g.category}</span>
                        <h3 className="text-lg font-black text-slate-800">{g.title}</h3>
                      </div>
                      <div className="text-2xl font-black text-indigo-600">{Math.round((g.current_value / g.target_value) * 100)}%</div>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </Layout>
      )}

      {reviewingLog && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-end">
           <div className="w-full max-w-md mx-auto bg-white rounded-t-[3rem] p-8 space-y-8 animate-slide-up">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-slate-800 italic uppercase">Рецензия</h3>
                 <button onClick={() => setReviewingLog(null)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-400"><i className="fa-solid fa-xmark"></i></button>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Действие</div>
                 <div className="text-xl font-black text-slate-900 mt-1">{reviewingLog.log.value} {reviewingLog.goal.metric}</div>
                 <div className="text-xs text-slate-500 font-bold mt-1">по цели: {reviewingLog.goal.title}</div>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Кто ты из племени?</label>
                    <select className="w-full mt-1 p-4 bg-slate-50 rounded-2xl outline-none ring-2 ring-slate-100 focus:ring-indigo-500 font-bold" onChange={e => setSelectedPartner(store.partners.find(p => p.id === e.target.value) || null)}>
                       <option>Выбери архетип...</option>
                       {store.partners.map(p => <option key={p.id} value={p.id}>{p.name} ({roleMeta[p.role].label})</option>)}
                    </select>
                 </div>

                 <div className="flex justify-around bg-slate-50 p-4 rounded-3xl">
                    {['fire', 'slow', 'doubt', 'strong'].map(r => (
                       <button key={r} onClick={() => setReviewForm({...reviewForm, reaction: r as any})} className={`text-2xl p-2 rounded-2xl transition-all ${reviewForm.reaction === r ? 'bg-white shadow-md scale-125' : 'opacity-40 grayscale'}`}>
                          {r === 'fire' ? '🔥' : r === 'slow' ? '🐌' : r === 'doubt' ? '🧐' : '💪'}
                       </button>
                    ))}
                 </div>

                 <textarea 
                    placeholder="Напиши совет или комментарий как наставник..."
                    className="w-full p-4 bg-slate-50 rounded-2xl outline-none ring-2 ring-slate-100 min-h-[100px] font-medium"
                    onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                 ></textarea>

                 <div className="flex gap-4">
                    <button onClick={() => { 
                      if (selectedPartner) {
                        store.addPartnerReview({ ...reviewForm, partner_id: selectedPartner.id, log_id: reviewingLog.log.id, is_verified: true });
                        setReviewingLog(null);
                      }
                    }} className="flex-1 py-5 bg-emerald-600 text-white font-black rounded-3xl shadow-lg shadow-emerald-100">ПОДТВЕРДИТЬ</button>
                    <button onClick={() => {
                      if (selectedPartner) {
                        store.addPartnerReview({ ...reviewForm, partner_id: selectedPartner.id, log_id: reviewingLog.log.id, is_verified: false, rating: 2 });
                        setReviewingLog(null);
                      }
                    }} className="flex-1 py-5 bg-rose-50 text-rose-600 font-black rounded-3xl">ОСПОРИТЬ</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showWizard && <GoalWizard values={store.values} onCancel={() => setShowWizard(false)} onComplete={(g, s, p) => { store.addGoal(g); setShowWizard(false); }} />}
    </div>
  );
};

export default App;
