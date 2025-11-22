import React, { useEffect, useState } from 'react';
import { fetchIndustryNews } from '../services/geminiService';
import { NewsItem } from '../types';
import { ExternalLink, Loader2, RefreshCw, Newspaper } from 'lucide-react';

const NewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNews = async (forceRefresh = false) => {
    setLoading(true);
    
    if (!forceRefresh) {
        const cached = localStorage.getItem('news_cache');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed && parsed.length > 0) {
                    setNews(parsed);
                    setLoading(false);
                    return;
                }
            } catch (e) {
                localStorage.removeItem('news_cache');
            }
        }
    }

    const items = await fetchIndustryNews();
    setNews(items);
    localStorage.setItem('news_cache', JSON.stringify(items));
    setLoading(false);
  };

  useEffect(() => {
    loadNews(false);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center">
             <Newspaper className="mr-3 text-indigo-600" size={32}/>
             行业前沿
          </h2>
          <p className="text-slate-500 mt-1 ml-11">AI Agent 与 LLM 工程领域的每日简报</p>
        </div>
        <button 
          onClick={() => loadNews(true)}
          className="p-2 bg-white border border-slate-200 rounded-full hover:bg-indigo-50 transition-colors shadow-sm group"
          title="刷新新闻"
        >
          <RefreshCw size={20} className={`text-slate-600 group-hover:text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-sm border border-slate-100">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
            <p className="text-slate-500 font-medium">正在全网扫描最新 AI 趋势...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {news.map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-tight">
                    {item.title}
                </h3>
                {item.url && (
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-indigo-600 ml-4 flex-shrink-0 p-1 rounded-full hover:bg-indigo-50"
                  >
                    <ExternalLink size={20} />
                  </a>
                )}
              </div>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base border-l-4 border-slate-100 pl-4 py-1 mb-4 group-hover:border-indigo-100">
                  {item.summary}
              </p>
              {item.source && (
                <div className="flex items-center text-xs text-slate-400 font-medium">
                  <span className="uppercase tracking-wider">来源: {item.source}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
