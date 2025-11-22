import React, { useState, useRef, useEffect } from 'react';
import { createInterviewSession } from '../services/geminiService';
import { ChatMessage, InterviewSession } from '../types';
import { Send, Upload, Briefcase, User, Plus, Trash2, Download, RefreshCw, MessageSquare, FileText } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { marked } from 'marked';
import { Content } from '@google/genai';

const InterviewSimulator: React.FC = () => {
  // Sidebar & Persistence State
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // UI State for New Interview Form
  const [formRole, setFormRole] = useState('');
  const [formResumeText, setFormResumeText] = useState('');
  const [formResumeFile, setFormResumeFile] = useState<File | null>(null);
  
  // Chat State
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatInstances = useRef<Map<string, any>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load from Local Storage on Mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('interview_sessions');
    if (savedSessions) {
        try {
            const parsed = JSON.parse(savedSessions);
            setSessions(Array.isArray(parsed) ? parsed : []);
            
            const savedActiveId = localStorage.getItem('active_interview_id');
            if (savedActiveId && parsed.find((s: any) => s.id === savedActiveId)) {
                setActiveSessionId(savedActiveId);
            }
        } catch (e) {
            console.error("Failed to load interviews", e);
            setSessions([]);
        }
    }
  }, []);

  // Save to Local Storage on Update
  useEffect(() => {
    if (sessions.length > 0) {
        localStorage.setItem('interview_sessions', JSON.stringify(sessions));
    } else {
        localStorage.removeItem('interview_sessions');
    }
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId) {
        localStorage.setItem('active_interview_id', activeSessionId);
    } else {
        localStorage.removeItem('active_interview_id');
    }
  }, [activeSessionId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormResumeFile(e.target.files[0]);
    }
  };

  const startNewInterview = async () => {
    if (!formRole.trim()) return alert("请输入目标岗位");
    setLoading(true);

    try {
      let base64Image: string | undefined = undefined;
      if (formResumeFile) {
        if (formResumeFile.type.startsWith('image/')) {
             base64Image = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  resolve((reader.result as string).split(',')[1]);
                };
                reader.readAsDataURL(formResumeFile);
              });
        } else {
            alert("目前文件上传仅支持图片格式（如简历截图）。文字版简历请直接粘贴到文本框中。");
            setLoading(false);
            return;
        }
      }

      // Initialize Chat with Gemini
      // We pass NO history to indicate a fresh start
      const chat = createInterviewSession(formRole, formResumeText, base64Image);
      
      // Create Session Object
      const newId = Date.now().toString();
      const initialMessages: ChatMessage[] = [{
          id: 'init',
          role: 'model',
          text: `你好。我是这次 ${formRole} 岗位的面试官。我已经看过了你的简历。\n\n让我们开始吧。首先，请做一个简单的自我介绍，并重点讲讲你觉得最有挑战性的一个项目。`,
          timestamp: Date.now()
      }];

      const newSession: InterviewSession = {
          id: newId,
          role: formRole,
          startDate: Date.now(),
          messages: initialMessages,
          isFinished: false
      };

      // Update State
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newId);
      chatInstances.current.set(newId, chat);
      
      // Reset Form
      setFormRole('');
      setFormResumeText('');
      setFormResumeFile(null);

    } catch (e) {
      console.error(e);
      alert("启动面试失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm("确定要删除这条面试记录吗？")) {
          const newSessions = sessions.filter(s => s.id !== id);
          setSessions(newSessions);
          chatInstances.current.delete(id);
          
          if (activeSessionId === id) {
              setActiveSessionId(null);
          }
      }
  };

  const getChatInstance = (session: InterviewSession) => {
      if (!chatInstances.current.has(session.id)) {
          // Re-hydrate history
          const history: Content[] = session.messages.map(m => ({
              role: m.role,
              parts: [{ text: m.text }]
          }));

          const chat = createInterviewSession(session.role, undefined, undefined, history);
          chatInstances.current.set(session.id, chat);
      }
      return chatInstances.current.get(session.id);
  };

  // Refactored to support manual triggers (for ending interview)
  const handleSend = async (overrideText?: string) => {
      const textToSend = overrideText || input;
      if ((!textToSend.trim() && !loading) || !activeSessionId) return;
      
      const currentSession = sessions.find(s => s.id === activeSessionId);
      if (!currentSession) return;

      // Only clear input if it was user typed
      if (!overrideText) setInput('');
      
      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: textToSend,
          timestamp: Date.now()
      };

      // Optimistic Update
      const updatedSession = {
          ...currentSession,
          messages: [...currentSession.messages, userMsg]
      };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? updatedSession : s));
      setLoading(true);

      try {
          const chat = getChatInstance(currentSession);
          const result = await chat.sendMessageStream({ message: textToSend });
          
          let fullResponse = "";
          const modelMsgId = (Date.now() + 1).toString();
          
          // Placeholder for stream
          setSessions(prev => prev.map(s => 
            s.id === activeSessionId 
             ? { ...s, messages: [...s.messages, { id: modelMsgId, role: 'model', text: '', timestamp: Date.now() }] } 
             : s
          ));

          for await (const chunk of result) {
              const text = chunk.text || '';
              fullResponse += text;
              
              setSessions(prev => prev.map(s => {
                  if (s.id === activeSessionId) {
                      const msgs = s.messages.map(m => m.id === modelMsgId ? { ...m, text: fullResponse } : m);
                      return { ...s, messages: msgs };
                  }
                  return s;
              }));
          }

      } catch (e) {
          console.error(e);
          setSessions(prev => prev.map(s => 
            s.id === activeSessionId 
             ? { ...s, messages: [...s.messages, { id: Date.now().toString(), role: 'model', text: '网络错误，请重试。', isError: true, timestamp: Date.now() }] } 
             : s
          ));
      } finally {
          setLoading(false);
      }
  };

  const handleEndInterview = () => {
      if (!activeSessionId) return;
      
      // Mark as finished locally first
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, isFinished: true } : s));
      
      // Programmatically send the trigger for the report
      handleSend("面试已结束，请立即根据刚才的表现生成一份详细的面试评估报告（包含优势、劣势、代码评价及建议）。");
  };

  const handleExportPDF = () => {
      if (!activeSessionId) return;
      const currentSession = sessions.find(s => s.id === activeSessionId);
      if (!currentSession) return;

      const lastMessage = currentSession.messages[currentSession.messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'model') return alert("未找到评估报告内容");

      const contentHtml = marked.parse(lastMessage.text);
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>面试评估报告 - ${currentSession.role}</title>
                <style>
                  body { font-family: sans-serif; padding: 40px; line-height: 1.6; color: #333; }
                  h1 { font-size: 24px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                  h2 { font-size: 20px; margin-top: 30px; color: #2c3e50; }
                  h3 { font-size: 18px; color: #34495e; }
                  code { background: #f5f5f5; padding: 2px 4px; border-radius: 4px; }
                  pre { background: #f5f5f5; padding: 15px; border-radius: 8px; overflow-x: auto; }
                  hr { border: 0; border-top: 1px solid #eee; margin: 30px 0; }
                </style>
              </head>
              <body>
                <h1>面试评估报告: ${currentSession.role}</h1>
                <p><em>Date: ${new Date().toLocaleDateString()}</em></p>
                <hr/>
                ${contentHtml}
                <script>
                  window.onload = function() { window.print(); }
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
      }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
      <div className="flex h-[calc(100vh-4rem)] bg-slate-50 max-w-7xl mx-auto shadow-xl rounded-2xl overflow-hidden border border-slate-200">
          
          {/* Sidebar List */}
          <div className="w-72 bg-slate-900 flex flex-col border-r border-slate-800">
              <div className="p-5 border-b border-slate-800">
                  <button 
                    onClick={() => setActiveSessionId(null)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/50 flex items-center justify-center transition-all"
                  >
                      <Plus size={18} className="mr-2"/> 新建面试
                  </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {sessions.length === 0 && (
                      <div className="text-slate-500 text-center py-10 text-sm">
                          <Briefcase size={32} className="mx-auto mb-2 opacity-30"/>
                          暂无面试记录
                      </div>
                  )}
                  {sessions.map(session => (
                      <div 
                        key={session.id}
                        onClick={() => setActiveSessionId(session.id)}
                        className={`group relative p-4 rounded-xl cursor-pointer transition-all border ${
                            activeSessionId === session.id 
                                ? 'bg-slate-800 border-indigo-500/50 text-white shadow-md' 
                                : 'bg-slate-900 border-transparent text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                          <div className="flex justify-between items-start mb-1">
                              <h3 className="font-bold truncate pr-6">{session.role}</h3>
                              <button 
                                onClick={(e) => handleDeleteSession(e, session.id)}
                                className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3"
                                title="删除记录"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                          <div className="flex items-center justify-between text-xs opacity-70">
                              <span>{new Date(session.startDate).toLocaleDateString()}</span>
                              {session.isFinished && <span className="text-emerald-400">已完成</span>}
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-slate-50 flex flex-col h-full relative">
              {!activeSession ? (
                  // SETUP FORM VIEW
                  <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
                      <div className="w-full max-w-2xl bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                          <div className="text-center mb-8">
                              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                                  <Briefcase size={32} />
                              </div>
                              <h2 className="text-2xl font-bold text-slate-900">开启模拟面试</h2>
                              <p className="text-slate-500 mt-2">AI 面试官将针对您的简历和目标岗位进行全真模拟</p>
                          </div>

                          <div className="space-y-6">
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-2">目标岗位</label>
                                  <input 
                                    type="text" 
                                    value={formRole}
                                    onChange={(e) => setFormRole(e.target.value)}
                                    placeholder="例如：高级前端工程师、Java 后端开发..."
                                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                                  />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">上传简历 (图片)</label>
                                      <div className="border-2 border-dashed border-slate-200 rounded-xl h-32 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors relative cursor-pointer">
                                          <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                          />
                                          {formResumeFile ? (
                                              <span className="text-indigo-600 font-medium px-4 truncate w-full">
                                                  {formResumeFile.name}
                                              </span>
                                          ) : (
                                              <>
                                                <Upload size={24} className="text-slate-400 mb-2"/>
                                                <span className="text-xs text-slate-400">点击上传图片版简历</span>
                                              </>
                                          )}
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">粘贴文本简历</label>
                                      <textarea 
                                          value={formResumeText}
                                          onChange={(e) => setFormResumeText(e.target.value)}
                                          placeholder="或在此粘贴简历内容..."
                                          className="w-full h-32 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none text-sm bg-slate-50"
                                      />
                                  </div>
                              </div>

                              <button 
                                onClick={startNewInterview}
                                disabled={loading || !formRole.trim()}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center disabled:opacity-50"
                              >
                                  {loading ? <RefreshCw className="animate-spin mr-2"/> : null}
                                  {loading ? '正在准备面试官...' : '开始模拟面试'}
                              </button>
                          </div>
                      </div>
                  </div>
              ) : (
                  // CHAT VIEW
                  <>
                      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
                          <div>
                              <h2 className="font-bold text-slate-900 text-lg flex items-center">
                                  {activeSession.role}
                                  {activeSession.isFinished && <span className="ml-3 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full border border-slate-200">已结束</span>}
                              </h2>
                              <p className="text-xs text-slate-500">
                                  {activeSession.isFinished ? '请查收评估报告' : '正在进行面试...'}
                              </p>
                          </div>
                          <div className="flex items-center gap-3">
                              {!activeSession.isFinished ? (
                                  <button 
                                    onClick={handleEndInterview}
                                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm border border-red-100 flex items-center transition-colors"
                                  >
                                      结束并生成报告
                                  </button>
                              ) : (
                                  <button 
                                    onClick={handleExportPDF}
                                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium text-sm border border-indigo-100 flex items-center transition-colors"
                                  >
                                      <FileText size={16} className="mr-2"/> 导出报告 (PDF)
                                  </button>
                              )}
                          </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                          {(activeSession.messages || []).map((msg) => (
                              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${msg.role === 'user' ? 'bg-slate-700 ml-3' : 'bg-indigo-900 mr-3'}`}>
                                          {msg.role === 'user' ? <User size={16} className="text-white" /> : <Briefcase size={16} className="text-white" />}
                                      </div>
                                      
                                      <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                          msg.role === 'user' 
                                          ? 'bg-slate-800 text-white rounded-tr-none' 
                                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                                      }`}>
                                          {msg.role === 'user' ? (
                                              <div className="whitespace-pre-wrap">{msg.text}</div>
                                          ) : (
                                              <MarkdownRenderer content={msg.text} />
                                          )}
                                      </div>
                                  </div>
                              </div>
                          ))}
                          
                          {loading && (
                              <div className="flex justify-start">
                                  <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl rounded-tl-none ml-12 shadow-sm flex items-center">
                                      <div className="flex space-x-1">
                                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                      </div>
                                      <span className="ml-2 text-xs text-slate-400">面试官思考中...</span>
                                  </div>
                              </div>
                          )}
                          <div ref={messagesEndRef} />
                      </div>

                      <div className="p-4 bg-white border-t border-slate-200">
                          {!activeSession.isFinished ? (
                              <div className="relative max-w-4xl mx-auto">
                                  <textarea 
                                      value={input}
                                      onChange={(e) => setInput(e.target.value)}
                                      onKeyDown={(e) => {
                                          if(e.key === 'Enter' && !e.shiftKey) {
                                              e.preventDefault();
                                              handleSend();
                                          }
                                      }}
                                      placeholder="输入回答 (支持直接粘贴代码)..."
                                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none shadow-inner min-h-[60px]"
                                  />
                                  <button 
                                      onClick={() => handleSend()}
                                      disabled={loading || !input.trim()}
                                      className="absolute right-2 bottom-2.5 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
                                  >
                                      <Send size={18} />
                                  </button>
                              </div>
                          ) : (
                              <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-200">
                                  <p className="text-slate-500 mb-3 font-medium">本次面试已结束</p>
                                  <div className="flex justify-center gap-3">
                                      <button 
                                          onClick={handleExportPDF}
                                          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md font-bold flex items-center transition-all"
                                      >
                                          <Download size={18} className="mr-2" /> 导出完整报告
                                      </button>
                                      <button 
                                          onClick={() => setActiveSessionId(null)}
                                          className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium flex items-center transition-all"
                                      >
                                          <RefreshCw size={18} className="mr-2" /> 开始新面试
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  </>
              )}
          </div>
      </div>
  );
};

export default InterviewSimulator;