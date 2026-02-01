
import React, { useState, useEffect, useRef } from 'react';
import { YearGoal, SubGoal, GoalCategory, GoalType, GoalPhase } from '../types';
import { geminiService } from '../services/gemini';

interface GoalWizardProps {
  onComplete: (goal: YearGoal, subgoals: SubGoal[]) => void;
  onCancel: () => void;
}

export const GoalWizard: React.FC<GoalWizardProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [goalData, setGoalData] = useState({
    title: '',
    category: 'growth' as GoalCategory,
    goal_type: 'project' as GoalType,
    motivation: '',
    constraints: '',
    success_def: '',
    mos_suggestion: '',
    ai_question: 'Зачем тебе это на самом деле?',
    insight: ''
  });

  const [target, setTarget] = useState(100);
  const [metric, setMetric] = useState('ед.');
  const [deadline, setDeadline] = useState('');

  const handleNext = async () => {
    setLoading(true);
    if (step === 1) {
      const question = await geminiService.getNavigatorInsight(1, goalData);
      setGoalData(prev => ({ ...prev, ai_question: question }));
      setStep(2);
    } else if (step === 2) {
      const question = await geminiService.getNavigatorInsight(2, goalData);
      setGoalData(prev => ({ ...prev, ai_question: question }));
      setStep(3);
    } else if (step === 3) {
      const res = await geminiService.getNavigatorInsight(3, goalData);
      setGoalData(prev => ({ 
        ...prev, 
        mos_suggestion: res.mos, 
        success_def: res.success,
        insight: res.insight 
      }));
      setStep(4);
    }
    setLoading(false);
  };

  const handleFinish = async () => {
    setLoading(true);
    const goalId = crypto.randomUUID();
    const newGoal: YearGoal = {
      id: goalId,
      category: goalData.category,
      goal_type: goalData.goal_type,
      phase: 'acceleration',
      title: goalData.title,
      core_intent: goalData.motivation,
      success_definition: goalData.success_def,
      constraints: goalData.constraints,
      risk_factors: 'Обычные помехи',
      metric: metric,
      target_value: target,
      current_value: 0,
      start_date: new Date().toISOString(),
      end_date: deadline || new Date(Date.now() + 86400000 * 30).toISOString(),
      status: 'active',
      is_private: false,
      logs: [],
      mos: { id: crypto.randomUUID(), title: goalData.mos_suggestion, is_completed: false }
    };

    const decomposition = await geminiService.decomposeGoalNavigator(newGoal);
    const subgoals: SubGoal[] = [];
    
    decomposition.milestones?.forEach((m: any, mi: number) => {
      m.tasks?.forEach((t: any) => {
        subgoals.push({
          id: crypto.randomUUID(),
          year_goal_id: goalId,
          title: t.title,
          effort_type: t.effort_type || 'action',
          target_value: 1,
          current_value: 0,
          metric: 'шаг',
          deadline: newGoal.end_date,
          weight: t.weight || 10,
          is_completed: false
        });
      });
    });

    onComplete(newGoal, subgoals);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col animate-fade-in overflow-hidden">
      <header className="p-6 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
        <button onClick={onCancel} className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">Отмена</button>
        <div className="flex gap-2">
           {[1,2,3,4].map(i => <div key={i} className={`h-1 rounded-full transition-all ${step >= i ? 'w-8 bg-slate-900' : 'w-2 bg-slate-100'}`}></div>)}
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 space-y-10">
        {step === 1 && (
          <div className="space-y-8 animate-slide-up">
            <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Идея</h2>
            <div className="space-y-6">
              <input 
                type="text" placeholder="Что ты хочешь начать?" 
                className="w-full text-2xl font-black italic outline-none border-b-2 border-slate-100 focus:border-indigo-500 pb-4 transition-all"
                value={goalData.title} onChange={e => setGoalData({...goalData, title: e.target.value})}
              />
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {['growth', 'finance', 'sport', 'work'].map(c => (
                  <button key={c} onClick={() => setGoalData({...goalData, category: c as any})} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${goalData.category === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'}`}>{c}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-slide-up">
            <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 italic relative">
              <i className="fa-solid fa-quote-left absolute top-4 left-4 text-slate-200 text-2xl"></i>
              <p className="text-lg font-bold text-slate-700 leading-relaxed">"{goalData.ai_question}"</p>
            </div>
            <textarea 
              placeholder="Твой честный ответ..." 
              className="w-full h-40 bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 text-base font-medium italic outline-none focus:border-indigo-100 transition-all"
              value={goalData.motivation} onChange={e => setGoalData({...goalData, motivation: e.target.value})}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-slide-up">
            <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Реальность</h2>
            <div className="p-8 bg-indigo-50 rounded-[3rem] border border-indigo-100 italic">
               <p className="text-base font-bold text-indigo-700 leading-relaxed">"{goalData.ai_question}"</p>
            </div>
            <textarea 
              placeholder="Опиши ограничения или риски..." 
              className="w-full h-40 bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 text-base font-medium italic outline-none focus:border-indigo-100 transition-all"
              value={goalData.constraints} onChange={e => setGoalData({...goalData, constraints: e.target.value})}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-10 animate-slide-up">
            <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Контракт</h2>
            <div className="space-y-6">
               <div className="p-8 bg-slate-900 rounded-[3rem] text-white space-y-4 shadow-xl">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">Минимальный шаг (MOS)</span>
                  <input 
                    type="text" className="w-full bg-transparent border-b border-white/10 pb-2 text-lg font-black italic outline-none"
                    value={goalData.mos_suggestion} onChange={e => setGoalData({...goalData, mos_suggestion: e.target.value})}
                  />
               </div>
               <div className="p-8 bg-white border border-slate-100 rounded-[3rem] space-y-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Критерий успеха</span>
                  <input 
                    type="text" className="w-full border-b border-slate-100 pb-2 text-base font-bold italic outline-none"
                    value={goalData.success_def} onChange={e => setGoalData({...goalData, success_def: e.target.value})}
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase px-4">Срок (дней)</label>
                    <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-black text-center" value={30} readOnly />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase px-4">Сложность</label>
                    <div className="w-full p-4 bg-slate-50 rounded-2xl flex justify-center gap-1">
                       {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-500"></div>)}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>

      <footer className="p-6 border-t border-slate-50 bg-white shrink-0 flex gap-4 safe-area-bottom">
        <button 
          onClick={step === 4 ? handleFinish : handleNext} 
          disabled={loading || !goalData.title}
          className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest italic shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
        >
          {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (step === 4 ? 'Запустить путь' : 'Далее')}
        </button>
      </footer>
    </div>
  );
};
