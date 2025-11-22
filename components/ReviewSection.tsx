import React, { useState, useRef } from 'react';
import { ReviewItem, ReviewCategoryType } from '../types';
import { Plus, ChevronRight, FileText, ArrowLeft, Save, Code, Book, Briefcase, Bold, Italic, List, Heading1, Heading2, HelpCircle, X, Download, Trash2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { marked } from 'marked';

interface ReviewSectionProps {
  items: ReviewItem[];
  onAddItem: (item: ReviewItem) => void;
  onUpdateItem: (item: ReviewItem) => void;
  onDeleteItem: (id: string) => void;
}

const categories: { id: ReviewCategoryType; label: string; icon: any; color: string }[] = [
    { id: 'LEETCODE', label: 'LeetCode 热题', icon: Code, color: 'text-orange-500 bg-orange-100' },
    { id: 'INTERVIEW', label: '面试八股', icon: Book, color: 'text-blue-500 bg-blue-100' },
    { id: 'PROJECT', label: '项目开发描述', icon: Briefcase, color: 'text-purple-500 bg-purple-100' },
];

const ReviewSection: React.FC<ReviewSectionProps> = ({ items, onAddItem, onUpdateItem, onDeleteItem }) => {
  const [selectedCategory, setSelectedCategory] = useState<ReviewCategoryType | null>(null);
  const [editingItem, setEditingItem] = useState<ReviewItem | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // Form state for new/edit
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCategoryClick = (cat: ReviewCategoryType) => {
      setSelectedCategory(cat);
      setEditingItem(null);
  };

  const handleCreateNew = () => {
      setFormTitle('');
      setFormContent('');
      setEditingItem({
          id: 'new',
          category: selectedCategory!,
          title: '',
          content: '',
          lastModified: Date.now()
      });
  };

  const handleEdit = (item: ReviewItem) => {
      setFormTitle(item.title);
      setFormContent(item.content);
      setEditingItem(item);
  };

  const handleSave = () => {
      if (!formTitle.trim()) return alert("标题不能为空");
      
      const newItem: ReviewItem = {
          id: editingItem?.id === 'new' ? Date.now().toString() : editingItem!.id,
          category: selectedCategory!,
          title: formTitle,
          content: formContent,
          lastModified: Date.now()
      };
      
      if (editingItem?.id === 'new') {
          onAddItem(newItem);
      } else {
          onUpdateItem(newItem);
      }
      setEditingItem(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm('确定要删除这条笔记吗？此操作无法撤销。')) {
          onDeleteItem(id);
      }
  };

  const handleExportItem = (e: React.MouseEvent, item: ReviewItem) => {
    e.stopPropagation();
    if (!item.content) return;

    // Convert markdown to HTML
    const contentHtml = marked.parse(item.content);
    
    const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${item.title}</title></head><body>
        <h1>${item.title}</h1>
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
    link.download = `${item.title}_复习笔记.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  // Helper to insert markdown syntax at cursor position
  const insertFormatting = (prefix: string, suffix: string = '') => {
      if (!textareaRef.current) return;
      
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const text = textareaRef.current.value;
      
      const before = text.substring(0, start);
      const selection = text.substring(start, end);
      const after = text.substring(end);
      
      const newText = before + prefix + selection + suffix + after;
      setFormContent(newText);
      
      // Set cursor back
      setTimeout(() => {
          if (textareaRef.current) {
              const newCursorPos = start + prefix.length + selection.length + suffix.length;
              textareaRef.current.focus();
              textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
      }, 0);
  };

  const categoryItems = items.filter(i => i.category === selectedCategory);

  if (!selectedCategory) {
      return (
        <div className="max-w-5xl mx-auto p-6">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">复习栏</h2>
            <p className="text-slate-500 mb-8">整理您的知识库，温故而知新</p>
            
            <div className="grid md:grid-cols-3 gap-6">
                {categories.map(cat => {
                    const Icon = cat.icon;
                    const count = items.filter(i => i.category === cat.id).length;
                    return (
                        <div 
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.id)}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${cat.color}`}>
                                <Icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-1">{cat.label}</h3>
                            <p className="text-slate-400 text-sm">{count} 个条目</p>
                            <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="text-slate-300" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      );
  }

  if (editingItem) {
      return (
          <div className="max-w-4xl mx-auto p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                  <button 
                    onClick={() => setEditingItem(null)} 
                    className="flex items-center text-slate-500 hover:text-slate-800"
                  >
                      <ArrowLeft size={18} className="mr-2"/> 取消
                  </button>
                  <div className="flex items-center">
                    <button 
                        onClick={() => setShowHelp(!showHelp)}
                        className="flex items-center text-indigo-600 hover:text-indigo-800 mr-4 text-sm"
                    >
                        <HelpCircle size={16} className="mr-1" /> 写作说明
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
                    >
                        <Save size={18} className="mr-2"/> 保存
                    </button>
                  </div>
              </div>

              {showHelp && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 flex justify-between items-start animate-in slide-in-from-top-2">
                      <div>
                          <h4 className="font-bold text-indigo-900 mb-2 flex items-center"><FileText size={16} className="mr-2"/>Markdown 写作指南</h4>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-indigo-800">
                              <div><code className="bg-indigo-100 px-1 rounded"># 标题1</code> → 一级标题</div>
                              <div><code className="bg-indigo-100 px-1 rounded">**文字**</code> → <strong>加粗</strong></div>
                              <div><code className="bg-indigo-100 px-1 rounded">## 标题2</code> → 二级标题</div>
                              <div><code className="bg-indigo-100 px-1 rounded">- 文字</code> → 列表项</div>
                              <div><code className="bg-indigo-100 px-1 rounded">`代码`</code> → 行内代码</div>
                              <div><code className="bg-indigo-100 px-1 rounded">```代码块```</code> → 代码块</div>
                          </div>
                      </div>
                      <button onClick={() => setShowHelp(false)} className="text-indigo-400 hover:text-indigo-600">
                          <X size={18} />
                      </button>
                  </div>
              )}
              
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <input 
                        type="text" 
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="输入标题..."
                        className="text-2xl font-bold text-slate-900 w-full focus:outline-none placeholder-slate-300"
                    />
                  </div>
                  
                  {/* Editor Toolbar */}
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                      <button onClick={() => insertFormatting('**', '**')} className="p-2 rounded hover:bg-slate-200 text-slate-600" title="加粗">
                          <Bold size={18} />
                      </button>
                      <button onClick={() => insertFormatting('*', '*')} className="p-2 rounded hover:bg-slate-200 text-slate-600" title="斜体">
                          <Italic size={18} />
                      </button>
                      <div className="w-px h-6 bg-slate-300 mx-1"></div>
                      <button onClick={() => insertFormatting('# ')} className="p-2 rounded hover:bg-slate-200 text-slate-600" title="大标题">
                          <Heading1 size={18} />
                      </button>
                      <button onClick={() => insertFormatting('## ')} className="p-2 rounded hover:bg-slate-200 text-slate-600" title="小标题">
                          <Heading2 size={18} />
                      </button>
                      <div className="w-px h-6 bg-slate-300 mx-1"></div>
                      <button onClick={() => insertFormatting('- ')} className="p-2 rounded hover:bg-slate-200 text-slate-600" title="列表">
                          <List size={18} />
                      </button>
                      <button onClick={() => insertFormatting('```\n', '\n```')} className="p-2 rounded hover:bg-slate-200 text-slate-600" title="代码块">
                          <Code size={18} />
                      </button>
                  </div>

                  <div className="flex-1 relative">
                    <textarea 
                        ref={textareaRef}
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        placeholder="在此处输入内容... 点击上方工具栏可快速格式化"
                        className="w-full h-full resize-none focus:outline-none text-slate-700 leading-relaxed font-mono text-sm p-6"
                    />
                  </div>
              </div>
          </div>
      );
  }

  const currentCatInfo = categories.find(c => c.id === selectedCategory);

  return (
      <div className="max-w-5xl mx-auto p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => setSelectedCategory(null)} 
                className="flex items-center text-slate-500 hover:text-slate-800 text-sm"
              >
                  <ArrowLeft size={16} className="mr-1"/> 返回目录
              </button>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                  {currentCatInfo?.label}
              </h2>
              <button 
                onClick={handleCreateNew}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                  <Plus size={16} className="mr-2"/> 添加内容
              </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {categoryItems.length === 0 ? (
                <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <FileText size={48} className="mx-auto mb-4 opacity-50"/>
                    <p>该目录下暂无内容，开始添加吧！</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {categoryItems.map(item => (
                        <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm group">
                            <div 
                                onClick={() => handleEdit(item)}
                                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors flex justify-between items-center border-b border-slate-100"
                            >
                                <h3 className="font-bold text-lg text-slate-800">{item.title}</h3>
                                <div className="flex items-center">
                                     <button 
                                        onClick={(e) => handleExportItem(e, item)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md mr-2 opacity-0 group-hover:opacity-100 transition-all"
                                        title="导出为 Word"
                                     >
                                         <Download size={16} />
                                     </button>
                                     <button 
                                        onClick={(e) => handleDelete(e, item.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                        title="删除"
                                     >
                                         <Trash2 size={16} />
                                     </button>
                                    <span className="text-xs text-slate-400 ml-3">
                                        {new Date(item.lastModified).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            {/* Scrollable content area */}
                            <div className="p-4 bg-slate-50/50 max-h-60 overflow-y-auto custom-scrollbar">
                                <MarkdownRenderer content={item.content || "无内容"} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
      </div>
  );
};

export default ReviewSection;