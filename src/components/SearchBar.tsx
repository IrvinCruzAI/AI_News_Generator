import React, { useState } from 'react';
import { Search, Loader2, TrendingUp, History, X, ChevronDown, ChevronUp } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  darkMode?: boolean;
  isSticky?: boolean;
  currentQuery?: string;
  searchHistory?: string[];
  onClearHistory?: () => void;
}

const TRENDING_TOPICS = [
  // Priority topics: AI, Business, Important
  'Breaking news',
  'AI developments',
  'Business',
  'Technology',
  'Economy',
  'Stock market',
  'Politics',
  'Cybersecurity',
  'Climate change',
  'World news',
  'Healthcare',
  'Science',
  // Secondary topics
  'Real estate',
  'Education',
  'Renewable energy',
  'Electric vehicles',
  'Social media',
  'Mental health',
  'Health',
  'Sports',
  'Entertainment',
  'Gaming',
  'Streaming',
  'Travel',
  'Food trends'
];

export function SearchBar({ onSearch, isLoading = false, darkMode = false, isSticky = false, currentQuery = '', searchHistory = [], onClearHistory }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrendingTopics, setShowTrendingTopics] = useState(false);

  React.useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setValidationError('Please enter a search term');
      return;
    }
    setValidationError('');
    await onSearch(query.trim());
  };

  const handleTrendingClick = async (topic: string) => {
    setQuery(topic);
    setValidationError('');
    setShowHistory(false);
    await onSearch(topic);
  };

  const handleHistoryClick = async (historyItem: string) => {
    setQuery(historyItem);
    setValidationError('');
    setShowHistory(false);
    await onSearch(historyItem);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (validationError) setValidationError('');
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (searchHistory.length > 0) {
      setShowHistory(true);
    }
  };

  const handleBlur = () => {
    // Delay to allow clicks on history items
    setTimeout(() => {
      setIsFocused(false);
      setShowHistory(false);
    }, 150);
  };

  return (
    <div className={`w-full space-y-4 ${isSticky ? 'max-w-2xl' : 'max-w-3xl'}`}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          <label htmlFor="search-input" className="sr-only">
            Search news topics
          </label>
          <div className="relative">
          <input
            id="search-input"
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isSticky ? "Search topics..." : "Try: AI policy, Climate change, NVIDIA earnings"}
            className={`w-full px-6 py-4 pl-14 ${isSticky ? 'pr-4' : 'pr-6 sm:pr-48'} bg-panel shadow-2 rounded-2xl border border-panel transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-brand/60 focus:border-brand/20 text-ink placeholder-muted ${isSticky ? 'text-base' : 'text-lg'} ${isFocused ? 'scale-[1.01] shadow-lg ring-2 ring-brand/60' : ''} ${
              validationError ? 'ring-red-300 focus:ring-red-400' : 'focus-within:ring-brand/60'
            }`}
            aria-describedby={validationError ? 'search-error' : 'search-help'}
            aria-invalid={!!validationError}
          />
          <Search className={`absolute left-5 ${isSticky ? 'top-4' : 'top-5'} h-6 w-6 text-muted transition-colors duration-200 ${isFocused ? 'text-brand scale-110' : ''}`} />
          
          <button
            type="submit"
            disabled={isLoading}
            className={`${isSticky ? 'w-full mt-3' : 'w-full sm:w-auto sm:absolute sm:right-2 sm:top-2'} px-4 py-3 bg-brand text-white rounded-lg transition-all duration-200 ease-out shadow-1 hover:shadow-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-brand/60 min-h-[44px] touch-manipulation whitespace-nowrap`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Searching Today's News...</span>
              </>
            ) : (
              <>
                <span className="text-sm">Search Today's News</span>
              </>
            )}
          </button>
          </div>
        </div>
      </form>
      
      {validationError && (
        <div id="search-error" className="text-red-500 text-sm px-2" aria-live="polite">
          {validationError}
        </div>
      )}
      
      {(showHistory && searchHistory.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-sm text-muted">
              <History className="w-4 h-4" />
              <span>Recent searches:</span>
            </div>
            {onClearHistory && (
              <button
                onClick={onClearHistory}
                className="text-xs text-muted hover:text-ink transition-colors duration-200 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 px-2">
            {searchHistory.slice(0, 5).map((item, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(item)}
                disabled={isLoading}
                className="px-4 py-2.5 bg-panel rounded-full text-sm border border-panel hover:border-brand/20 hover:bg-panel-hover transition-all duration-200 ease-out min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed text-ink hover:shadow-1 focus:outline-none focus:ring-2 focus:ring-brand/60 active:scale-95 touch-manipulation"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {!isSticky && !showHistory && (
        <div className="space-y-4">
          <div id="search-help" className="text-sm text-muted px-2">
            Examples: 'AI policy', 'NVIDIA earnings', 'US inflation'
          </div>
        
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-sm text-muted">
                <TrendingUp className="w-4 h-4" />
                <span>Trending topics:</span>
              </div>
              <button
                onClick={() => setShowTrendingTopics(!showTrendingTopics)}
                className="flex items-center gap-1 text-xs text-muted hover:text-ink transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand/60 rounded px-2 py-1"
              >
                <span>{showTrendingTopics ? 'Show less' : 'Show more'}</span>
                {showTrendingTopics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            {showTrendingTopics && (
              <div className="px-2">
                <div className="flex flex-wrap gap-2">
                  {TRENDING_TOPICS.map((topic, index) => (
                    <button
                      key={topic}
                      onClick={() => handleTrendingClick(topic)}
                      disabled={isLoading}
                      className="px-4 py-2.5 bg-panel rounded-full text-sm border border-panel hover:border-brand/20 hover:bg-panel-hover transition-all duration-200 ease-out min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed text-ink hover:shadow-1 focus:outline-none focus:ring-2 focus:ring-brand/60 active:scale-95 touch-manipulation whitespace-nowrap"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            ) || (
              <div className="px-2">
                <div className="flex flex-wrap gap-2">
                  {TRENDING_TOPICS.slice(0, 5).map((topic, index) => (
                    <button
                      key={topic}
                      onClick={() => handleTrendingClick(topic)}
                      disabled={isLoading}
                      className="px-4 py-2.5 bg-panel rounded-full text-sm border border-panel hover:border-brand/20 hover:bg-panel-hover transition-all duration-200 ease-out min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed text-ink hover:shadow-1 focus:outline-none focus:ring-2 focus:ring-brand/60 active:scale-95 touch-manipulation whitespace-nowrap"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}