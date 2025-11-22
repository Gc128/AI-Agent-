import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import JobMarket from './components/JobMarket';
import NewsFeed from './components/NewsFeed';
import PlanGenerator from './components/PlanGenerator';
import DailyTaskView from './components/DailyTaskView';
import PlanList from './components/PlanList';
import TutorChat from './components/TutorChat';
import LoginScreen from './components/LoginScreen';
import ReviewSection from './components/ReviewSection';
import InterviewSimulator from './components/InterviewSimulator';
import { AppView, StudyPlan, DailyTask, ReviewItem } from './types';
import { BookMarked, GraduationCap, ArrowRight, Search, Newspaper } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [username, setUsername] = useState<string>('');
  
  // State for multiple plans
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  
  // State for Review Section
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);

  // Persistence: Load Data
  useEffect(() => {
    const savedName = localStorage.getItem('app_username');
    if (savedName) setUsername(savedName);

    const savedPlans = localStorage.getItem('app_plans');
    if (savedPlans) {
        try { 
          const parsed = JSON.parse(savedPlans);
          setPlans(Array.isArray(parsed) ? parsed : []); 
        } catch(e) { 
          console.error("Failed to parse plans"); 
          setPlans([]);
        }
    }

    const savedReviewItems = localStorage.getItem('app_review_items');
    if (savedReviewItems) {
        try { 
          const parsed = JSON.parse(savedReviewItems);
          setReviewItems(Array.isArray(parsed) ? parsed : []);
        } catch(e) { 
          console.error("Failed to parse reviews"); 
          setReviewItems([]);
        }
    }
  }, []);

  // Persistence: Save Data
  // Fixed: Save even if empty to ensure deletions are persisted
  useEffect(() => {
     localStorage.setItem('app_plans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
     localStorage.setItem('app_review_items', JSON.stringify(reviewItems));
  }, [reviewItems]);

  const handleLogin = (name: string) => {
    setUsername(name);
    localStorage.setItem('app_username', name);
  };

  // Get current active plan
  const currentPlan = plans.find(p => p.id === currentPlanId);

  const handlePlanCreated = (newPlan: StudyPlan) => {
    setPlans(prev => [...prev, newPlan]);
    setCurrentPlanId(newPlan.id);
    setCurrentView(AppView.LEARNING_PATH);
  };

  const handleDeletePlan = (planId: string) => {
    if (window.confirm("确定要删除这个学习计划吗？")) {
        const newPlans = plans.filter(p => p.id !== planId);
        setPlans(newPlans);
        // LocalStorage update handled by useEffect
        if (currentPlanId === planId) {
            setCurrentPlanId(null);
            setCurrentView(AppView.PLAN_LIST);
        }
    }
  };

  const handleUpdateTask = (updatedTask: DailyTask) => {
    if (!currentPlanId) return;
    
    setPlans(prevPlans => prevPlans.map(plan => {
        if (plan.id === currentPlanId) {
            return {
                ...plan,
                schedule: plan.schedule.map(t => t.day === updatedTask.day ? updatedTask : t)
            };
        }
        return plan;
    }));
  };

  // Review Section Handlers
  const handleAddReviewItem = (item: ReviewItem) => {
      setReviewItems(prev => [item, ...prev]);
  };
  const handleUpdateReviewItem = (item: ReviewItem) => {
      setReviewItems(prev => prev.map(i => i.id === item.id ? item : i));
  };
  const handleDeleteReviewItem = (id: string) => {
      setReviewItems(prev => prev.filter(i => i.id !== id));
  };

  // Login Gate
  if (!username) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <div className="max-w-5xl mx-auto p-6">
            <header className="mb-10">
              <h1 className="text-4xl font-bold text-slate-900">欢迎回来，{username}同学。</h1>
              <p className="text-lg text-slate-600 mt-2">您成为 AI Agent 专家的旅程仍在继续。</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               {/* Stats Card */}
               <div className="bg-gradient-to-br from-indigo-600 to-slate-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                     <GraduationCap size={150} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-indigo-200 font-medium mb-1">活跃计划</p>
                    <h2 className="text-5xl font-bold mb-4">{plans.length}</h2>
                    <p className="text-sm text-slate-300">
                        {plans.length > 0 ? "正在进行的学习路线" : "暂无学习计划"}
                    </p>
                  </div>
               </div>

               {/* Quick Action */}
               <div 
                 onClick={() => setCurrentView(AppView.PLAN_LIST)}
                 className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all group"
               >
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BookMarked size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      我的学习档案
                  </h3>
                  <p className="text-slate-600 flex items-center">
                      查看所有计划或创建新计划 <ArrowRight size={16} className="ml-2" />
                  </p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Job Market Teaser */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center">
                            <Search className="mr-2 text-indigo-600" /> 热门岗位
                        </h3>
                        <button onClick={() => setCurrentView(AppView.JOB_MARKET)} className="text-indigo-600 hover:underline text-sm">
                            前往求职广场 →
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {['AI Agent 开发工程师', '大模型算法实习生', 'React 前端专家', 'RAG 应用开发'].map((job, i) => (
                            <span key={i} className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 font-medium text-sm">
                                {job}
                            </span>
                        ))}
                    </div>
                </div>

                 {/* News Teaser */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center">
                            <Newspaper className="mr-2 text-indigo-600" /> 行业动态
                        </h3>
                        <button onClick={() => setCurrentView(AppView.NEWS)} className="text-indigo-600 hover:underline text-sm">
                            查看今日简报 →
                        </button>
                    </div>
                    <p className="text-slate-500 text-sm">
                        获取 AI Agent、LLM 工程及大模型领域的最新前沿资讯摘要。
                    </p>
                </div>
            </div>
          </div>
        );
      
      case AppView.JOB_MARKET:
        return <JobMarket />;

      case AppView.NEWS:
        return <NewsFeed />;
      
      case AppView.PLAN_LIST:
        return (
            <PlanList 
                plans={plans} 
                onSelectPlan={(id) => { setCurrentPlanId(id); setCurrentView(AppView.LEARNING_PATH); }}
                onCreateNew={() => setCurrentView(AppView.PLAN_CREATE)}
                onDeletePlan={handleDeletePlan}
            />
        );

      case AppView.PLAN_CREATE:
        return <PlanGenerator onPlanCreated={handlePlanCreated} />;
      
      case AppView.LEARNING_PATH:
        if (!currentPlan) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <p className="text-slate-500">未找到选定的计划。</p>
                    <button onClick={() => setCurrentView(AppView.PLAN_LIST)} className="mt-4 text-indigo-600">返回列表</button>
                </div>
            )
        }
        const currentTask = currentPlan.schedule.find(t => t.day === selectedDay) || currentPlan.schedule[0];
        
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
                 {/* Header for Learning Path */}
                 <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
                    <div>
                        <button onClick={() => setCurrentView(AppView.PLAN_LIST)} className="text-xs text-slate-500 hover:text-indigo-600 mb-1 flex items-center">
                            ← 返回计划列表
                        </button>
                        <h2 className="text-xl font-bold text-slate-800">{currentPlan.title}</h2>
                    </div>
                    <div className="text-sm text-slate-500">
                        {currentPlan.schedule.filter(t => t.completed).length} / {currentPlan.totalDays} 天完成
                    </div>
                 </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Timeline Sidebar */}
                    <div className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-10">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 text-sm">
                            课程目录
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {currentPlan.schedule.map((day) => (
                                <button
                                    key={day.day}
                                    onClick={() => setSelectedDay(day.day)}
                                    className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-start justify-between transition-colors ${
                                        selectedDay === day.day 
                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                            : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                                    }`}
                                >
                                    <div>
                                        <span className="block font-medium text-xs opacity-70 mb-0.5">Day {day.day}</span>
                                        <span className="font-medium line-clamp-1">{day.topic}</span>
                                    </div>
                                    {day.completed && <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Main Task View */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <DailyTaskView 
                            task={currentTask} 
                            targetRole={currentPlan.targetRole}
                            onUpdateTask={handleUpdateTask} 
                        />
                    </div>
                </div>
            </div>
        );
    
      case AppView.REVIEW:
        return (
            <ReviewSection 
                items={reviewItems}
                onAddItem={handleAddReviewItem}
                onUpdateItem={handleUpdateReviewItem}
                onDeleteItem={handleDeleteReviewItem}
            />
        );

      case AppView.INTERVIEW:
        return (
            <InterviewSimulator />
        );

      case AppView.TUTOR:
        return (
            <div className="p-4 h-full">
                <TutorChat />
            </div>
        );
        
      default:
        return <div>Select a view</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      <main className="flex-1 ml-20 lg:ml-64 transition-all duration-300 relative">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;