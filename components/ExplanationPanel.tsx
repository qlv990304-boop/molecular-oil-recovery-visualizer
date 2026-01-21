import React from 'react';
import ReactMarkdown from 'react-markdown';

interface ExplanationPanelProps {
  content: string | null;
  isLoading: boolean;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ content, isLoading }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center">
          <span className="mr-2">📚</span> 原理解析 (Explanation)
        </h2>
      </div>
      <div className="p-6 flex-grow overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            <div className="space-y-2 pt-4">
              <div className="h-3 bg-slate-100 rounded w-full"></div>
              <div className="h-3 bg-slate-100 rounded w-full"></div>
              <div className="h-3 bg-slate-100 rounded w-2/3"></div>
            </div>
          </div>
        ) : content ? (
          <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
            <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Content will appear here after generation.</p>
          </div>
        )}
      </div>
    </div>
  );
};