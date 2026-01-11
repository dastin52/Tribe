
import React, { useState, useEffect } from 'react';
import { Value, YearGoal, SubGoal, Project, GoalCategory, GoalStatus, TaskFrequency } from '../types';
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
    metric: '₽',
    category: 'finance',
    target_value: 0,
    value_id: values[0]?.id || 'v_gen',
    status: 'active' as GoalStatus,
    confidence_level: 50
  });

  const categories: {id: GoalCategory, label: string, icon: string, metrics: string[], hint: string}[] = [
    {id: 'finance', label: 'Капитал', icon: 'fa-wallet', metrics: ['₽', '$', '%'], hint: 'Покупки, накопления'},
    {id: 'sport', label: 'Тело', icon: 'fa-dumbbell', metrics: ['км', 'тренировки', 'кг', 'раз'], hint: 'Здоровье, энергия'},
    {id: 'growth', label: 'Мозг', icon: 'fa-book-open', metrics: ['часы', 'книги', 'уроки', 'баллы'], hint: 'Навыки, обучение'},
    {id: 'work', label: 'Дело', icon: 'fa-briefcase', metrics: ['проекты', 'часы', 'сделки'], hint: 'Проекты, доходы'},
    {id: 'other', label: 'Другое', icon: 'fa-mountain-sun', metrics: ['раз', 'дни'], hint: 'Личное'},
  ];

  const currentCategory = categories.find(c => c.id === goalData.category);

  useEffect(() => {
    if (currentCategory && !currentCategory.metrics.includes(goalData.metric!)) {
      setGoalData(prev => ({ ...prev, metric: currentCategory.metrics[0] }));
    }
  }, [goalData.category]);

  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [decomposition, setDecomposition] = useState<any>(null);
  const [suggestedDeadline, setSuggestedDeadline] = useState<string>('');

  const handleNext = async () => {
    setError('');
    if (step === 1) {
      if (!goalData.title || !goalData.metric || !goalData.target_value) {
        setError('Укажи цель, метрику и объем');
        return;
      }
      setLoading(true);
      try {
        const val = values.find(v => v.id === goalData.value_id);
        const result = await geminiService.validateGoal(val?.title || 'Общее развитие', goalData.title!, goalData.metric!);
        
        if (result.isValid === false && result.feedback) {
          setError(`ИИ: ${result.feedback}`);
          setLoading(false);
          return;
        }
        
        const date = new Date();
        const months = result.suggestedDeadlineMonths || 12;
        date.setMonth(date.getMonth() + months);
        setSuggestedDeadline(date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }));
        
        setAiFeedback(result.feedback || 'Цель выглядит амбициозно. Давай составим план действий.');
        setStep(2);
      } catch (e) {
        setStep(2); 
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
        setError('Ошибка декомпозиции плана');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFinish = () => {
    const goalId = crypto.randomUUID();
    const finalGoal: YearGoal = {
      id: goalId,
      category: goalData.category as GoalCategory || 'finance',
      value_id: goalData.value_id || 'v_gen',
      title: goalData.title || '',
      description: goalData.description || '',
      metric: goalData.metric || '₽',
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
      deadline: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      frequency: (s.frequency || 'monthly') as TaskFrequency,
      auto_calculate_amount: s.auto_calculate_amount
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
    <div className="fixed inset-0 bg-white z-[110] flex flex-col animate-fade-in">
      <header className="p-6 border-b flex justify-between items-center bg-white">
        <button onClick={onCancel} className="text-slate-400 w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center active:scale-90"><i className="fa-solid fa-xmark"></i></button>
        <span className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-300">Шаг {step} из 3</span>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar pb-32">
        {step === 1 && (
          <div className="space-y-8">
            <div>
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Новая цель</h2>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Выбери категорию и параметры</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setGoalData({...goalData, category: cat.id})}
                  className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-2 text-center ${
                    goalData.category === cat.id ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg' : 'border-slate-50 bg-slate-50 text-slate-300'
                  }`}
                >
                  <i className={`fa-solid ${cat.icon} text-2xl`}></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Что нужно достичь?</label>
                <input 
                  type="text" 
                  placeholder="Например: Сдать IELTS на 7.5"
                  className="w-full p-5 bg-slate-50 rounded-[2rem] border-none ring-2 ring-slate-100 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-800 shadow-sm"
                  value={goalData.title}
                  onChange={e => setGoalData({...goalData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Объем цели (число)</label>
                  <input 
                    type="number" 
                    placeholder="100"
                    className="w-full p-5 bg-slate-50 rounded-[2rem] border-none ring-2 ring-slate-100 focus:ring-indigo-500 transition-all outline-none font-black text-slate-900 text-3xl text-center"
                    value={goalData.target_value || ''}
                    onChange={e => setGoalData({...goalData, target_value: Number(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Метрика измерения</label>
                  <div className="flex flex-wrap gap-2">
                     {currentCategory?.metrics.map(m => (
                       <button 
                         key={m}
                         onClick={() => setGoalData({...goalData, metric: m})}
                         className={`px-6 py-3 rounded-2xl font-black text-xs transition-all border ${goalData.metric === m ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                       >
                         {m}
                       </button>
                     ))}
                     <input 
                       type="text"
                       placeholder="Своя..."
                       className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none w-28 focus:ring-2 focus:ring-indigo-500"
                       value={currentCategory?.metrics.includes(goalData.metric!) ? '' : goalData.metric}
                       onChange={e => setGoalData({...goalData, metric: e.target.value})}
                     />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-fade-in text-center">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Вердикт ИИ</h2>
            <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] relative overflow-hidden shadow-2xl min-h-[200px] flex items-center">
               <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-[70px]"></div>
               <div className="z-10 relative">
                  <p className="text-lg leading-relaxed text-indigo-100 font-bold italic">"{aiFeedback}"</p>
               </div>
            </div>
            
            <div className="p-10 bg-indigo-50 rounded-[3.5rem] border border-indigo-100 flex flex-col items-center gap-2">
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Прогноз финиша</span>
               <span className="text-3xl font-black text-indigo-600 tracking-tighter italic uppercase">{suggestedDeadline}</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-fade-in">
            <div>
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">План роста</h2>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">ИИ разложил твою цель на шаги</p>
            </div>
            
            <section className="space-y-4">
              {decomposition?.subGoals?.map((sg: any, i: number) => (
                <div key={i} className="p-6 bg-white rounded-[2.5rem] border border-slate-100 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl">
                      {i + 1}
                    </div>
                    <div>
                      <span className="text-sm font-black text-slate-800 block leading-tight">{sg.title}</span>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{sg.target_value} {sg.metric} • {sg.frequency}</span>
                    </div>
                  </div>
                  <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-500" style={{ width: `${sg.weight}%` }}></div>
                  </div>
                </div>
              ))}
            </section>

            {decomposition?.suggestedHabits && (
              <div className="space-y-3 pt-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Рекомендуемые привычки</h4>
                 <div className="flex flex-wrap gap-2">
                    {decomposition.suggestedHabits.map((h: string, i: number) => (
                      <span key={i} className="px-5 py-2.5 bg-slate-900 text-white text-[9px] font-black uppercase rounded-full tracking-widest shadow-lg shadow-slate-200">{h}</span>
                    ))}
                 </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-6 bg-rose-50 text-rose-600 rounded-[2rem] text-xs font-bold border border-rose-100 flex items-center gap-3 animate-scale-up shadow-sm">
            <i className="fa-solid fa-triangle-exclamation text-lg"></i>
            <span>{error}</span>
          </div>
        )}
      </div>

      <footer className="p-8 border-t bg-white/90 backdrop-blur-md sticky bottom-0 z-20">
        <button 
          disabled={loading}
          onClick={step === 3 ? handleFinish : handleNext}
          className="w-full bg-slate-900 text-white font-black py-7 rounded-[2.5rem] shadow-2xl shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-bolt-lightning text-amber-400"></i>}
          <span className="uppercase tracking-[0.2em] text-sm">
            {step === 3 ? 'Активировать систему' : 'Далее'}
          </span>
        </button>
      </footer>
    </div>
  );
};
