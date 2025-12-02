import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import * as tf from '@tensorflow/tfjs';

export interface RecommendationResult {
  postId: string;
  score: number;
  reason: string;
  category: 'trending' | 'personalized' | 'similar' | 'social';
}

export class AIRecommendationEngine {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  private model: tf.LayersModel | null = null;

  async initialize() {
    try {
      this.model = await tf.loadLayersModel('/models/recommendation-model.json');
    } catch (error) {
      console.error('Failed to load recommendation model:', error);
    }
  }

  async getPersonalizedRecommendations(userId: string, limit: number = 20): Promise<RecommendationResult[]> {
    const [userProfile, interactions, socialGraph] = await Promise.all([
      this.getUserProfile(userId),
      this.getUserInteractions(userId),
      this.getSocialGraph(userId)
    ]);

    const recommendations = await Promise.all([
      this.getContentBasedRecommendations(userProfile, limit / 4),
      this.getCollaborativeRecommendations(userId, limit / 4),
      this.getSocialRecommendations(socialGraph, limit / 4),
      this.getTrendingRecommendations(limit / 4)
    ]);

    return this.mergeAndRankRecommendations(recommendations.flat(), limit);
  }

  async generateContentCaption(mediaUrl: string, contentType: 'image' | 'video'): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Generate an engaging social media caption for this content. Keep it concise and include relevant hashtags.' },
            { type: 'image_url', image_url: { url: mediaUrl } }
          ]
        }],
        max_tokens: 150
      });

      return response.choices[0]?.message?.content || 'Check out this amazing content!';
    } catch (error) {
      console.error('Caption generation failed:', error);
      return 'Amazing content to share!';
    }
  }

  async generateAltText(imageUrl: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Generate descriptive alt text for this image for accessibility purposes. Be specific and concise.' },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }],
        max_tokens: 100
      });

      return response.choices[0]?.message?.content || 'Image content';
    } catch (error) {
      console.error('Alt text generation failed:', error);
      return 'Image content';
    }
  }

  async translateContent(text: string, targetLanguage: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: `Translate the following text to ${targetLanguage}, maintaining the tone and style: "${text}"`
        }],
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || text;
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    }
  }

  async summarizeContent(text: string, maxLength: number = 100): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: `Summarize this content in ${maxLength} characters or less: "${text}"`
        }],
        max_tokens: 50
      });

      return response.choices[0]?.message?.content || text.substring(0, maxLength);
    } catch (error) {
      console.error('Summarization failed:', error);
      return text.substring(0, maxLength);
    }
  }

  async getChatbotResponse(message: string, context: any[] = []): Promise<string> {
    try {
      const systemPrompt = `You are Cirkel Assistant, a helpful AI chatbot for the Cirkel.io social media platform. 
      Help users with platform features, content creation tips, and general support. Be friendly and concise.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...context.map(c => ({ role: c.role, content: c.content })),
        { role: 'user', content: message }
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages as any,
        max_tokens: 200,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || 'I apologize, but I cannot process your request right now.';
    } catch (error) {
      console.error('Chatbot response failed:', error);
      return 'I apologize, but I cannot process your request right now.';
    }
  }

  private async getUserProfile(userId: string) {
    const { data } = await this.supabase
      .from('users')
      .select('interests, bio, location, created_at')
      .eq('id', userId)
      .single();

    return data;
  }

  private async getUserInteractions(userId: string) {
    const { data } = await this.supabase
      .from('user_interactions')
      .select('post_id, interaction_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1000);

    return data || [];
  }

  private async getSocialGraph(userId: string) {
    const { data } = await this.supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    return data?.map(f => f.following_id) || [];
  }

  private async getContentBasedRecommendations(userProfile: any, limit: number): Promise<RecommendationResult[]> {
    if (!userProfile?.interests) return [];

    const { data } = await this.supabase
      .from('posts')
      .select('id, hashtags, content')
      .overlaps('hashtags', userProfile.interests)
      .limit(limit);

    return data?.map(post => ({
      postId: post.id,
      score: 0.8,
      reason: 'Based on your interests',
      category: 'personalized' as const
    })) || [];
  }

  private async getCollaborativeRecommendations(userId: string, limit: number): Promise<RecommendationResult[]> {
    // Simplified collaborative filtering
    const { data } = await this.supabase
      .rpc('get_collaborative_recommendations', { user_id: userId, limit_count: limit });

    return data?.map((post: any) => ({
      postId: post.id,
      score: post.similarity_score,
      reason: 'Users like you also liked this',
      category: 'similar' as const
    })) || [];
  }

  private async getSocialRecommendations(followingIds: string[], limit: number): Promise<RecommendationResult[]> {
    if (followingIds.length === 0) return [];

    const { data } = await this.supabase
      .from('posts')
      .select('id, like_count, created_at')
      .in('user_id', followingIds)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('like_count', { ascending: false })
      .limit(limit);

    return data?.map(post => ({
      postId: post.id,
      score: 0.9,
      reason: 'Popular among people you follow',
      category: 'social' as const
    })) || [];
  }

  private async getTrendingRecommendations(limit: number): Promise<RecommendationResult[]> {
    const { data } = await this.supabase
      .from('posts')
      .select('id, like_count, repost_count, created_at')
      .gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
      .order('like_count', { ascending: false })
      .limit(limit);

    return data?.map(post => ({
      postId: post.id,
      score: 0.7,
      reason: 'Trending now',
      category: 'trending' as const
    })) || [];
  }

  private mergeAndRankRecommendations(recommendations: RecommendationResult[], limit: number): RecommendationResult[] {
    const uniqueRecommendations = recommendations.reduce((acc, rec) => {
      if (!acc.find(r => r.postId === rec.postId)) {
        acc.push(rec);
      }
      return acc;
    }, [] as RecommendationResult[]);

    return uniqueRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export const aiRecommendationEngine = new AIRecommendationEngine();