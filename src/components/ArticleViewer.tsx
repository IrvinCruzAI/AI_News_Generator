import React from 'react';
import { X, Copy, Check, Edit3, Save, FileDown, Sparkles, Clock, ExternalLink, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { GeneratedArticle } from '../types';
import ReactMarkdown from 'react-markdown';

interface ArticleViewerProps {
  article: GeneratedArticle;
  onClose: () => void;
  onDeleteArticle?: (articleId: string) => void;
}

const getSourceName = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '').split('.')[0];
  } catch {
    return 'Source';
  }
};

const cleanMarkdownContent = (content: string) => {
  const markdownPattern = /^```markdown\n([\s\S]*?)```$/;
  const match = content.match(markdownPattern);
  return match ? match[1].trim() : content;
};

const estimateReadingTime = (text: string): number => {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

const getWordCount = (text: string): number => {
  return text.split(/\s+/).filter(word => word.length > 0).length;
};

const getTimeSince = (timestamp: string): string => {
  const now = new Date();
  const generated = new Date(timestamp);
  const diffMs = now.getTime() - generated.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const generateSummary = (content: string): string[] => {
  // Simple client-side summary generation
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const keyPoints = sentences
    .slice(0, 5)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1));
  
  return keyPoints.length > 0 ? keyPoints : ['Key insights from this article'];
};

const createSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export function ArticleViewer({ article, onClose, onDeleteArticle }: ArticleViewerProps) {
  const [copied, setCopied] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState('');
  const [showSummary, setShowSummary] = React.useState(false);
  const [summaryExpanded, setSummaryExpanded] = React.useState(false);
  const [toast, setToast] = React.useState('');
  const modalRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const cleanContent = cleanMarkdownContent(article.content);
  const wordCount = getWordCount(cleanContent);
  const readingTime = estimateReadingTime(cleanContent);
  const timeSince = getTimeSince(article.generatedAt);
  const sourceName = getSourceName(article.sourceUrl || '');

  React.useEffect(() => {
    setEditContent(cleanContent);
  }, [cleanContent]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && !isEditing) {
        e.preventDefault();
        copyToClipboard();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        toggleEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing]);

  React.useEffect(() => {
    // Focus trap
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0] as HTMLElement;
    const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    firstElement?.focus();
    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, [isEditing]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2000);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(cleanContent);
      setCopied(true);
      showToast('Copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Copy failed');
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      // Cancel edit
      setEditContent(cleanContent);
    }
    setIsEditing(!isEditing);
    
    if (!isEditing) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const saveEdit = () => {
    try {
      const articles = JSON.parse(localStorage.getItem('generated_articles') || '[]');
      const updatedArticles = articles.map((a: GeneratedArticle) => 
        a.id === article.id ? { ...a, content: editContent } : a
      );
      localStorage.setItem('generated_articles', JSON.stringify(updatedArticles));
      
      // Update the current article object
      Object.assign(article, { content: editContent });
      
      setIsEditing(false);
      showToast('Saved!');
    } catch (err) {
      console.error('Failed to save:', err);
      showToast('Save failed');
    }
  };

  const handleSummarize = () => {
    if (!showSummary) {
      setShowSummary(true);
      setSummaryExpanded(true);
    } else {
      setSummaryExpanded(!summaryExpanded);
    }
  };

  const handleExport = () => {
    const slug = createSlug(article.title);
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Export as Markdown
    downloadFile(cleanContent, `${slug}-${timestamp}.md`, 'text/markdown');
    
    // Export as Text
    const textContent = cleanContent.replace(/[#*`_~]/g, '').replace(/\n\n+/g, '\n\n');
    downloadFile(textContent, `${slug}-${timestamp}.txt`, 'text/plain');
    
    showToast('Exported!');
  };

  const handleDelete = () => {
    if (window.confirm('Delete this article? This removes it from your device.')) {
      onDeleteArticle?.(article.id);
      onClose();
    }
  };

  const summary = React.useMemo(() => generateSummary(cleanContent), [cleanContent]);

  if (!article.content) {
    return (
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center" aria-modal="true">
        <div ref={modalRef} className={`rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden ${
          document.documentElement.classList.contains('dark') 
            ? 'bg-gray-800 text-white' 
            : 'bg-white text-gray-900'
        }`}>
          <div className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className={`h-6 rounded w-3/4 mx-auto ${
                document.documentElement.classList.contains('dark') ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
              <div className={`h-4 rounded w-1/2 mx-auto ${
                document.documentElement.classList.contains('dark') ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
              <div className="space-y-2">
                <div className={`h-4 rounded ${
                  document.documentElement.classList.contains('dark') ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className={`h-4 rounded w-5/6 ${
                  document.documentElement.classList.contains('dark') ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className={`h-4 rounded w-4/6 ${
                  document.documentElement.classList.contains('dark') ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true">
      <div 
        ref={modalRef}
        className={`rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 ${
          document.documentElement.classList.contains('dark')
            ? 'bg-gray-800 text-white'
            : 'bg-white text-gray-900'
        }`}
      >
        {/* Header */}
        <div className={`border-b px-4 sm:px-6 py-3 sm:py-4 ${
          document.documentElement.classList.contains('dark') ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className={`text-lg sm:text-xl font-bold leading-tight flex-1 pr-2 ${
              document.documentElement.classList.contains('dark') ? 'text-white' : 'text-gray-900'
            }`} id="modal-title">
              {article.title}
            </h1>
          </div>
          
          <div className={`flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm ${
            document.documentElement.classList.contains('dark') ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                document.documentElement.classList.contains('dark')
                  ? 'bg-blue-900/50 text-blue-300'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                Article
              </span>
              {article.sourceUrl && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  document.documentElement.classList.contains('dark')
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {sourceName}
                </span>
              )}
              <span className="hidden sm:inline">{wordCount} words</span>
              <span>•</span>
              <span>{readingTime} min read</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{timeSince}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className={`border-b px-4 sm:px-6 py-3 ${
          document.documentElement.classList.contains('dark')
            ? 'border-gray-700 bg-gray-700/30'
            : 'border-gray-50 bg-gray-50/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[36px] ${
                  document.documentElement.classList.contains('dark')
                    ? 'text-gray-300 hover:bg-gray-600 hover:shadow-sm'
                    : 'text-gray-700 hover:bg-white hover:shadow-sm'
                }`}
                title="Copy (Ctrl+C)"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">Copy</span>
              </button>
              
              <button
                onClick={toggleEdit}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[36px] ${
                  document.documentElement.classList.contains('dark')
                    ? 'text-gray-300 hover:bg-gray-600 hover:shadow-sm'
                    : 'text-gray-700 hover:bg-white hover:shadow-sm'
                }`}
                title="Edit (Ctrl+E)"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">{isEditing ? 'Cancel' : 'Edit'}</span>
              </button>

              {isEditing && (
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[36px]"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Save</span>
                </button>
              )}
              
              <button
                onClick={handleSummarize}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[36px] ${
                  document.documentElement.classList.contains('dark')
                    ? 'text-gray-300 hover:bg-gray-600 hover:shadow-sm'
                    : 'text-gray-700 hover:bg-white hover:shadow-sm'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Summary</span>
              </button>
              
              <button
                onClick={handleExport}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[36px] ${
                  document.documentElement.classList.contains('dark')
                    ? 'text-gray-300 hover:bg-gray-600 hover:shadow-sm'
                    : 'text-gray-700 hover:bg-white hover:shadow-sm'
                }`}
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              
              {onDeleteArticle && (
                <button
                  onClick={handleDelete}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[36px] ${
                    document.documentElement.classList.contains('dark')
                      ? 'text-red-400 hover:bg-red-900/20 hover:shadow-sm'
                      : 'text-red-600 hover:bg-red-50 hover:shadow-sm'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
            </div>
            
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                document.documentElement.classList.contains('dark')
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white'
              }`}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-12rem)] sm:max-h-[calc(90vh-12rem)] px-4 sm:px-6 py-4 sm:py-6">
          {showSummary && (
            <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${
              document.documentElement.classList.contains('dark')
                ? 'bg-blue-900/20 border-blue-800'
                : 'bg-blue-50 border-blue-100'
            }`}>
              <button
                onClick={() => setSummaryExpanded(!summaryExpanded)}
                className="flex items-center justify-between w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                <h3 className={`text-sm sm:text-base font-semibold ${
                  document.documentElement.classList.contains('dark') ? 'text-blue-300' : 'text-blue-900'
                }`}>Key Points</h3>
                {summaryExpanded ? 
                  <ChevronUp className={`w-4 h-4 ${
                    document.documentElement.classList.contains('dark') ? 'text-blue-400' : 'text-blue-600'
                  }`} /> : 
                  <ChevronDown className={`w-4 h-4 ${
                    document.documentElement.classList.contains('dark') ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                }
              </button>
              {summaryExpanded && (
                <ul className={`mt-3 space-y-2 text-xs sm:text-sm ${
                  document.documentElement.classList.contains('dark') ? 'text-blue-200' : 'text-blue-800'
                }`}>
                  {summary.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                        document.documentElement.classList.contains('dark') ? 'bg-blue-400' : 'bg-blue-400'
                      }`}></span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {isEditing ? (
            <div className="space-y-4">
              <label htmlFor="article-editor" className={`block text-xs sm:text-sm font-medium ${
                document.documentElement.classList.contains('dark') ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Edit Article Content
              </label>
              <textarea
                id="article-editor"
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={`w-full h-64 sm:h-96 p-3 sm:p-4 border rounded-lg font-mono text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  document.documentElement.classList.contains('dark')
                    ? 'border-gray-600 bg-gray-700 text-white'
                    : 'border-gray-200 bg-white text-gray-900'
                }`}
                placeholder="Enter your article content in Markdown format..."
              />
              <div className={`text-xs sm:text-sm ${
                document.documentElement.classList.contains('dark') ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Supports Markdown formatting. Use **bold**, *italic*, # headings, - lists, etc.
              </div>
            </div>
          ) : (
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className={`text-xl sm:text-2xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4 first:mt-0 ${
                    document.documentElement.classList.contains('dark') ? 'text-white' : 'text-gray-900'
                  }`}>{children}</h1>,
                  h2: ({ children }) => <h2 className={`text-lg sm:text-xl font-semibold mt-5 sm:mt-6 mb-2 sm:mb-3 ${
                    document.documentElement.classList.contains('dark') ? 'text-white' : 'text-gray-900'
                  }`}>{children}</h2>,
                  h3: ({ children }) => <h3 className={`text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 ${
                    document.documentElement.classList.contains('dark') ? 'text-white' : 'text-gray-900'
                  }`}>{children}</h3>,
                  p: ({ children }) => <p className={`text-sm sm:text-base leading-relaxed mb-3 sm:mb-4 break-words ${
                    document.documentElement.classList.contains('dark') ? 'text-gray-300' : 'text-gray-700'
                  }`}>{children}</p>,
                  ul: ({ children }) => <ul className={`list-disc list-inside space-y-1 mb-3 sm:mb-4 text-sm sm:text-base ${
                    document.documentElement.classList.contains('dark') ? 'text-gray-300' : 'text-gray-700'
                  }`}>{children}</ul>,
                  ol: ({ children }) => <ol className={`list-decimal list-inside space-y-1 mb-3 sm:mb-4 text-sm sm:text-base ${
                    document.documentElement.classList.contains('dark') ? 'text-gray-300' : 'text-gray-700'
                  }`}>{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  code: ({ children }) => <code className={`px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono ${
                    document.documentElement.classList.contains('dark')
                      ? 'bg-gray-700 text-gray-200'
                      : 'bg-gray-100 text-gray-800'
                  }`}>{children}</code>,
                  pre: ({ children }) => <pre className={`p-3 sm:p-4 rounded-lg overflow-x-auto mb-3 sm:mb-4 text-xs sm:text-sm ${
                    document.documentElement.classList.contains('dark')
                      ? 'bg-gray-700'
                      : 'bg-gray-100'
                  }`}>{children}</pre>,
                  blockquote: ({ children }) => <blockquote className={`border-l-4 pl-3 sm:pl-4 italic mb-3 sm:mb-4 text-sm sm:text-base ${
                    document.documentElement.classList.contains('dark')
                      ? 'border-blue-400 text-gray-400'
                      : 'border-blue-200 text-gray-600'
                  }`}>{children}</blockquote>,
                  a: ({ children, href }) => <a href={href} className={`break-all underline text-sm sm:text-base ${
                    document.documentElement.classList.contains('dark')
                      ? 'text-blue-400 hover:text-blue-300'
                      : 'text-blue-600 hover:text-blue-700'
                  }`} target="_blank" rel="noopener noreferrer">{children}</a>,
                }}
              >
                {cleanContent}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t px-4 sm:px-6 py-3 sm:py-4 ${
          document.documentElement.classList.contains('dark')
            ? 'border-gray-700 bg-gray-700/30'
            : 'border-gray-100 bg-gray-50/50'
        }`}>
          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm ${
            document.documentElement.classList.contains('dark') ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <span className="truncate">Generated: {new Date(article.generatedAt).toLocaleString()}</span>
            {article.sourceUrl && (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded min-h-[36px] ${
                  document.documentElement.classList.contains('dark')
                    ? 'text-blue-400 hover:text-blue-300'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                <ExternalLink className="w-3 h-3" />
                View Source
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-bottom-2 duration-200 ${
          document.documentElement.classList.contains('dark')
            ? 'bg-gray-700 text-white'
            : 'bg-gray-900 text-white'
        }`}>
          {toast}
        </div>
      )}
    </div>
  );
}