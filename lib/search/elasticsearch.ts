import { Client } from '@elastic/elasticsearch';
import { createClient } from '@supabase/supabase-js';
import Fuse from 'fuse.js';

export interface SearchResult {
  id: string;
  type: 'post' | 'user' | 'community';
  title: string;
  content: string;
  score: number;
  highlights: string[];
  metadata: Record<string, any>;
}

export class SearchEngine {
  private elasticsearch = new Client({ node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' });
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

  async searchPosts(query: string, options: {
    filters?: Record<string, any>;
    sort?: 'relevance' | 'date' | 'popularity';
    limit?: number;
    offset?: number;
  } = {}): Promise<SearchResult[]> {
    const { filters = {}, sort = 'relevance', limit = 20, offset = 0 } = options;

    const searchBody: any = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['content^2', 'hashtags^1.5', 'mentions'],
                type: 'best_fields',
                fuzziness: 'AUTO'
              }
            }
          ],
          filter: []
        }
      },
      highlight: {
        fields: {
          content: { fragment_size: 150, number_of_fragments: 3 },
          hashtags: {},
          mentions: {}
        }
      },
      from: offset,
      size: limit
    };

    Object.entries(filters).forEach(([key, value]) => {
      searchBody.query.bool.filter.push({ term: { [key]: value } });
    });

    if (sort === 'date') {
      searchBody.sort = [{ created_at: { order: 'desc' } }];
    } else if (sort === 'popularity') {
      searchBody.sort = [
        { like_count: { order: 'desc' } },
        { repost_count: { order: 'desc' } },
        { _score: { order: 'desc' } }
      ];
    }

    try {
      const response = await this.elasticsearch.search({
        index: 'posts',
        body: searchBody
      });

      return response.body.hits.hits.map((hit: any) => ({
        id: hit._source.id,
        type: 'post',
        title: hit._source.content.substring(0, 100),
        content: hit._source.content,
        score: hit._score,
        highlights: this.extractHighlights(hit.highlight),
        metadata: {
          user_id: hit._source.user_id,
          created_at: hit._source.created_at,
          like_count: hit._source.like_count,
          hashtags: hit._source.hashtags
        }
      }));
    } catch (error) {
      console.error('Elasticsearch search failed:', error);
      return this.fallbackSearch(query, 'posts', options);
    }
  }

  async searchUsers(query: string, options: {
    filters?: Record<string, any>;
    limit?: number;
    offset?: number;
  } = {}): Promise<SearchResult[]> {
    const { filters = {}, limit = 20, offset = 0 } = options;

    const searchBody = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['username^3', 'display_name^2', 'bio'],
                type: 'best_fields',
                fuzziness: 'AUTO'
              }
            }
          ],
          filter: Object.entries(filters).map(([key, value]) => ({ term: { [key]: value } }))
        }
      },
      highlight: {
        fields: {
          username: {},
          display_name: {},
          bio: { fragment_size: 100 }
        }
      },
      from: offset,
      size: limit,
      sort: [
        { verified: { order: 'desc' } },
        { follower_count: { order: 'desc' } },
        { _score: { order: 'desc' } }
      ]
    };

    try {
      const response = await this.elasticsearch.search({
        index: 'users',
        body: searchBody
      });

      return response.body.hits.hits.map((hit: any) => ({
        id: hit._source.id,
        type: 'user',
        title: hit._source.display_name || hit._source.username,
        content: hit._source.bio || '',
        score: hit._score,
        highlights: this.extractHighlights(hit.highlight),
        metadata: {
          username: hit._source.username,
          verified: hit._source.verified,
          follower_count: hit._source.follower_count,
          avatar_url: hit._source.avatar_url
        }
      }));
    } catch (error) {
      console.error('Elasticsearch user search failed:', error);
      return this.fallbackSearch(query, 'users', options);
    }
  }

  async searchCommunities(query: string, options: {
    filters?: Record<string, any>;
    limit?: number;
    offset?: number;
  } = {}): Promise<SearchResult[]> {
    const { filters = {}, limit = 20, offset = 0 } = options;

    const searchBody = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['name^3', 'description^2', 'tags'],
                type: 'best_fields',
                fuzziness: 'AUTO'
              }
            }
          ],
          filter: Object.entries(filters).map(([key, value]) => ({ term: { [key]: value } }))
        }
      },
      highlight: {
        fields: {
          name: {},
          description: { fragment_size: 150 },
          tags: {}
        }
      },
      from: offset,
      size: limit,
      sort: [
        { member_count: { order: 'desc' } },
        { activity_score: { order: 'desc' } },
        { _score: { order: 'desc' } }
      ]
    };

    try {
      const response = await this.elasticsearch.search({
        index: 'communities',
        body: searchBody
      });

      return response.body.hits.hits.map((hit: any) => ({
        id: hit._source.id,
        type: 'community',
        title: hit._source.name,
        content: hit._source.description || '',
        score: hit._score,
        highlights: this.extractHighlights(hit.highlight),
        metadata: {
          category: hit._source.category,
          member_count: hit._source.member_count,
          privacy: hit._source.privacy,
          tags: hit._source.tags
        }
      }));
    } catch (error) {
      console.error('Elasticsearch community search failed:', error);
      return this.fallbackSearch(query, 'communities', options);
    }
  }

  async searchAll(query: string, options: {
    types?: Array<'post' | 'user' | 'community'>;
    filters?: Record<string, any>;
    limit?: number;
  } = {}): Promise<SearchResult[]> {
    const { types = ['post', 'user', 'community'], filters = {}, limit = 20 } = options;
    const perTypeLimit = Math.ceil(limit / types.length);

    const searches = await Promise.all([
      types.includes('post') ? this.searchPosts(query, { ...filters, limit: perTypeLimit }) : [],
      types.includes('user') ? this.searchUsers(query, { ...filters, limit: perTypeLimit }) : [],
      types.includes('community') ? this.searchCommunities(query, { ...filters, limit: perTypeLimit }) : []
    ]);

    return searches
      .flat()
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getSearchSuggestions(query: string, type?: 'post' | 'user' | 'community'): Promise<string[]> {
    const indices = type ? [type === 'post' ? 'posts' : type === 'user' ? 'users' : 'communities'] : ['posts', 'users', 'communities'];
    
    const suggestions: string[] = [];

    for (const index of indices) {
      try {
        const response = await this.elasticsearch.search({
          index,
          body: {
            suggest: {
              text: query,
              simple_phrase: {
                phrase: {
                  field: index === 'posts' ? 'content' : index === 'users' ? 'username' : 'name',
                  size: 5,
                  gram_size: 3,
                  direct_generator: [{
                    field: index === 'posts' ? 'content' : index === 'users' ? 'username' : 'name',
                    suggest_mode: 'always'
                  }]
                }
              }
            }
          }
        });

        const phraseSuggestions = response.body.suggest.simple_phrase[0].options;
        suggestions.push(...phraseSuggestions.map((s: any) => s.text));
      } catch (error) {
        console.error(`Suggestion search failed for ${index}:`, error);
      }
    }

    return [...new Set(suggestions)].slice(0, 10);
  }

  async getTrendingSearches(timeframe: '1h' | '24h' | '7d' = '24h'): Promise<Array<{ query: string; count: number }>> {
    const startDate = new Date();
    switch (timeframe) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
    }

    const { data } = await this.supabase
      .from('search_analytics')
      .select('query, count(*)')
      .gte('created_at', startDate.toISOString())
      .order('count', { ascending: false })
      .limit(10);

    return data?.map(item => ({
      query: item.query,
      count: item.count
    })) || [];
  }

  async logSearch(query: string, userId?: string, results?: number) {
    await this.supabase
      .from('search_analytics')
      .insert({
        query,
        user_id: userId,
        results_count: results,
        created_at: new Date().toISOString()
      });
  }

  private extractHighlights(highlight: any): string[] {
    if (!highlight) return [];
    
    const highlights: string[] = [];
    Object.values(highlight).forEach((fragments: any) => {
      if (Array.isArray(fragments)) {
        highlights.push(...fragments);
      }
    });
    
    return highlights;
  }

  private async fallbackSearch(query: string, type: string, options: any): Promise<SearchResult[]> {
    const { data } = await this.supabase
      .from(type)
      .select('*')
      .or(`content.ilike.%${query}%,username.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(options.limit || 20);

    if (!data) return [];

    const fuse = new Fuse(data, {
      keys: type === 'posts' ? ['content', 'hashtags'] : 
            type === 'users' ? ['username', 'display_name', 'bio'] :
            ['name', 'description', 'tags'],
      threshold: 0.3
    });

    const results = fuse.search(query);
    
    return results.map(result => ({
      id: result.item.id,
      type: type.slice(0, -1) as any,
      title: result.item.content?.substring(0, 100) || result.item.username || result.item.name,
      content: result.item.content || result.item.bio || result.item.description || '',
      score: 1 - result.score!,
      highlights: [],
      metadata: result.item
    }));
  }
}

export const searchEngine = new SearchEngine();