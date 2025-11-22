import React from 'react';
import { Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  
  // Helper to handle copying code to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Simple parser to separate code blocks from text
  // This splits by ``` to find code blocks
  const parts = content.split(/```/);

  return (
    <div className="markdown-content space-y-4 text-slate-700 leading-relaxed">
      {parts.map((part, index) => {
        // Even indices are text, odd indices are code (usually)
        if (index % 2 === 0) {
          // Render Text with basic formatting
          return (
            <div key={index} className="prose prose-slate max-w-none">
              {part.split('\n').map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-2" />; // spacer
                
                // Headers
                if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-slate-800 mt-6 mb-2">{line.replace('### ', '')}</h3>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-slate-900 mt-8 mb-3 border-b border-slate-200 pb-2">{line.replace('## ', '')}</h2>;
                if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-slate-900 mt-8 mb-4">{line.replace('# ', '')}</h1>;
                
                // List items
                if (line.trim().startsWith('- ')) return (
                  <div key={i} className="flex items-start my-1">
                     <span className="text-indigo-500 mr-2 mt-1.5">•</span>
                     <span className="flex-1">{line.trim().substring(2)}</span>
                  </div>
                );
                
                // Numbered list (simple detection)
                if (/^\d+\./.test(line.trim())) {
                     const num = line.trim().split('.')[0];
                     const text = line.trim().substring(num.length + 1);
                     return (
                        <div key={i} className="flex items-start my-1">
                            <span className="text-slate-500 font-mono mr-2 mt-0.5 text-sm">{num}.</span>
                            <span className="flex-1">{text}</span>
                        </div>
                     );
                }

                // Bold text (simple regex)
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                  <p key={i} className="my-2">
                    {parts.map((p, j) => {
                      if (p.startsWith('**') && p.endsWith('**')) {
                        return <strong key={j} className="font-bold text-slate-900">{p.slice(2, -2)}</strong>;
                      }
                      return p;
                    })}
                  </p>
                );
              })}
            </div>
          );
        } else {
          // Render Code Block
          // First line usually contains language
          const lines = part.split('\n');
          const language = lines[0].trim();
          const code = lines.slice(1).join('\n');

          if (!code.trim()) return null;

          return (
            <div key={index} className="relative my-6 rounded-lg overflow-hidden border border-slate-700 shadow-lg group">
              <div className="flex justify-between items-center bg-slate-800 px-4 py-2 text-slate-400 text-xs font-mono border-b border-slate-700">
                <span>{language || 'CODE'}</span>
                <button 
                  onClick={() => copyToClipboard(code)}
                  className="hover:text-white transition-colors flex items-center gap-1"
                  title="Copy code"
                >
                  <Copy size={14} /> Copy
                </button>
              </div>
              <pre className="bg-[#1e1e1e] text-slate-300 p-4 overflow-x-auto text-sm font-mono leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
      })}
    </div>
  );
};

export default MarkdownRenderer;