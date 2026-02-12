import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, ExternalLink, Check } from 'lucide-react';
import type { NewsItem } from '../types';

interface NewsGridProps {
  news: NewsItem[];
  onGenerateArticle: (item: NewsItem) => Promise<void>;
  generatingItems: Set<string>;
  errorStates: { [key: string]: string };
  onRetry: (item: NewsItem) => Promise<void>;
}

export function NewsGrid({ news, onGenerateArticle, generatingItems, errorStates, onRetry }: NewsGridProps) {
  const [successStates, setSuccessStates] = useState<{ [key: string]: boolean }>({});

  React.useEffect(() => {
    // Clear success states when items stop generating
    const currentGenerating = Array.from(generatingItems);
    Object.keys(successStates).forEach(key => {
      if (!currentGenerating.includes(key)) {
        setTimeout(() => {
          setSuccessStates(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }, 2000);
      }
    });
  }, [generatingItems, successStates]);

  const handleKeyDown = (e: React.KeyboardEvent, item: NewsItem) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!generatingItems.has(item.link) && !errorStates[item.link]) {
        onGenerateArticle(item);
      } else if (errorStates[item.link]) {
        onRetry(item);
      }
    }
  };

  const handleGenerate = async (item: NewsItem) => {
    await onGenerateArticle(item);
    setSuccessStates(prev => ({ ...prev, [item.link]: true }));
  };

  const handleRetryClick = async (item: NewsItem) => {
    await onRetry(item);
    setSuccessStates(prev => ({ ...prev, [item.link]: true }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
      {news.map((item) => (
        <div
          key={item.link}
          className="bg-panel rounded-2xl shadow-2 hover:shadow-3 hover:-translate-y-0.5 transition-all duration-200 ease-out p-4 sm:p-6 border border-panel group touch-manipulation"
        >
          <div className="flex gap-3 sm:gap-4">
            <div className="flex-shrink-0">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-panel"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="space-y-3">
                <h3 className="font-bold text-ink text-sm sm:text-base line-clamp-2 leading-tight group-hover:text-brand transition-colors duration-200">{item.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span>{item.source}</span>
                  <span>•</span>
                  <span>{item.date}</span>
                </div>
                <p className="text-xs sm:text-sm text-muted line-clamp-2 sm:line-clamp-3 leading-relaxed">{item.snippet}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 mt-4 border-t border-panel">
            <div className="flex items-center gap-3">
              {errorStates[item.link] && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  <span>Failed</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-brand hover:text-brand-light text-xs sm:text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand/60 rounded px-2 py-1.5 flex-shrink-0 touch-manipulation"
              >
                <span>Source</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => errorStates[item.link] ? handleRetryClick(item) : handleGenerate(item)}
                onKeyDown={(e) => handleKeyDown(e, item)}
                disabled={generatingItems.has(item.link)}
                aria-busy={generatingItems.has(item.link)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-brand hover:bg-brand-light text-white rounded-xl hover:shadow-2 active:scale-95 transition-all duration-200 ease-out text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand/60 min-w-[100px] sm:min-w-[120px] justify-center flex-1 sm:flex-initial touch-manipulation min-h-[44px]"
              >
                {generatingItems.has(item.link) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : successStates[item.link] ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Generated</span>
                  </>
                ) : errorStates[item.link] ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Retry</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}