import React from 'react';
import { FileText, Copy, X, Check, Maximize2, Clock, ExternalLink, Trash2, Grid3X3, List } from 'lucide-react';
import type { GeneratedArticle, CopyState } from '../types';
import ReactMarkdown from 'react-markdown';

const getPreview = (text: string, max = 260): string => {
  if (!text || text.trim() === '') return '';
  
  // Remove markdown code block markers if they exist
  const markdownPattern = /^```markdown\n([\s\S]*?)```$/;
  const match = text.match(markdownPattern);
  const cleanText = match ? match[1].trim() : text;
  
  // Strip markdown formatting with light regex
  const stripped = cleanText
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/\n\s*\n/g, ' ') // Collapse multiple newlines
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
  
  if (stripped.length <= max) return stripped;
  return stripped.substring(0, max).trim() + '...';
};

const getTimeSince = (timestamp: string | number): string => {
  const now = new Date();
  const generated = new Date(typeof timestamp === 'number' ? timestamp : timestamp);
  const diffMs = now.getTime() - generated.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const getSourceName = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '').split('.')[0];
  } catch {
    return 'Source';
  }
};

const estimateReadingTime = (text: string): number => {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

function SkeletonCard({ darkMode, viewMode }: { darkMode: boolean; viewMode: 'gallery' | 'list' }) {
  return (
    <div className={`bg-panel rounded-xl shadow-sm ring-1 ring-black/5 overflow-hidden relative ${
      viewMode === 'gallery' ? 'p-3' : 'p-2'
    }`}>
      <div className="absolute inset-0 animate-shimmer"></div>
      {viewMode === 'gallery' ? (
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      )}
    </div>
  );
}

function ArticleCard({ 
  article, 
  onSelect, 
  onCopy, 
  onDelete, 
  copyStates, 
  isNew,
  viewMode
}: {
  article: GeneratedArticle;
  onSelect: (article: GeneratedArticle) => void;
  onCopy: (content: string) => void;
  onDelete: (e: React.MouseEvent, articleId: string) => void;
  copyStates: CopyState;
  isNew: boolean;
  viewMode: 'gallery' | 'list';
}) {
  const sourceName = article.sourceUrl ? getSourceName(article.sourceUrl) : null;
  const timeSince = getTimeSince(article.completedAt || article.generatedAt);
  const readingTime = estimateReadingTime(article.content);
  const preview = getPreview(article.content);
  
  const getStatusBadge = () => {
    if (isNew) return { text: 'New', color: 'bg-green-500', pulse: true };
    if (article.status === 'error') return { text: 'Error', color: 'bg-red-500', pulse: false };
    return { text: 'Ready', color: 'bg-brand', pulse: false };
  };
  
  const statusBadge = getStatusBadge();
  
  if (viewMode === 'list') {
    return (
      <div
        className="group bg-panel rounded-lg shadow-sm hover:shadow-md transition-all duration-150 ease-out cursor-pointer relative p-3 ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-brand/60 flex items-center justify-between gap-3"
        onClick={() => onSelect(article)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(article);
          }
        }}
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm line-clamp-1 text-ink leading-tight">{article.title}</h3>
          <div className="flex items-center gap-2 text-xs text-muted mt-1">
            {sourceName && (
              <>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-medium">{sourceName}</span>
                <span>•</span>
              </>
            )}
            <span>{readingTime} min read</span>
            <span>•</span>
            <span>{timeSince}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs font-medium text-white rounded-full ${statusBadge.color} ${
            statusBadge.pulse ? 'animate-pulse' : ''
          }`}>
            {statusBadge.text}
          </span>
          <button
            onClick={(e) => onDelete(e, article.id)}
            className="text-xs px-2 py-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Delete"
          >
            <Trash2 className="w-3 h-3 text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150" />
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div
      className="group bg-panel rounded-lg shadow-sm hover:shadow-md transition-all duration-150 ease-out cursor-pointer relative p-3 ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-brand/60"
      onClick={() => onSelect(article)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(article);
        }
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-xs line-clamp-2 flex-1 break-words text-ink leading-tight">{article.title}</h3>
        <div className="flex items-center gap-1">
          <span className={`px-2 py-0.5 text-xs font-medium text-white rounded-full ${statusBadge.color} ${
            statusBadge.pulse ? 'animate-pulse' : ''
          }`}>
            {statusBadge.text}
          </span>
        </div>
      </div>
      
      <div className="mt-2 flex items-center gap-1 text-xs text-muted">
        {sourceName && (
          <>
            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">{sourceName}</span>
            <span>•</span>
          </>
        )}
        <span>{readingTime} min read</span>
        <span>•</span>
        <span>{timeSince}</span>
      </div>
      
      <div className="mt-2">
        <p className="text-xs text-ink leading-relaxed line-clamp-2">
          {preview || "No content yet. View to regenerate."}
        </p>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(article.content);
            }}
            disabled={!article.content || article.status !== 'ready'}
            className="flex items-center gap-1 px-1.5 py-1 text-xs text-muted hover:text-ink rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand/60 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            title="Copy"
          >
            {copyStates[article.content] ? (
              <>
                <Check className="w-3 h-3 text-green-600" />
                <span className="hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(article);
            }}
            disabled={article.status !== 'ready'}
            className="text-xs px-1.5 py-1 text-brand hover:bg-brand/10 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand/60 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            View
          </button>
          <button
            onClick={(e) => onDelete(e, article.id)}
            className="text-xs px-1.5 py-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Delete"
          >
            <Trash2 className="w-3 h-3 text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorCard({ 
  article, 
  onRetry, 
  onDelete,
  viewMode
}: {
  article: GeneratedArticle;
  onRetry: () => void;
  onDelete: (e: React.MouseEvent, articleId: string) => void;
  viewMode: 'gallery' | 'list';
}) {
  if (viewMode === 'list') {
    return (
      <div className="bg-panel rounded-lg shadow-sm p-3 ring-1 ring-red-200 dark:ring-red-800 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm line-clamp-1 text-ink leading-tight">{article.title}</h3>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            {article.errorMessage || 'Generation failed'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRetry}
            className="text-xs px-3 py-1.5 bg-brand text-white hover:bg-brand/90 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand/60"
          >
            Retry
          </button>
          <button
            onClick={(e) => onDelete(e, article.id)}
            className="text-xs px-2 py-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Delete"
          >
            <Trash2 className="w-3 h-3 text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150" />
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-panel rounded-lg shadow-sm p-3 ring-1 ring-red-200 dark:ring-red-800">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="font-bold text-xs line-clamp-2 flex-1 break-words text-ink leading-tight">{article.title}</h3>
        <span className="px-2 py-0.5 text-xs font-medium text-white rounded-full bg-red-500">
          Error
        </span>
      </div>
      
      <p className="text-xs text-red-600 dark:text-red-400 mb-2">
        {article.errorMessage || 'Generation failed'}
      </p>
      
      <div className="flex items-center justify-between">
        <button
          onClick={onRetry}
          className="text-xs px-2 py-1 bg-brand text-white hover:bg-brand/90 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand/60"
        >
          Retry
        </button>
        <button
          onClick={(e) => onDelete(e, article.id)}
          className="text-xs px-1.5 py-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
          title="Delete"
        >
          <Trash2 className="w-3 h-3 text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150" />
        </button>
      </div>
    </div>
  );
}

interface ArticleSidebarProps {
  articles: GeneratedArticle[];
  onClose: () => void;
  onArticleSelect: (article: GeneratedArticle) => void;
  onDeleteArticle: (articleId: string) => void;
  onClearAll: () => void;
  darkMode: boolean;
}

export function ArticleSidebar({ articles, onClose, onArticleSelect, onDeleteArticle, onClearAll, darkMode }: ArticleSidebarProps) {
  const [copyStates, setCopyStates] = React.useState<CopyState>({});
  const [newBadges, setNewBadges] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<'gallery' | 'list'>('gallery');

  React.useEffect(() => {
    const readyArticles = articles.filter(a => a.status === 'ready' && a.completedAt && Date.now() - a.completedAt < 4000);
    const newIds = new Set(readyArticles.map(a => a.id));
    setNewBadges(newIds);
    
    const timer = setTimeout(() => setNewBadges(new Set()), 4000);
    return () => clearTimeout(timer);
  }, [articles]);

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyStates(prev => ({ ...prev, [content]: true }));
      setTimeout(() => {
        setCopyStates(prev => ({ ...prev, [content]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const generatingCount = articles.filter(a => a.status === 'generating').length;
  const readyArticles = articles.filter(a => a.status === 'ready' || !a.status); // Default old articles to ready
  const errorArticles = articles.filter(a => a.status === 'error');
  const totalCount = readyArticles.length + generatingCount + errorArticles.length;

  const handleDelete = (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this article? This removes it from your device.')) {
      onDeleteArticle(articleId);
    }
  };

  const handleRetry = (article: GeneratedArticle) => {
    // This would need to be passed down from parent component
    // For now, just show a message
    console.log('Retry functionality would be implemented here for:', article.title);
  };

  if (readyArticles.length === 0 && generatingCount === 0 && errorArticles.length === 0) {
    return (
      <div className="relative w-full bg-panel rounded-2xl shadow-1 ring-1 ring-black/5">
        <div className="sticky top-0 bg-panel/80 backdrop-blur-sm p-4 border-b border-black/5 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-ink">
            <FileText className="w-5 h-5" />
            Today's Articles
          </h2>
        </div>
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted" />
          <h3 className="text-lg font-medium mb-3 text-ink">No articles yet</h3>
          <p className="text-base text-muted">
            Pick a headline above and click Generate
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-panel rounded-2xl shadow-1 ring-1 ring-black/5">
      <div className="sticky top-0 bg-panel/80 backdrop-blur-sm p-4 border-b border-black/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-ink">
            <FileText className="w-5 h-5" />
            Generated Articles
          </h2>
          <span className="px-2 py-1 bg-brand/10 text-brand rounded-full text-sm font-medium">
            {totalCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('gallery')}
              className={`p-1.5 rounded transition-colors duration-150 ${
                viewMode === 'gallery'
                  ? 'bg-white dark:bg-gray-600 text-brand shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
              title="Gallery view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors duration-150 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-brand shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        {readyArticles.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Clear All
          </button>
        )}
        </div>
      </div>
      
      <div className={`p-4 max-h-[calc(100vh-200px)] overflow-y-auto ${
        viewMode === 'gallery' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-2'
      }`}>
        {articles.map((article) => {
          if (article.status === 'generating') {
            return <SkeletonCard key={article.id} darkMode={darkMode} viewMode={viewMode} />;
          }
          
          if (article.status === 'error') {
            return (
              <ErrorCard
                key={article.id}
                article={article}
                onRetry={() => handleRetry(article)}
                onDelete={handleDelete}
                viewMode={viewMode}
              />
            );
          }
          
          // Default to 'ready' for articles without status (old articles)
          return (
            <ArticleCard
              key={article.id}
              article={article}
              onSelect={onArticleSelect}
              onCopy={copyToClipboard}
              onDelete={handleDelete}
              copyStates={copyStates}
              isNew={newBadges.has(article.id)}
              viewMode={viewMode}
            />
          );
        })}
      </div>
    </div>
  );
}