import React, { useState } from 'react';
import { generateStudyPlan } from '../services/geminiService';
import { StudyPlan } from '../types';
import { Upload, Zap, CheckCircle2 } from 'lucide-react';

interface PlanGeneratorProps {
  onPlanCreated: (plan: StudyPlan) => void;
}

const PlanGenerator: React.FC<PlanGeneratorProps> = ({ onPlanCreated }) => {
  const [role, setRole] = useState('');
  const [days, setDays] = useState(30);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageBase64: string | undefined = undefined;
      
      if (imageFile) {
        imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove data url prefix for Gemini
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
          };
          reader.readAsDataURL(imageFile);
        });
      }

      const plan = await generateStudyPlan(role, days, imageBase64);
      onPlanCreated(plan);
    } catch (error) {
      console.error(error);
      alert("生成计划失败，请重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-white text-center">
          <Zap size={48} className="mx-auto mb-4 text-indigo-200" />
          <h2 className="text-3xl font-bold mb-2">创建您的学习智能体</h2>
          <p className="text-indigo-100">上传您的简历或描述理想职位，获取定制课程。</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">目标职位与规划</label>
            <textarea
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="例如：高级 AI Agent 开发人员，专注于 LangChain 和自主系统..."
              className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">时间周期 (天)</label>
                <input
                type="number"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                min={7}
                max={90}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">参考资料 (可选)</label>
                <div className="relative">
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-full p-3 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                        {imageFile ? (
                            <span className="flex items-center text-indigo-600"><CheckCircle2 size={18} className="mr-2"/> {imageFile.name.substring(0, 15)}...</span>
                        ) : (
                            <span className="flex items-center"><Upload size={18} className="mr-2"/> 上传 JD/图片</span>
                        )}
                    </div>
                </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all ${
              loading 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30'
            }`}
          >
            {loading ? '正在分析并生成计划...' : '生成我的计划'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PlanGenerator;