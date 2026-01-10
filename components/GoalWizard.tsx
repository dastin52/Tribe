import React, { useState } from 'react';
import { Value, YearGoal, SubGoal, Project, GoalCategory, GoalStatus } from '../types';
import { geminiService } from '../services/gemini';

interface GoalWizardProps {
  values: Value[];
  onComplete: (goal: YearGoal, subgoals: SubGoal[], projects: Project[]) => void;
  onCancel: () => void;
}

export const GoalWizard: React.FC<GoalWizardProps> = ({ values, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [goalData, setGoalData] = useState<Partial<YearGoal>>({
    title: '',
    description: '',
    metric: '',
    category: 'growth',
    target_value: 0,
    value_id: values[0]?.id || '',
    status: 'planned' as GoalStatus,
    confidence_level: 50
  });

  const categories: {id: GoalCategory, label: string, icon: string, hint: string}[] = [
    {id: 'finance', label: 'Финансы', icon: 'fa-wallet', hint: 'Доходы, капитал, пассивный доход'},
    {id: 'sport', label: 'Спорт', icon: 'fa-dumbbell', hint: 'Вес, дистанции, регулярность'},
    {id: 'growth', label: 'Развитие', icon: 'fa-book-open', hint: 'Навыки, обучение, привычки'},
    {id: 'work', label: 'Карьера', icon: 'fa-briefcase', hint: 'Проекты, должности, KPI'},
  ];

  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [decomposition, setDecomposition] = useState<any>(null);
  const [suggestedDeadline, setSuggestedDeadline] = useState<string>('');

  const handleNext = async () => {
    setError('');
    if (step === 1) {
      if (!goalData.title || !goalData.metric) {
        setError('Заполните название и метрику');
        return;
      }
      setLoading(true);
      try {
        const val = values.find(v => v.id === goalData.value_id);
        const result = await geminiService.validateGoal(val?.title || '', goalData.title!, goalData.metric!);
        if (!result.isValid) {
          setError(`AI Предупреждение: ${result.feedback}`);
          setLoading(false);
          return;
        }
        
        const date = new Date();
        date.setMonth(date.getMonth() + result.suggestedDeadlineMonths);
        setSuggestedDeadline(date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }));
        
        setAiFeedback(result.feedback);
        setStep(2);
      } catch (e) {
        setError('Ошибка проверки цели');
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      setLoading(true);
      try {
        const decomp = await geminiService.decomposeGoal(goalData.title!, goalData.metric!, goalData.target_value!, goalData.category!);
        setDecomposition(decomp);
        setStep(3);
      } catch (e) {
        setError('Ошибка декомпозиции');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFinish = () => {
    const goalId = crypto.randomUUID();
    const finalGoal: YearGoal = {
      id: goalId,
      category: goalData.category as GoalCategory || 'growth',
      value_id: goalData.value_id || '',
      title: goalData.title || '',
      description: goalData.description || '',
      metric: goalData.metric || '',
      target_value: goalData.target_value || 0,
      current_value: 0,
      start_date: new Date().toISOString(),
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      status: 'active' as GoalStatus,
      confidence_level: goalData.confidence_level || 50,
      logs: []
    };

    const finalSubGoals: SubGoal[] = (decomposition?.subGoals || []).map((s: any) => ({
      ...s,
      id: crypto.randomUUID(),
      year_goal_id: goalId,
      current_value: 0,
      deadline: new Date(new Date().setDate(new Date().getDate() + (s.estimated_days || 30))).toISOString()
    }));

    const finalProjects: Project[] = (decomposition?.projects || []).map((p: any) => ({
      ...p,
      id: crypto.randomUUID(),
      subgoal_id: finalSubGoals[0]?.id || '',
      owner_id: 'user-1',
      status: 'planned'
    }));

    onComplete(finalGoal, finalSubGoals, finalProjects);
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col">
      <header className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
        <button onClick={onCancel} className="text-slate-500"><i className="fa-solid fa-xmark text-xl"></i></button>
        <span className="font-bold">Шаг {step} из 3</span>
        <div className="w-6"></div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black text-slate-800">Какова главная цель?</h2>
            
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setGoalData({...goalData, category: cat.id})}
                  className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 text-center ${
                    goalData.category === cat.id ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-400'
                  }`}
                >
                  <i className={`fa-solid ${cat.icon} text-xl`}></i>
                  <span className="text-[10px] font-bold uppercase">{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ценность</label>
                <select 
                  className="w-full mt-1 p-4 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 focus:ring-indigo-500 transition-all font-semibold outline-none"
                  value={goalData.value_id}
                  onChange={e => setGoalData({...goalData, value_id: e.target.value})}
                >
                  {values.length > 0 ? values.map(v => <option key={v.id} value={v.id}>{v.title}</option>) : <option value="">Сначала добавьте ценность</option>}
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Формулировка</label>
                <input 
                  type="text" 
                  placeholder="Напр: Заработать 1 млн или Весить 80кг"
                  className="w-full mt-1 p-4 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 focus:ring-indigo-500 transition-all outline-none font-bold"
                  value={goalData.title}
                  onChange={e => setGoalData({...goalData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Метрика</label>
                  <input 
                    type="text" 
                    placeholder="Рубли / Кг"
                    className="w-full mt-1 p-4 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 focus:ring-indigo-500 transition-all outline-none font-semibold"
                    value={goalData.metric}
                    onChange={e => setGoalData({...goalData, metric: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Цель</label>
                  <input 
                    type="number" 
                    className="w-full mt-1 p-4 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 focus:ring-indigo-500 transition-all outline-none font-bold"
                    value={goalData.target_value}
                    onChange={e => setGoalData({...goalData, target_value: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black text-slate-800">Reality Check</h2>
            <div className="bg-slate-900 text-slate-100 p-6 rounded-[2rem] border border-slate-800 flex gap-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
               <i className="fa-solid fa-robot text-indigo-400 text-2xl"></i>
               <p className="text-sm leading-relaxed text-slate-300 font-medium">{aiFeedback}</p>
            </div>
            
            <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex flex-col items-center gap-2">
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI Прогноз завершения</span>
               <span className="text-xl font-black text-indigo-600">{suggestedDeadline}</span>
            </div>

            <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 text-amber-900 italic text-sm text-center">
              "AI считает, что для этой цели потребуется интенсивная работа. Вы готовы выделить 5-10 часов в неделю?"
            </div>
          </div>
        )}

        {step === 3 && decomposition && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black text-slate-800">План реализации</h2>
            
            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Фазы и сроки</h3>
              <div className="space-y-3">
                {decomposition.subGoals.map((sg: any, i: number) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <span className="text-sm font-bold text-slate-700 block">{sg.title}</span>
                      <span className="text-[9px] text-slate-400 font-bold">~{sg.estimated_days} дней</span>
                    </div>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">{sg.weight}%</span>
                  </div>
                ))}
              </div>
            </section>

            {decomposition.suggestedHabits && (
              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Рекомендуемые привычки</h3>
                <div className="flex flex-wrap gap-2">
                  {decomposition.suggestedHabits.map((habit: string, i: number) => (
                    <span key={i} className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">
                      <i className="fa-solid fa-check-circle mr-1"></i> {habit}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold border border-rose-100 flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation"></i>
            {error}
          </div>
        )}
      </div>

      <footer className="p-6 border-t sticky bottom-0 bg-white">
        <button 
          disabled={loading}
          onClick={step === 3 ? handleFinish : handleNext}
          className="w-full bg-indigo-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : null}
          {step === 3 ? 'ЗАПУСТИТЬ СИСТЕМУ' : 'ПРОДОЛЖИТЬ'}
        </button>
      </footer>
    </div>
  );
};