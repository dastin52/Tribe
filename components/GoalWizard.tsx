
import React, { useState } from 'react';
import { Value, YearGoal, SubGoal, Project, GoalCategory } from '../types';
import { geminiService } from '../services/gemini';

interface GoalWizardProps {
  values: Value[];
  onComplete: (goal: YearGoal, subgoals: SubGoal[], projects: Project[]) => void;
  onCancel: () => void;
}

export const GoalWizard: React.FC<GoalWizardProps> = ({ values, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [category, setCategory] = useState<GoalCategory>('growth');
  const [title, setTitle] = useState('');
  const [motivation, setMotivation] = useState('');
  const [metric, setMetric] = useState('');
  const [target, setTarget] = useState<number>(0);
  const [deadline, setDeadline] = useState('');
  const [difficulty, setDifficulty] = useState(5);
  const [description, setDescription] = useState('');

  const [aiQuestion, setAiQuestion] = useState('');
  const [aiInsight, setAiInsight] = useState('');
  const [decomposition, setDecomposition] = useState<any>(null);

  const categories: {id: GoalCategory, label: string, icon: string, color: string}[] = [
    {id: 'finance', label: 'Капитал', icon: 'fa-wallet', color: 'text-emerald-600'},
    {id: 'sport', label: 'Тело', icon: 'fa-dumbbell', color: 'text-rose-600'},
    {id: 'growth', label: 'Развитие', icon: 'fa-brain', color: 'text-indigo-600'},
    {id: 'work', label: 'Работа', icon: 'fa-briefcase', color: 'text-amber-600'},
    {id: 'other', label: 'Другое', icon: 'fa-star', color: 'text-slate-600'},
  ];

  const handleNext = async () => {
    if (step === 1) {
      if (!title) return;
      setLoading(true);
      const res = await geminiService.getCoachingInsight(category, title);
      setAiQuestion(res.question);
      setStep(2);
      setLoading(false);
    } else if (step === 2) {
      if (!motivation) return;
      setLoading(true);
      const res = await geminiService.getCoachingInsight(category, title, motivation);
      setAiInsight(res.insight);
      const d = new Date(); d.setMonth(d.getMonth() + (res.suggestedMonths || 6));
      setDeadline(d.toISOString().split('T')[0]);
      setStep(3);
      setLoading(false);
    } else if (step === 3) {
      setLoading(true);
      const res = await geminiService.decomposeGoal(title, metric, target, category, description);
      setDecomposition(res);
      setStep(4);
      setLoading(false);
    }
  };

  const handleFinish = () => {
    const goalId = crypto.randomUUID();
    const goal: YearGoal = {
      id: goalId, category, value_id: 'v1', title, description, metric: metric || 'ед.',
      target_value: target, current_value: 0, start_date: new Date().toISOString(),
      end_date: new Date(deadline).toISOString(), status: 'active', confidence_level: 80,
      difficulty, logs: []
    };
    const sgs: SubGoal[] = (decomposition?.subGoals || []).map((s: any) => ({
      id: crypto.randomUUID(), year_goal_id: goalId, title: s.title, metric: metric || 'ед.',
      target_value: s.target_value, current_value: 0, weight: s.weight, deadline: goal.end_date,
      frequency: 'monthly', difficulty: Math.max(1, difficulty - 2)
    }));
    onComplete(goal, sgs, []);
  };

  return (
    <div className="fixed inset-0 bg-white z-[150] flex flex-col animate-fade-in">
      <header className="p-6 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white z-10">
        <button onClick={onCancel} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><i className="fa-solid fa-chevron-left"></i></button>
        <div className="flex gap-1">{[1, 2, 3, 4].map(i => <div key={i} className={`h-1 rounded-full transition-all ${step >= i ? 'w-6 bg-slate-900' : 'w-2 bg-slate-100'}`}></div>)}</div>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 pb-32 custom-scrollbar">
        {step === 3 && (
          <div className="space-y-8 animate-scale-up">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Детали</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Цифры и энергия</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4">Сумма/Объем</label>
                <input type="number" className="w-full p-6 bg-slate-50 rounded-[2rem] font-black text-2xl text-center outline-none" value={target || ''} onChange={e => setTarget(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4">Метрика</label>
                <input type="text" placeholder="ед." className="w-full p-6 bg-slate-50 rounded-[2rem] font-black text-2xl text-center outline-none" value={metric} onChange={e => setMetric(e.target.value)} />
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-center px-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Сложность (1-10)</label>
                  <span className="text-xl font-black text-indigo-600 italic">{difficulty}</span>
               </div>
               <input type="range" min="1" max="10" value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900" />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4">Дедлайн</label>
              <input type="date" className="w-full p-6 bg-slate-50 rounded-[2rem] font-black text-xl text-center outline-none" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
          </div>
        )}
        
        {/* Step 1, 2, 4 content remains identical to previous version but with minor style fixes */}
        {step === 1 && (
           <div className="space-y-8">
              <h2 className="text-4xl font-black text-slate-900 italic uppercase">Идея</h2>
              <div className="grid grid-cols-5 gap-2">
                 {categories.map(cat => (
                   <button key={cat.id} onClick={() => setCategory(cat.id)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${category === cat.id ? 'border-slate-900 bg-slate-50 shadow-sm' : 'border-slate-50 opacity-40'}`}>
                     <i className={`fa-solid ${cat.icon} text-lg ${category === cat.id ? cat.color : ''}`}></i>
                     <span className="text-[8px] font-black uppercase tracking-tighter">{cat.label}</span>
                   </button>
                 ))}
              </div>
              <input type="text" placeholder="Что ты хочешь достичь?" className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] font-black text-xl outline-none" value={title} onChange={e => setTitle(e.target.value)} />
           </div>
        )}
        {step === 2 && (
           <div className="space-y-8">
              <h2 className="text-4xl font-black text-slate-900 italic uppercase">Смысл</h2>
              <div className="p-8 bg-slate-900 rounded-[3rem] text-white italic shadow-2xl"><p className="text-lg font-bold">"{aiQuestion}"</p></div>
              <textarea placeholder="Ответь Племени честно..." className="w-full p-8 bg-slate-50 rounded-[3rem] font-bold text-lg outline-none min-h-[150px]" value={motivation} onChange={e => setMotivation(e.target.value)} />
           </div>
        )}
        {step === 4 && (
           <div className="space-y-8">
              <h2 className="text-4xl font-black text-slate-900 italic uppercase text-center">План</h2>
              <div className="space-y-3">
                 {decomposition?.subGoals?.map((s: any, i: number) => (
                    <div key={i} className="p-6 bg-white border border-slate-100 rounded-[2rem] flex justify-between items-center">
                       <span className="font-black text-slate-800">{s.title}</span>
                       <span className="text-indigo-600 font-black italic">{s.weight}%</span>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>

      <footer className="p-8 border-t border-slate-50 bg-white/90 backdrop-blur-md sticky bottom-0 z-20 flex gap-3">
        {step > 1 && <button disabled={loading} onClick={() => setStep(prev => prev - 1)} className="w-1/4 h-20 bg-slate-50 text-slate-400 font-black rounded-[2rem]"><i className="fa-solid fa-arrow-left"></i></button>}
        <button disabled={loading} onClick={step === 4 ? handleFinish : handleNext} className="flex-1 h-20 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl flex items-center justify-center gap-3">
          {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <><i className="fa-solid fa-bolt text-amber-400"></i><span className="uppercase tracking-widest text-xs">{step === 4 ? 'Запустить' : 'Далее'}</span></>}
        </button>
      </footer>
    </div>
  );
};
