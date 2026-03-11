import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface SearchHistoryItem {
  id: string;
  query: string;
  type: string;
  timestamp: number;
  resultId?: string;
  resultName?: string;
}

interface RecentItem {
  id: string;
  type: 'customer' | 'service_order' | 'employee' | 'material' | 'finance';
  name: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

const MAX_HISTORY_ITEMS = 20;
const MAX_RECENT_ITEMS = 10;

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistoryItem[]>('search_history', []);
  const [recentItems, setRecentItems] = useLocalStorage<RecentItem[]>('recent_items', []);

  const addToSearchHistory = useCallback((query: string, type: string, resultId?: string, resultName?: string) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      id: `${Date.now()}-${Math.random()}`,
      query: query.trim(),
      type,
      timestamp: Date.now(),
      resultId,
      resultName,
    };

    setSearchHistory((prev) => {
      const filtered = prev.filter(
        (item) => item.query.toLowerCase() !== query.toLowerCase() || item.type !== type
      );
      return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  }, [setSearchHistory]);

  const addToRecentItems = useCallback((item: Omit<RecentItem, 'id' | 'timestamp'>) => {
    const newItem: RecentItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    setRecentItems((prev) => {
      const filtered = prev.filter(
        (existing) => !(existing.type === item.type && existing.name === item.name)
      );
      return [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);
    });
  }, [setRecentItems]);

  const removeFromSearchHistory = useCallback((id: string) => {
    setSearchHistory((prev) => prev.filter((item) => item.id !== id));
  }, [setSearchHistory]);

  const removeFromRecentItems = useCallback((id: string) => {
    setRecentItems((prev) => prev.filter((item) => item.id !== id));
  }, [setRecentItems]);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, [setSearchHistory]);

  const clearRecentItems = useCallback(() => {
    setRecentItems([]);
  }, [setRecentItems]);

  const getTopSearches = useCallback((limit: number = 5): string[] => {
    const queryCounts = searchHistory.reduce((acc, item) => {
      const query = item.query.toLowerCase();
      acc[query] = (acc[query] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(queryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([query]) => query);
  }, [searchHistory]);

  const getSuggestions = useCallback((query: string, limit: number = 5): string[] => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const matches = searchHistory
      .filter((item) => item.query.toLowerCase().includes(lowerQuery))
      .map((item) => item.query);

    const uniqueMatches = Array.from(new Set(matches));
    return uniqueMatches.slice(0, limit);
  }, [searchHistory]);

  return {
    searchHistory,
    recentItems,
    addToSearchHistory,
    addToRecentItems,
    removeFromSearchHistory,
    removeFromRecentItems,
    clearSearchHistory,
    clearRecentItems,
    getTopSearches,
    getSuggestions,
  };
};
