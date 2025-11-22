import React, { useState } from 'react';
import { DailyTask } from '../types';
import { reviewDailyProgress, generateDailyLearningMaterial } from '../services/geminiService';
import { CheckCircle, BookOpen, ExternalLink, Send, Loader2, RefreshCw, Save, Download, PenTool } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { marked } from 'marked';

interface DailyTaskViewProps {
  task: DailyTask;
  targetRole: string;
  onUpdateTask: (updatedTask: DailyTask) => void;
}

const DailyTaskView: React.FC<DailyTaskViewProps> = ({ task, targetRole, onUpdateTask }) => {
  const [notes, setNotes] = useState(task.userNotes || '');
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customRequirements, setCustomRequirements] = useState('');
  const [showReqInput, setShowReqInput] = useState(false);

  const handleGenerateContent = async () => {
    setGenerating(true);
    try {
      const { content, links } = await generateDailyLearningMaterial(
          task.topic, 
          targetRole,
          customRequirements
      );
      onUpdateTask({
        ...task,
        detailedContent: content,
        generatedLinks: links
      });
      setShowReqInput(false);
    } catch (e) {
      console.error(e);
      alert("生成内容失败");
    } finally {
      setGenerating(false);
    }
  };

  const handleExportWord = () => {
    if (!task.detailedContent) return;

    // Convert markdown to HTML
    const contentHtml = marked.parse(task.detailedContent);
    
    const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${task.topic}</title></head><body>
        <h1>${task.topic}</h1>
        <p><em>Day ${task.day} - AgentArchitect AI Learning Material</em></p>
        <hr/>
    `;
    const footer = "</body></html>";
    const sourceHTML = header + contentHtml + footer;

    const blob = new Blob(['\ufeff', sourceHTML], {
        type: 'application/msword'
    });
    
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${task.topic}_学习资料.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const handleComplete = async () => {
    if (!notes.trim()) return alert("请填写一些关于您学习内容的笔记！");
    
    setSubmitting(true);
    try {
      const result = await reviewDailyProgress(task, notes);
      onUpdateTask({
        ...task,
        completed: true,
        score: result.score,
        feedback: result.feedback,
        userNotes: notes
      });
    } catch (e) {
      console.error(e);
      alert("提交进度失败。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6 border border-slate-200">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <span className="inline-block bg-indigo-500/30 border border-indigo-400/30 rounded-md px-2 py-1 text-xs font-bold tracking-wider uppercase mb-2 text-indigo-100">
              Day {task.day}
            </span>
            <h2 className="text-3xl font-bold">{task.topic}</h2>
          </div>
          {task.completed && (
            <div className="bg-emerald-500 text-white px-4 py-2 rounded-full flex items-center shadow-lg shadow-emerald-900/20 relative z-10">
              <CheckCircle size={20} className="mr-2" />
              <span className="font-bold">已完成 {task.score}/100</span>
            </div>
          )}
        </div>

        <div className="p-8">
          <p className="text-slate-600 text-lg mb-8 leading-relaxed">{task.description}</p>
          
          {/* Checklist */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                <div className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></div>
                今日任务清单
            </h3>
            <ul className="space-y-3">
              {(task.tasks || []).map((t, i) => (
                <li key={i} className="flex items-start group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 mr-3 transition-colors ${task.completed ? 'bg-indigo-100 border-indigo-300' : 'border-slate-300 bg-white'}`}>
                    <div className={`w-2.5 h-2.5 rounded-sm bg-indigo-600 transition-opacity ${task.completed ? 'opacity-100' : 'opacity-0'}`}></div>
                  </div>
                  <span className={`text-slate-700 ${task.completed ? 'line-through text-slate-400' : ''}`}>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Dynamic Content Section */}
          <div className="border-t border-slate-100 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center">
                <BookOpen className="mr-3 text-indigo-600" size={28} />
                学习资料
              </h3>
              
              <div className="flex items-center gap-2">
                  {task.detailedContent && (
                     <button 
                       onClick={handleExportWord}
                       className="text-sm px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all flex items-center border border-indigo-200"
                     >
                       <Download size={16} className="mr-2" />
                       导出 Word
                     </button>
                  )}
                  {task.detailedContent && (
                     <button 
                       onClick={() => setShowReqInput(!showReqInput)}
                       className="text-sm px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all flex items-center border border-slate-200 hover:border-indigo-200"
                     >
                       <RefreshCw size={16} className={`mr-2 ${generating ? 'animate-spin' : ''}`} />
                       {showReqInput ? "取消重新生成" : "重新生成"}
                     </button>
                  )}
              </div>
            </div>
            
            {/* Requirements Input */}
            {(showReqInput || (!task.detailedContent && !generating)) && (
                <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center">
                        <PenTool size={14} className="mr-2"/> 自定义需求 (可选)
                    </label>
                    <textarea 
                        value={customRequirements}
                        onChange={(e) => setCustomRequirements(e.target.value)}
                        placeholder="例如：请多举一些 Python 代码例子，或者请重点讲解 Transformer 的架构..."
                        className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 resize-none h-20"
                    />
                    {!task.detailedContent && (
                        <button
                            onClick={handleGenerateContent}
                            disabled={generating}
                            className="mt-3 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center shadow-sm"
                        >
                            {generating ? <Loader2 className="animate-spin mr-2" size={16} /> : <BookOpen className="mr-2" size={16} />}
                            {generating ? '正在搜寻全网资料...' : '一键生成内容'}
                        </button>
                    )}
                    {task.detailedContent && (
                         <button
                            onClick={handleGenerateContent}
                            disabled={generating}
                            className="mt-3 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center shadow-sm"
                        >
                             {generating ? '生成中...' : '按新要求重新生成'}
                        </button>
                    )}
                </div>
            )}

            {generating && !task.detailedContent && (
                 <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={32} />
                    <p className="text-slate-500">AI 正在为您定制专属教程...</p>
                 </div>
            )}

            {task.detailedContent && !generating ? (
              <div className="space-y-8">
                {/* Main Content */}
                <div className="bg-white">
                    <MarkdownRenderer content={task.detailedContent} />
                </div>

                {/* Links Section - Now at the bottom */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide border-b border-slate-200 pb-2 flex items-center">
                        <ExternalLink size={16} className="mr-2"/> 推荐网页链接
                    </h4>
                    {task.generatedLinks && task.generatedLinks.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {task.generatedLinks.map((link, idx) => (
                                <a 
                                    key={idx}
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="block p-4 bg-white border border-slate-200 rounded-lg hover:border-indigo-400 hover:shadow-md transition-all group"
                                >
                                    <p className="text-sm font-medium text-slate-800 group-hover:text-indigo-600 line-clamp-2 mb-2">{link.title}</p>
                                    <div className="flex items-center text-xs text-slate-400 group-hover:text-indigo-400">
                                        <ExternalLink size={12} className="mr-1" />
                                        <span className="truncate">{new URL(link.url).hostname}</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 italic">暂无链接生成。</p>
                    )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Submission Section */}
      {!task.completed ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-xl mb-6 text-slate-800 flex items-center">
            <Save className="mr-2 text-indigo-600" />
            提交作业 & 打卡
          </h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-600 mb-2">今日学习心得</label>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="在这里记录你的学习笔记、代码片段或心得体会..."
                className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none bg-slate-50"
            />
          </div>
          <div className="flex justify-end">
            <button
                onClick={handleComplete}
                disabled={submitting}
                className="flex items-center justify-center px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {submitting ? 'AI 正在评分...' : (
                <>
                    <Send size={18} className="mr-2" /> 提交打卡
                </>
                )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 p-8 rounded-2xl shadow-sm">
          <div className="flex items-start">
            <div className="p-4 bg-indigo-100 rounded-full mr-5 flex-shrink-0">
                <CheckCircle className="text-indigo-600" size={32} />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-indigo-900 mb-3 text-xl">导师反馈 (得分: {task.score})</h3>
                <div className="prose prose-indigo text-indigo-800/80 leading-relaxed mb-6">
                    {task.feedback}
                </div>
                
                <div className="bg-white rounded-xl border border-indigo-100 p-5">
                    <strong className="block text-xs text-slate-400 uppercase tracking-wide mb-2">你的笔记</strong>
                    <p className="text-slate-700 whitespace-pre-wrap">{task.userNotes}</p>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTaskView;