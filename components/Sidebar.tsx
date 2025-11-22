import React from 'react';
import { MessageSquare, LayoutDashboard, FolderOpen, Library, Briefcase, Search, Newspaper } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  
  const navItems = [
    { id: AppView.DASHBOARD, label: '学习主页', icon: LayoutDashboard },
    { id: AppView.PLAN_LIST, label: '我的计划', icon: FolderOpen }, 
    { id: AppView.JOB_MARKET, label: '岗位需求', icon: Search },
    { id: AppView.NEWS, label: '行业动态', icon: Newspaper },
    { id: AppView.REVIEW, label: '复习栏', icon: Library },
    { id: AppView.INTERVIEW, label: '面试模拟', icon: Briefcase },
    { id: AppView.TUTOR, label: 'AI 导师', icon: MessageSquare },
  ];

  return (
    <div className="w-20 lg:w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 shadow-xl z-50 transition-all duration-300">
      <div className="p-6 flex items-center justify-center lg:justify-start border-b border-slate-800">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-0 lg:mr-3">
            <span className="font-bold text-lg">A</span>
        </div>
        <h1 className="text-xl font-bold hidden lg:block">Agent<span className="text-indigo-400">Arch</span></h1>
      </div>
      
      <nav className="flex-1 mt-6 px-3 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (item.id === AppView.PLAN_LIST && (currentView === AppView.PLAN_CREATE || currentView === AppView.LEARNING_PATH));
          
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center justify-center lg:justify-start p-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              <span className="ml-3 font-medium hidden lg:block">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 hidden lg:block">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">坚持学习</p>
          <div className="flex items-center text-xs text-slate-300">
             <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
             AI 导师在线
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;