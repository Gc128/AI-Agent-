import React, { useState, useEffect } from 'react';
import { fetchJobPostings } from '../services/geminiService';
import { JobPosting } from '../types';
import { Search, MapPin, Building2, Briefcase, Loader2, ExternalLink, ChevronRight, Share2, DollarSign } from 'lucide-react';

const JobMarket: React.FC = () => {
  const [query, setQuery] = useState("Agent开发实习生");
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSelectedJob(null);
    
    // Try to load from cache if query matches (simple cache)
    const cacheKey = `job_cache_${query}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            setJobs(parsed);
            if (parsed.length > 0) setSelectedJob(parsed[0]);
            setLoading(false);
            // Background refresh
            fetchJobPostings(query).then(newJobs => {
                if (JSON.stringify(newJobs) !== cached) {
                   setJobs(newJobs);
                   localStorage.setItem(cacheKey, JSON.stringify(newJobs));
                }
            });
            return;
        } catch(e) {
            localStorage.removeItem(cacheKey);
        }
    }

    const results = await fetchJobPostings(query);
    setJobs(results);
    if (results.length > 0) setSelectedJob(results[0]);
    localStorage.setItem(cacheKey, JSON.stringify(results));
    setLoading(false);
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto p-4 lg:p-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-900 flex items-center">
                <Briefcase className="mr-3 text-indigo-600" size={32}/>
                岗位需求广场
            </h2>
            <p className="text-slate-500 mt-1 ml-11">实时同步全网招聘信息，助你精准匹配</p>
        </div>
        
        <div className="relative w-full md:w-96">
            <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索职位，如：AI算法工程师"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
            <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <button 
                onClick={handleSearch}
                disabled={loading}
                className="absolute right-2 top-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
                {loading ? <Loader2 className="animate-spin" size={16} /> : '搜索'}
            </button>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex gap-6 h-[calc(100vh-12rem)]">
        
        {/* Left: Job List */}
        <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-100 font-medium text-slate-600 text-sm flex justify-between">
                <span>搜索结果 ({jobs.length})</span>
                <span className="text-slate-400 text-xs">数据来源: Google Search</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {loading && jobs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                        <p>正在全网搜寻...</p>
                    </div>
                ) : jobs.length === 0 ? (
                     <div className="p-8 text-center text-slate-400">
                        <p>暂无相关职位，请尝试其他关键词</p>
                    </div>
                ) : (
                    jobs.map(job => (
                        <div 
                            key={job.id}
                            onClick={() => setSelectedJob(job)}
                            className={`p-4 rounded-xl cursor-pointer transition-all border ${
                                selectedJob?.id === job.id 
                                    ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' 
                                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-slate-900 line-clamp-1">{job.title}</h3>
                                <span className="text-indigo-600 font-bold text-sm whitespace-nowrap">{job.salary}</span>
                            </div>
                            <div className="text-sm text-slate-600 mb-2 flex items-center">
                                <span className="truncate max-w-[120px]">{job.company}</span>
                                <span className="mx-2 text-slate-300">|</span>
                                <span className="text-slate-500 flex items-center"><MapPin size={12} className="mr-0.5"/> {job.location}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {job.tags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-md">{tag}</span>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Right: Job Details (JD) */}
        <div className="hidden md:flex md:w-2/3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-col">
             {selectedJob ? (
                 <>
                    {/* JD Header */}
                    <div className="p-8 border-b border-slate-100 relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-baseline gap-4 mb-2">
                                    <h1 className="text-2xl font-bold text-slate-900">{selectedJob.title}</h1>
                                    <span className="text-xl font-bold text-indigo-600">{selectedJob.salary}</span>
                                </div>
                                <div className="flex items-center gap-4 text-slate-600 text-sm mb-4">
                                    <span className="flex items-center"><MapPin size={16} className="mr-1"/> {selectedJob.location}</span>
                                    <span className="flex items-center"><Building2 size={16} className="mr-1"/> {selectedJob.company}</span>
                                    <span className="flex items-center text-slate-400">发布于 {selectedJob.publishDate}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedJob.tags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-lg">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <a 
                                    href={selectedJob.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 flex items-center transition-all"
                                >
                                    立即投递 <ExternalLink size={16} className="ml-2"/>
                                </a>
                                <div className="text-xs text-center text-slate-400 mt-1">
                                    来源: {selectedJob.source}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* JD Body */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="space-y-8">
                            <section>
                                <h3 className="font-bold text-slate-900 mb-3 flex items-center text-lg">
                                    <span className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></span>
                                    工作职责
                                </h3>
                                <ul className="space-y-2 text-slate-600 leading-relaxed">
                                    {selectedJob.description.responsibilities.map((item, i) => (
                                        <li key={i} className="flex items-start">
                                            <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section>
                                <h3 className="font-bold text-slate-900 mb-3 flex items-center text-lg">
                                    <span className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></span>
                                    任职要求
                                </h3>
                                <ul className="space-y-2 text-slate-600 leading-relaxed">
                                    {selectedJob.description.requirements.map((item, i) => (
                                        <li key={i} className="flex items-start">
                                            <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {selectedJob.description.bonus && selectedJob.description.bonus.length > 0 && (
                                <section>
                                    <h3 className="font-bold text-slate-900 mb-3 flex items-center text-lg">
                                        <span className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></span>
                                        加分项
                                    </h3>
                                    <ul className="space-y-2 text-slate-600 leading-relaxed">
                                        {selectedJob.description.bonus.map((item, i) => (
                                            <li key={i} className="flex items-start">
                                                <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0"></span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                            
                             {selectedJob.description.welfare && selectedJob.description.welfare.length > 0 && (
                                <section>
                                    <h3 className="font-bold text-slate-900 mb-3 flex items-center text-lg">
                                        <span className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></span>
                                        员工福利
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedJob.description.welfare.map((item, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-sm">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                 </>
             ) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400">
                     <Briefcase size={64} className="mb-4 opacity-20" />
                     <p>请选择左侧职位查看详情</p>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default JobMarket;