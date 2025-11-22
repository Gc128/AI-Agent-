import React from 'react';
import { StudyPlan } from '../types';
import { Folder, Plus, Calendar, ChevronRight, Trash2 } from 'lucide-react';

interface PlanListProps {
  plans: StudyPlan[];
  onSelectPlan: (planId: string) => void;
  onCreateNew: () => void;
  onDeletePlan: (planId: string) => void;
}

const PlanList: React.FC<PlanListProps> = ({ plans, onSelectPlan, onCreateNew, onDeletePlan }) => {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-3xl font-bold text-slate-900">我的学习档案</h2>
            <p className="text-slate-500 mt-1">管理您的所有 AI 学习路线图</p>
        </div>
        <button 
            onClick={onCreateNew}
            className="flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md transition-all"
        >
            <Plus size={20} className="mr-2" />
            新建计划
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {plans.length === 0 ? (
            <div className="col-span-2 py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <Folder size={64} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">还没有学习计划</h3>
                <p className="text-slate-400 mb-6">创建一个新的计划来开启您的 AI 之旅</p>
                <button 
                    onClick={onCreateNew}
                    className="text-indigo-600 font-medium hover:text-indigo-800 hover:underline"
                >
                    立即创建 →
                </button>
            </div>
        ) : (
            plans.map(plan => {
                const progress = Math.round((plan.schedule.filter(t => t.completed).length / plan.totalDays) * 100);
                return (
                    <div 
                        key={plan.id} 
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group relative cursor-pointer"
                        onClick={() => onSelectPlan(plan.id)}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                                <Folder className="text-indigo-600" size={24} />
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeletePlan(plan.id); }}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors line-clamp-1">
                            {plan.title || plan.targetRole}
                        </h3>
                        <p className="text-slate-500 text-sm mb-6 line-clamp-2 h-10">
                            {plan.overview}
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm text-slate-500">
                                <span className="flex items-center"><Calendar size={14} className="mr-1"/> {plan.totalDays} 天计划</span>
                                <span>{progress}% 完成</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>

                        <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                            <ChevronRight className="text-indigo-400" />
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};

export default PlanList;
