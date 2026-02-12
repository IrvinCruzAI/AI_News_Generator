import { useState, useEffect } from 'react';

const MAX_HISTORY_ITEMS = 10;

export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('search_history');
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  const addToHistory = (query: string) => {
    if (!query.trim()) return;
    
    setSearchHistory(prev => {
      // Remove if already exists
      const filtered = prev.filter(item => item.toLowerCase() !== query.toLowerCase());
      // Add to beginning
      const updated = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      try {
        localStorage.setItem('search_history', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save search history:', error);
      }
      
      return updated;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('search_history');
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  };

  return {
    searchHistory,
    addToHistory,
    clearHistory
  };
}