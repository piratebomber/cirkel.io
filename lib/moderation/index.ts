import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import * as tf from '@tensorflow/tfjs';

export interface ModerationResult {
  flagged: boolean;
  confidence: number;
  categories: {
    spam: number;
    harassment: number;
    hate: number;
    violence: number;
    adult: number;
    misinformation: number;
  };
  action: 'approve' | 'flag' | 'remove' | 'shadowban';
  reason?: string;
}

export interface ModerationRule {
  id: string;
  name: string;
  type: 'keyword' | 'pattern' | 'ai' | 'user_report';
  conditions: any;
  action: 'flag' | 'remove' | 'shadowban' | 'warn';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export class ModerationEngine {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private rules: ModerationRule[] = [];
  private spamKeywords: Set<string> = new Set();
  private bannedWords: Set<string> = new Set();

  constructor() {
    this.loadRules();
    this.loadKeywords();
  }

  async moderateContent(content: string, userId: string, type: 'post' | 'comment' | 'message'): Promise<ModerationResult> {
    const results = await Promise.all([
      this.checkKeywords(content),
      this.checkAI(content),
      this.checkUserHistory(userId),
      this.checkSpamPatterns(content, userId)
    ]);

    const combined = this.combineResults(results);
    await this.logModerationResult(content, userId, type, combined);

    return combined;
  }

  async moderateImage(imageUrl: string, userId: string): Promise<ModerationResult> {
    try {
      const response = await this.openai.moderations.create({
        input: imageUrl
      });

      const result = response.results[0];
      
      return {
        flagged: result.flagged,
        confidence: Math.max(...Object.values(result.category_scores)),
        categories: {
          spam: 0,
          harassment: result.category_scores.harassment,
          hate: result.category_scores.hate,
          violence: result.category_scores.violence,
          adult: result.category_scores.sexual,
          misinformation: 0
        },
        action: result.flagged ? 'remove' : 'approve'
      };
    } catch (error) {
      console.error('Image moderation failed:', error);
      return this.getDefaultResult();
    }
  }

  async reportContent(contentId: string, reporterId: string, reason: string, details?: string): Promise<void> {
    await this.supabase
      .from('content_reports')
      .insert({
        content_id: contentId,
        reporter_id: reporterId,
        reason,
        details,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    await this.processReport(contentId, reason);
  }

  async reviewReport(reportId: string, moderatorId: string, action: 'approve' | 'reject' | 'escalate', notes?: string): Promise<void> {
    await this.supabase
      .from('content_reports')
      .update({
        status: action === 'approve' ? 'resolved' : action === 'reject' ? 'dismissed' : 'escalated',
        moderator_id: moderatorId,
        moderator_notes: notes,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (action === 'approve') {
      const { data: report } = await this.supabase
        .from('content_reports')
        .select('content_id, reason')
        .eq('id', reportId)
        .single();

      if (report) {
        await this.takeAction(report.content_id, 'remove', report.reason);
      }
    }
  }

  async addModerationRule(rule: Omit<ModerationRule, 'id'>): Promise<string> {
    const { data } = await this.supabase
      .from('moderation_rules')
      .insert(rule)
      .select('id')
      .single();

    if (data) {
      this.rules.push({ ...rule, id: data.id });
      return data.id;
    }

    throw new Error('Failed to create moderation rule');
  }

  async updateModerationRule(ruleId: string, updates: Partial<ModerationRule>): Promise<void> {
    await this.supabase
      .from('moderation_rules')
      .update(updates)
      .eq('id', ruleId);

    const ruleIndex = this.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex !== -1) {
      this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
    }
  }

  async getModerationQueue(status: 'pending' | 'escalated' = 'pending', limit: number = 50): Promise<any[]> {
    const { data } = await this.supabase
      .from('content_reports')
      .select(`
        *,
        posts(*),
        users(username, display_name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  async getModerationStats(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<any> {
    const startDate = new Date();
    switch (timeframe) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    const [reports, actions, autoModerated] = await Promise.all([
      this.supabase
        .from('content_reports')
        .select('reason, status')
        .gte('created_at', startDate.toISOString()),
      this.supabase
        .from('moderation_actions')
        .select('action, reason')
        .gte('created_at', startDate.toISOString()),
      this.supabase
        .from('moderation_logs')
        .select('action, confidence')
        .gte('created_at', startDate.toISOString())
        .eq('automated', true)
    ]);

    return {
      totalReports: reports.data?.length || 0,
      totalActions: actions.data?.length || 0,
      autoModerated: autoModerated.data?.length || 0,
      reportsByReason: this.groupBy(reports.data || [], 'reason'),
      actionsByType: this.groupBy(actions.data || [], 'action'),
      averageConfidence: this.calculateAverage(autoModerated.data || [], 'confidence')
    };
  }

  private async checkKeywords(content: string): Promise<Partial<ModerationResult>> {
    const lowerContent = content.toLowerCase();
    let spamScore = 0;
    let hateScore = 0;

    for (const keyword of this.spamKeywords) {
      if (lowerContent.includes(keyword)) {
        spamScore += 0.3;
      }
    }

    for (const word of this.bannedWords) {
      if (lowerContent.includes(word)) {
        hateScore += 0.5;
      }
    }

    return {
      categories: {
        spam: Math.min(spamScore, 1),
        hate: Math.min(hateScore, 1),
        harassment: 0,
        violence: 0,
        adult: 0,
        misinformation: 0
      }
    };
  }

  private async checkAI(content: string): Promise<Partial<ModerationResult>> {
    try {
      const response = await this.openai.moderations.create({
        input: content
      });

      const result = response.results[0];
      
      return {
        flagged: result.flagged,
        confidence: Math.max(...Object.values(result.category_scores)),
        categories: {
          spam: 0,
          harassment: result.category_scores.harassment,
          hate: result.category_scores.hate,
          violence: result.category_scores.violence,
          adult: result.category_scores.sexual,
          misinformation: 0
        }
      };
    } catch (error) {
      console.error('AI moderation failed:', error);
      return { categories: { spam: 0, harassment: 0, hate: 0, violence: 0, adult: 0, misinformation: 0 } };
    }
  }

  private async checkUserHistory(userId: string): Promise<Partial<ModerationResult>> {
    const { data: violations } = await this.supabase
      .from('moderation_actions')
      .select('action, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const violationCount = violations?.length || 0;
    const riskScore = Math.min(violationCount * 0.2, 1);

    return {
      categories: {
        spam: riskScore,
        harassment: riskScore * 0.5,
        hate: riskScore * 0.3,
        violence: riskScore * 0.2,
        adult: riskScore * 0.1,
        misinformation: riskScore * 0.4
      }
    };
  }

  private async checkSpamPatterns(content: string, userId: string): Promise<Partial<ModerationResult>> {
    const patterns = [
      /(.)\1{4,}/g, // Repeated characters
      /https?:\/\/[^\s]+/g, // URLs
      /@\w+/g, // Mentions
      /#\w+/g // Hashtags
    ];

    let spamScore = 0;
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        spamScore += matches.length * 0.1;
      }
    });

    // Check posting frequency
    const { data: recentPosts } = await this.supabase
      .from('posts')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (recentPosts && recentPosts.length > 10) {
      spamScore += 0.5;
    }

    return {
      categories: {
        spam: Math.min(spamScore, 1),
        harassment: 0,
        hate: 0,
        violence: 0,
        adult: 0,
        misinformation: 0
      }
    };
  }

  private combineResults(results: Partial<ModerationResult>[]): ModerationResult {
    const combined = {
      flagged: false,
      confidence: 0,
      categories: {
        spam: 0,
        harassment: 0,
        hate: 0,
        violence: 0,
        adult: 0,
        misinformation: 0
      },
      action: 'approve' as const
    };

    results.forEach(result => {
      if (result.categories) {
        Object.keys(combined.categories).forEach(key => {
          combined.categories[key as keyof typeof combined.categories] = Math.max(
            combined.categories[key as keyof typeof combined.categories],
            result.categories![key as keyof typeof result.categories] || 0
          );
        });
      }
    });

    combined.confidence = Math.max(...Object.values(combined.categories));
    combined.flagged = combined.confidence > 0.7;

    if (combined.confidence > 0.9) {
      combined.action = 'remove';
    } else if (combined.confidence > 0.7) {
      combined.action = 'flag';
    } else if (combined.confidence > 0.5) {
      combined.action = 'shadowban';
    }

    return combined;
  }

  private async processReport(contentId: string, reason: string): Promise<void> {
    const { data: reports } = await this.supabase
      .from('content_reports')
      .select('id')
      .eq('content_id', contentId)
      .eq('status', 'pending');

    if (reports && reports.length >= 3) {
      await this.takeAction(contentId, 'flag', 'Multiple reports received');
    }
  }

  private async takeAction(contentId: string, action: string, reason: string): Promise<void> {
    await this.supabase
      .from('moderation_actions')
      .insert({
        content_id: contentId,
        action,
        reason,
        automated: true,
        created_at: new Date().toISOString()
      });

    if (action === 'remove') {
      await this.supabase
        .from('posts')
        .update({ deleted: true, deleted_reason: reason })
        .eq('id', contentId);
    }
  }

  private async loadRules(): Promise<void> {
    const { data } = await this.supabase
      .from('moderation_rules')
      .select('*')
      .eq('enabled', true);

    this.rules = data || [];
  }

  private async loadKeywords(): Promise<void> {
    const spamWords = ['buy now', 'click here', 'free money', 'get rich quick'];
    const bannedWords = ['hate', 'violence', 'harassment'];

    this.spamKeywords = new Set(spamWords);
    this.bannedWords = new Set(bannedWords);
  }

  private async logModerationResult(content: string, userId: string, type: string, result: ModerationResult): Promise<void> {
    await this.supabase
      .from('moderation_logs')
      .insert({
        user_id: userId,
        content_type: type,
        content_hash: this.hashContent(content),
        result: result,
        automated: true,
        created_at: new Date().toISOString()
      });
  }

  private getDefaultResult(): ModerationResult {
    return {
      flagged: false,
      confidence: 0,
      categories: {
        spam: 0,
        harassment: 0,
        hate: 0,
        violence: 0,
        adult: 0,
        misinformation: 0
      },
      action: 'approve'
    };
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = item[key] || 'unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateAverage(array: any[], key: string): number {
    if (array.length === 0) return 0;
    const sum = array.reduce((acc, item) => acc + (item[key] || 0), 0);
    return sum / array.length;
  }

  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }
}

export const moderationEngine = new ModerationEngine();