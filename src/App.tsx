import React, { useState } from 'react';
import { Newspaper, Sparkles, Moon, Sun, Home, X, AlertCircle } from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import { NewsGrid } from './components/NewsGrid';
import { ArticleSidebar } from './components/ArticleSidebar';
import { ArticleViewer } from './components/ArticleViewer';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { EmptyState } from './components/EmptyState';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSearchHistory } from './hooks/useSearchHistory';
import { cache } from './utils/cache';
import { rateLimiter } from './utils/rateLimiter';
import { generateArticle } from './services/aiService';
import type { NewsItem, GeneratedArticle } from './types';

function App() {
  const [news, setNews] = useLocalStorage<NewsItem[]>('news_items', []);
  const [articles, setArticles] = useLocalStorage<GeneratedArticle[]>('generated_articles', []);
  const [currentQuery, setCurrentQuery] = useState('');
  const [generatingItems, setGeneratingItems] = useState<Set<string>>(new Set());
  const [errorStates, setErrorStates] = useState<{ [key: string]: string }>({});
  const [darkMode, setDarkMode] = useLocalStorage<boolean>('dark_mode', window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<GeneratedArticle | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<{ article: GeneratedArticle; index: number } | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const { searchHistory, addToHistory, clearHistory } = useSearchHistory();

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);

    setArticles(prev => prev.map(article => ({
      ...article,
      status: article.status || 'ready'
    })));
  }, [darkMode, setArticles]);

  const handleSearch = async (query: string): Promise<void> => {
    const searchCheck = rateLimiter.canSearch();
    if (!searchCheck.allowed) {
      setRateLimitMessage(searchCheck.message!);
      setTimeout(() => setRateLimitMessage(null), 5000);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setCurrentQuery(query);
    addToHistory(query);

    try {
      console.log('[Search] Searching for:', query);

      const data = await cache.get(
        `search:${query}`,
        async () => {
          const response = await fetch(import.meta.env.VITE_WEBHOOK_NEWS_SCRAPE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          return Array.isArray(result) ? result : [];
        },
        5 * 60 * 1000
      );

      setNews(data);
      rateLimiter.recordSearch();
      console.log(`[Search] Found ${data.length} items (${searchCheck.remaining - 1} searches remaining today)`);
    } catch (error) {
      console.error('[Search] Failed:', error);
      setRateLimitMessage('Failed to fetch news. Please try again.');
      setTimeout(() => setRateLimitMessage(null), 5000);
      setNews([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateArticle = async (newsItem: NewsItem) => {
    const articleCheck = rateLimiter.canGenerateArticle(generatingItems.size);
    if (!articleCheck.allowed) {
      setErrorStates(prev => ({ ...prev, [newsItem.link]: articleCheck.message! }));
      setRateLimitMessage(articleCheck.message!);
      setTimeout(() => {
        setErrorStates(prev => {
          const next = { ...prev };
          delete next[newsItem.link];
          return next;
        });
        setRateLimitMessage(null);
      }, 5000);
      return;
    }

    const placeholderId = crypto.randomUUID();

    setGeneratingItems(prev => new Set(prev).add(newsItem.link));
    setErrorStates(prev => ({ ...prev, [newsItem.link]: '' }));

    const placeholder: GeneratedArticle = {
      id: placeholderId,
      title: newsItem.title,
      content: '',
      sourceUrl: newsItem.link,
      generatedAt: new Date().toISOString(),
      status: 'generating',
      requestedAt: Date.now()
    };

    setArticles(prev => [placeholder, ...prev]);

    try {
      console.log(`[Generate] Starting article generation (${articleCheck.remaining - 1} remaining today)`);

      const result = await generateArticle({
        title: newsItem.title,
        description: newsItem.snippet,
        sourceUrl: newsItem.link,
        source: newsItem.source
      });

      console.log(`[Generate] Success with ${result.provider}`);

      if (!result.content || result.content.trim().length < 100) {
        throw new Error('Generated content too short or empty');
      }

      const article: GeneratedArticle = {
        id: placeholderId,
        title: newsItem.title,
        content: result.content,
        sourceUrl: newsItem.link,
        generatedAt: new Date().toISOString(),
        status: 'ready',
        requestedAt: placeholder.requestedAt,
        completedAt: Date.now()
      };

      setArticles(prev => prev.map(a => a.id === placeholderId ? article : a));
      setShowSidebar(true);
      setSelectedArticle(article);

      rateLimiter.recordArticle();
    } catch (error) {
      console.error('[Generate] Failed:', error);

      setArticles(prev => prev.map(a =>
        a.id === placeholderId
          ? {
              ...a,
              status: 'error' as const,
              errorMessage: error instanceof Error ? error.message : 'Generation failed'
            }
          : a
      ));
      setErrorStates(prev => ({
        ...prev,
        [newsItem.link]: 'Generation failed. Please try again.'
      }));
    } finally {
      setGeneratingItems(prev => {
        const next = new Set(prev);
        next.delete(newsItem.link);
        return next;
      });
    }
  };

  const handleRetry = async (newsItem: NewsItem) => {
    await handleGenerateArticle(newsItem);
  };

  const handleDeleteArticle = (articleId: string) => {
    const articleIndex = articles.findIndex(a => a.id === articleId);
    if (articleIndex === -1) return;

    const articleToDelete = articles[articleIndex];

    setLastDeleted({ article: articleToDelete, index: articleIndex });

    setArticles(prev => prev.filter(a => a.id !== articleId));

    setShowUndoToast(true);

    setTimeout(() => {
      setShowUndoToast(false);
      setLastDeleted(null);
    }, 6000);
  };

  const handleUndoDelete = () => {
    if (!lastDeleted) return;

    setArticles(prev => {
      const newArticles = [...prev];
      newArticles.splice(lastDeleted.index, 0, lastDeleted.article);
      return newArticles;
    });

    setLastDeleted(null);
    setShowUndoToast(false);
  };

  const handleClearAll = () => {
    setArticles([]);
  };

  const handleGoHome = () => {
    setNews([]);
    setCurrentQuery('');
    setHasSearched(false);
    setIsSearching(false);
    setGeneratingItems(new Set());
    setErrorStates({});
    setSelectedArticle(null);
    setShowSidebar(true);
  };

  const usageStats = rateLimiter.getStats();

  return (
    <div className={`min-h-screen transition-colors duration-150 ${darkMode ? 'dark bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-blue-50 to-indigo-50'} flex flex-col`}>
      <div className="flex-1 container mx-auto max-w-6xl px-4 py-8">
        {!hasSearched && (
          <header className="flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[80vh] text-center relative pt-4 sm:pt-8">
            <div className="absolute top-2 right-2 sm:top-8 sm:right-8 z-10">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 sm:p-3 bg-panel rounded-lg sm:rounded-xl shadow-1 text-muted hover:text-ink transition-colors duration-150 ring-1 ring-black/5 min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] touch-manipulation"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-3 h-3 sm:w-5 sm:h-5" /> : <Moon className="w-3 h-3 sm:w-5 sm:h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 mb-4 sm:mb-8 px-4">
              <div className="flex items-center justify-center gap-3 sm:gap-6">
                <div className="p-4 bg-brand/10 rounded-2xl shadow-1">
                  <Newspaper className="w-8 h-8 sm:w-12 sm:h-12 text-brand" />
                </div>
                <div className="text-center">
                  <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-ink tracking-tight">NewsGen AI</h1>
                  <div className="w-24 h-1 bg-brand rounded-full mx-auto mt-2"></div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-ink px-4">
              From headline to article in one click
            </h2>

            <p className="text-base sm:text-lg text-muted max-w-2xl mb-4 px-4">
              Fetch today's news and generate original articles instantly
            </p>

            <div className="mb-8 px-4 text-sm text-muted">
              <div className="flex items-center justify-center gap-4">
                <span>✨ {usageStats.searchesRemaining} searches left today</span>
                <span>•</span>
                <span>📝 {usageStats.articlesRemaining} articles left today</span>
              </div>
            </div>

            <div className="w-full max-w-2xl px-4">
              <SearchBar
                onSearch={handleSearch}
                isLoading={isSearching}
                darkMode={darkMode}
                searchHistory={searchHistory}
                onClearHistory={clearHistory}
              />
            </div>
          </header>
        )}

        {hasSearched && (
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-black/5 mb-6 -mx-4 px-4 py-3">
            <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleGoHome}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-panel transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand/60 group"
                    title="Go to home"
                  >
                    <Home className="w-6 h-6 text-brand group-hover:text-brand-light transition-colors duration-150" />
                  </button>
                  <span className="font-bold text-lg text-ink hidden sm:inline">
                    NewsGen AI
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <SearchBar
                    onSearch={handleSearch}
                    isLoading={isSearching}
                    darkMode={darkMode}
                    isSticky={true}
                    currentQuery={currentQuery}
                    searchHistory={searchHistory}
                    onClearHistory={clearHistory}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 text-xs text-muted">
                  <span>{usageStats.articlesRemaining} articles</span>
                </div>
                <button
                  onClick={handleGoHome}
                  className="p-2 bg-panel rounded-xl shadow-1 text-muted hover:text-ink transition-colors duration-150 ring-1 ring-black/5 flex-shrink-0 min-h-[40px] min-w-[40px] touch-manipulation"
                  aria-label="Go to home"
                  title="Clear and go home"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 bg-panel rounded-xl shadow-1 text-muted hover:text-ink transition-colors duration-150 ring-1 ring-black/5 flex-shrink-0 min-h-[40px] min-w-[40px] touch-manipulation"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {rateLimitMessage && (
          <div className="mb-6 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-center gap-3 text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{rateLimitMessage}</p>
          </div>
        )}

        {hasSearched && (
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-ink mb-2">
              Today's Top Headlines
            </h2>
            <p className="text-muted">
              {news.length} stories found for "{currentQuery}"
            </p>
          </div>
        )}

        <main className="space-y-12">
          {isSearching && <LoadingSkeleton darkMode={darkMode} />}

          {!isSearching && hasSearched && news.length === 0 && (
            <EmptyState darkMode={darkMode} hasSearched={true} />
          )}

          {hasSearched && news.length > 0 && (
            <div className="w-full">
              <NewsGrid
                news={news}
                onGenerateArticle={handleGenerateArticle}
                generatingItems={generatingItems}
                errorStates={errorStates}
                onRetry={handleRetry}
              />
            </div>
          )}

          {articles.length > 0 && (
            <div className="w-full mt-6">
              <ArticleSidebar
                articles={articles}
                onClose={() => setShowSidebar(false)}
                onArticleSelect={setSelectedArticle}
                onDeleteArticle={handleDeleteArticle}
                onClearAll={handleClearAll}
                darkMode={darkMode}
              />
            </div>
          )}
        </main>

        {selectedArticle && (
          <ArticleViewer
            article={selectedArticle}
            onClose={() => setSelectedArticle(null)}
            onDeleteArticle={handleDeleteArticle}
          />
        )}

        <footer className="mt-16 text-center text-sm text-muted py-4 space-y-2">
          <div>
            ©2025 <a href="https://irvincruz.com/" className="hover:text-ink transition-colors duration-150">Irvin Cruz</a>,{' '}
            <a href="https://www.futurecrafters.ai/" className="hover:text-ink transition-colors duration-150">FutureCrafters.AI</a>
          </div>
          <div className="flex items-center justify-center gap-4">
            <a href="#" className="hover:text-ink transition-colors duration-150">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-ink transition-colors duration-150">Terms</a>
          </div>
        </footer>
      </div>

      {showUndoToast && lastDeleted && (
        <div className="fixed bottom-4 right-4 px-4 py-3 bg-panel rounded-xl shadow-2 ring-1 ring-black/5 animate-in slide-in-from-bottom-2 duration-200 flex items-center gap-3 text-ink">
          <span>Article deleted</span>
          <button
            onClick={handleUndoDelete}
            className="px-3 py-1 bg-brand text-white rounded-lg text-sm font-medium hover:shadow-1 transition-all duration-150"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
