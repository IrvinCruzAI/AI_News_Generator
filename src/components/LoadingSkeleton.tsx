import React from 'react';

interface LoadingSkeletonProps {
  darkMode?: boolean;
}

export function LoadingSkeleton({ darkMode = false }: LoadingSkeletonProps) {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-panel rounded-2xl shadow-2 p-6 border border-panel overflow-hidden relative">
        <div className="absolute inset-0 animate-shimmer"></div>
        <div className="flex gap-5">
          <div className="w-28 h-28 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0"></div>
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/5"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-panel">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-28"></div>
        </div>
        </div>
      ))}
    </div>
  );
}