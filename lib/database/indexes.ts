import { createClient } from '@supabase/supabase-js';
import { Client } from '@elastic/elasticsearch';

export class DatabaseIndexManager {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  private elasticsearch = new Client({ node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' });

  async createPostgresIndexes() {
    const indexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_user_id ON posts(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_hashtags ON posts USING GIN(hashtags)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_content_search ON posts USING GIN(to_tsvector(\'english\', content))',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_community_id ON posts(community_id) WHERE community_id IS NOT NULL',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_trending ON posts(like_count DESC, created_at DESC) WHERE created_at > NOW() - INTERVAL \'7 days\'',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_post_user ON likes(post_id, user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_follower_following ON follows(follower_id, following_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC)'
    ];

    for (const index of indexes) {
      try {
        await this.supabase.rpc('execute_sql', { sql: index });
      } catch (error) {
        console.error(`Failed to create index: ${index}`, error);
      }
    }
  }

  async createElasticsearchIndexes() {
    const mappings = {
      posts: {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            user_id: { type: 'keyword' },
            content: { 
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' },
                suggest: { type: 'completion' }
              }
            },
            hashtags: { type: 'keyword' },
            like_count: { type: 'integer' },
            created_at: { type: 'date' },
            visibility: { type: 'keyword' },
            location: { type: 'geo_point' },
            sentiment_score: { type: 'float' }
          }
        }
      }
    };

    for (const [indexName, mapping] of Object.entries(mappings)) {
      try {
        const exists = await this.elasticsearch.indices.exists({ index: indexName });
        if (!exists) {
          await this.elasticsearch.indices.create({
            index: indexName,
            body: mapping
          });
        }
      } catch (error) {
        console.error(`Failed to create Elasticsearch index: ${indexName}`, error);
      }
    }
  }
}

export const dbIndexManager = new DatabaseIndexManager();