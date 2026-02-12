import React from 'react';
import { Search, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  darkMode?: boolean;
  hasSearched?: boolean;
}

export function EmptyState({ darkMode = false, hasSearched = false }: EmptyStateProps) {
  if (!hasSearched) {
    return (
      <div className="text-center py-20 bg-panel rounded-2xl shadow-2 border border-panel mt-8">
        <div className="w-20 h-20 mx-auto mb-8 bg-brand/10 rounded-2xl flex items-center justify-center">
          <Search className="w-10 h-10 text-brand" />
        </div>
        <h3 className="text-2xl font-bold mb-4 text-ink">
          No searches yet
        </h3>
        <p className="text-lg text-muted max-w-md mx-auto leading-relaxed">
          Enter a topic above to get started and fetch today's headlines
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-16 bg-panel rounded-2xl shadow-2 border border-panel mt-8">
      <div className="w-16 h-16 mx-auto mb-6 bg-orange-100 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-orange-600 dark:text-orange-400" />
      </div>
      <h3 className="text-xl font-semibold mb-3 text-ink">
        No results yet
      </h3>
      <p className="text-base text-muted max-w-sm mx-auto leading-relaxed">
        Try a different topic or check out the trending topics above
      </p>
    </div>
  );
}