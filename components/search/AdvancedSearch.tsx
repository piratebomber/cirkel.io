'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, TrendingUp } from 'lucide-react';
import { searchEngine, SearchResult } from '@/lib/search/elasticsearch';
import { debounce } from 'lodash';

export default function AdvancedSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trending, setTrending] = useState<Array<{ query: string; count: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'post' | 'user' | 'community',
    dateRange: 'all' as 'all' | '24h' | '7d' | '30d',
    verified: false,
    hasMedia: false
  });
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchResults = await searchEngine.searchAll(searchQuery, {
          types: filters.type === 'all' ? ['post', 'user', 'community'] : [filters.type],
          filters: {
            ...(filters.verified && { verified: true }),
            ...(filters.hasMedia && { has_media: true }),
            ...(filters.dateRange !== 'all' && { 
              created_at: getDateFilter(filters.dateRange) 
            })
          },
          limit: 20
        });

        setResults(searchResults);
        await searchEngine.logSearch(searchQuery, undefined, searchResults.length);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [filters]
  );

  const debouncedSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length > 2) {
        try {
          const suggestions = await searchEngine.getSearchSuggestions(searchQuery);
          setSuggestions(suggestions);
        } catch (error) {
          console.error('Suggestions failed:', error);
        }
      } else {
        setSuggestions([]);
      }
    }, 200),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  useEffect(() => {
    debouncedSuggestions(query);
  }, [query, debouncedSuggestions]);

  useEffect(() => {
    loadTrendingSearches();
  }, []);

  const loadTrendingSearches = async () => {
    try {
      const trendingData = await searchEngine.getTrendingSearches('24h');
      setTrending(trendingData);
    } catch (error) {
      console.error('Failed to load trending searches:', error);
    }
  };

  const getDateFilter = (range: string) => {
    const now = new Date();
    switch (range) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return undefined;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
  };

  const renderResult = (result: SearchResult) => {
    switch (result.type) {
      case 'post':
        return (
          <div key={result.id} className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">P</span>
              </div>
              <div className="flex-1">
                <p className="text-white">{result.content}</p>
                {result.highlights.length > 0 && (
                  <div className="mt-2 text-sm text-gray-400">
                    {result.highlights.map((highlight, idx) => (
                      <span key={idx} dangerouslySetInnerHTML={{ __html: highlight }} />
                    ))}
                  </div>
                )}
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>{result.metadata.like_count} likes</span>
                  <span>{new Date(result.metadata.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'user':
        return (
          <div key={result.id} className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {result.metadata.username?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-white font-semibold">{result.title}</h3>
                  {result.metadata.verified && (
                    <span className="text-blue-400">✓</span>
                  )}
                </div>
                <p className="text-gray-400">@{result.metadata.username}</p>
                {result.content && (
                  <p className="text-gray-300 mt-1">{result.content}</p>
                )}
                <div className="mt-2 text-sm text-gray-500">
                  {result.metadata.follower_count} followers
                </div>
              </div>
            </div>
          </div>
        );

      case 'community':
        return (
          <div key={result.id} className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">C</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">{result.title}</h3>
                <p className="text-gray-400">{result.metadata.category}</p>
                {result.content && (
                  <p className="text-gray-300 mt-1">{result.content}</p>
                )}
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>{result.metadata.member_count} members</span>
                  <span className="capitalize">{result.metadata.privacy}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="relative">
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts, users, communities..."
              className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-lg border ${
              showFilters
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {suggestions.length > 0 && query && (
          <div className="absolute top-full left-0 right-0 z-10 bg-gray-800 border border-gray-700 rounded-lg mt-1 shadow-lg">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {showFilters && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="all">All</option>
                  <option value="post">Posts</option>
                  <option value="user">Users</option>
                  <option value="community">Communities</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="all">All Time</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.verified}
                    onChange={(e) => setFilters({ ...filters, verified: e.target.checked })}
                    className="rounded border-gray-600 bg-gray-700 text-blue-600"
                  />
                  <span className="text-sm text-gray-300">Verified only</span>
                </label>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.hasMedia}
                    onChange={(e) => setFilters({ ...filters, hasMedia: e.target.checked })}
                    className="rounded border-gray-600 bg-gray-700 text-blue-600"
                  />
                  <span className="text-sm text-gray-300">Has media</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {!query && trending.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Trending Searches</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {trending.slice(0, 10).map((trend, index) => (
              <button
                key={index}
                onClick={() => setQuery(trend.query)}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-sm text-gray-300 hover:text-white transition-colors"
              >
                {trend.query} ({trend.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            Search Results ({results.length})
          </h2>
          {results.map(renderResult)}
        </div>
      )}

      {query && !loading && results.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}