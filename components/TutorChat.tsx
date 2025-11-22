import React, { useState, useRef, useEffect } from 'react';
import { createChatSession } from '../services/geminiService';
import { ChatMessage, ChatSession } from '../types';
import { Send, Bot, User, Code2, Plus, MessageSquare, Trash2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { Content } from '@google/genai';

const TutorChat: React.FC = () => {
  // State for multiple sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Refs to hold SDK chat instances to maintain context without re-creating them constantly
  // Key: Session ID, Value: Chat Instance
  const chatInstances = useRef<Map<string, any>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tutor_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const safeSessions = Array.isArray(parsed) ? parsed : [];
        setSessions(safeSessions);
        if (safeSessions.length > 0) {
          setActiveSessionId(safeSessions[0].id);
        }
      } catch (e) {
        console.error("Failed to load tutor sessions", e);
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    // Save even if empty, though createNewSession usually prevents empty array
    localStorage.setItem('tutor_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, loading]);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: '新对话',
      messages: [
        { id: 'welcome', role: 'model', text: '你好！我是你的 AI 导师。需要帮助理解概念或调试代码吗？请在这里粘贴。', timestamp: Date.now() }
      ],
      lastUpdated: Date.now()
    };
    
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    
    // Initialize SDK chat
    chatInstances.current.set(newId, createChatSession());
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("确定要删除这个对话吗？")) return;

    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    chatInstances.current.delete(id);
    
    if (activeSessionId === id) {
      setActiveSessionId(newSessions.length > 0 ? newSessions[0].id : null);
    }
    
    if (newSessions.length === 0) {
        // Create a default one if all deleted
        setTimeout(createNewSession, 0); 
    }
  };

  const getChatInstance = (sessionId: string, messages: ChatMessage[]) => {
    if (!chatInstances.current.has(sessionId)) {
      // Re-hydrate chat context from message history
      const history: Content[] = messages
        .filter(m => m.id !== 'welcome') // skip welcome message in history
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));
      
      chatInstances.current.set(sessionId, createChatSession(history));
    }
    return chatInstances.current.get(sessionId);
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !activeSessionId) return;

    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    // Optimistic update
    const updatedSessions = sessions.map(s => {
      if (s.id === activeSessionId) {
        // Update title if it's the first user message
        const title = s.messages.length <= 1 ? input.slice(0, 20) : s.title;
        return {
          ...s,
          title,
          messages: [...s.messages, userMsg],
          lastUpdated: Date.now()
        };
      }
      return s;
    });
    
    setSessions(updatedSessions);
    setInput('');
    setLoading(true);

    try {
      const chat = getChatInstance(activeSessionId, currentSession.messages);
      const result = await chat.sendMessageStream({ message: userMsg.text });
      
      let fullResponse = "";
      const modelMsgId = (Date.now() + 1).toString();
      
      // Add placeholder for streaming
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
             const updatedMessages = s.messages.map(m => 
               m.id === modelMsgId ? { ...m, text: fullResponse } : m
             );
             return { ...s, messages: updatedMessages };
          }
          return s;
        }));
      }
      
    } catch (err) {
      console.error(err);
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, messages: [...s.messages, { id: Date.now().toString(), role: 'model', text: '抱歉，我遇到了一些错误，请重试。', isError: true, timestamp: Date.now() }] } 
          : s
      ));
    } finally {
      setLoading(false);
    }
  };

  // Get active session data
  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-lg overflow-hidden max-w-6xl mx-auto border border-slate-200">
      
      {/* Sidebar - Session List */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-4 border-b border-slate-800">
             <button 
                onClick={createNewSession}
                className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors font-medium text-sm"
             >
                <Plus size={16} className="mr-2" /> 新对话
             </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {sessions.map(session => (
                <div 
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-all ${
                        activeSessionId === session.id 
                            ? 'bg-slate-800 text-white shadow-sm' 
                            : 'hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                >
                    <div className="flex items-center overflow-hidden">
                        <MessageSquare size={16} className="mr-3 flex-shrink-0 opacity-70" />
                        <span className="text-sm truncate">{session.title}</span>
                    </div>
                    <button 
                        onClick={(e) => deleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded transition-all"
                        title="删除对话"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {/* Chat Header */}
        <div className="bg-white p-4 border-b border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg mr-3">
                    <Code2 size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">技术导师</h3>
                    <p className="text-xs text-slate-500">Debug • 代码审查 • 概念讲解</p>
                </div>
            </div>
            <div className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                Model: Gemini 2.5 Flash
            </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeSession ? (
                (activeSession.messages || []).map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${msg.role === 'user' ? 'bg-slate-700 ml-3' : 'bg-indigo-600 mr-3'}`}>
                        {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                    </div>
                    
                    <div className={`p-4 rounded-2xl shadow-sm text-sm ${
                        msg.role === 'user' 
                        ? 'bg-slate-800 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}>
                        {msg.role === 'user' ? (
                             <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                        ) : (
                             <MarkdownRenderer content={msg.text} />
                        )}
                    </div>
                    </div>
                </div>
                ))
            ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                    选择或创建一个会话开始
                </div>
            )}
            
            {/* Thinking Indicator */}
            {loading && (
                <div className="flex justify-start">
                    <div className="flex items-center bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm ml-11">
                        <span className="text-xs font-medium text-slate-500 mr-2">思考中</span>
                        <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
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
                placeholder="输入问题..."
                className="w-full pl-4 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none max-h-32 shadow-inner text-slate-800 placeholder:text-slate-400"
                rows={1}
            />
            <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="absolute right-2 top-2.5 p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-md"
            >
                <Send size={18} />
            </button>
            </div>
            <div className="text-center mt-2">
                <p className="text-[10px] text-slate-400">AI 可能会产生错误。请核实重要代码。</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TutorChat;