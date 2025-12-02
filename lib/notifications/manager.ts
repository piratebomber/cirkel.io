import webpush from 'web-push';
import nodemailer from 'nodemailer';
import { Twilio } from 'twilio';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import { EventEmitter } from 'events';

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate: string;
  pushTemplate: string;
  smsTemplate: string;
  variables: string[];
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  categories: {
    likes: boolean;
    comments: boolean;
    follows: boolean;
    mentions: boolean;
    reposts: boolean;
    messages: boolean;
    communityUpdates: boolean;
    systemUpdates: boolean;
    marketing: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
}

export interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  templateId?: string;
  templateVariables?: Record<string, any>;
  channels?: Array<'email' | 'push' | 'sms' | 'inApp'>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
  expiresAt?: Date;
}

export class NotificationManager extends EventEmitter {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  private emailTransporter: nodemailer.Transporter;
  private twilioClient: Twilio;
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor() {
    super();
    this.initializeServices();
    this.loadTemplates();
  }

  private initializeServices() {
    // Configure web push
    webpush.setVapidDetails(
      'mailto:' + process.env.VAPID_EMAIL,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    // Configure email transporter
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Configure Twilio
    this.twilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(payload.userId);
      
      if (!this.shouldSendNotification(payload, preferences)) {
        return;
      }

      const channels = payload.channels || this.getDefaultChannels(preferences, payload.type);
      const processedPayload = await this.processTemplate(payload);

      await Promise.all([
        channels.includes('inApp') ? this.sendInAppNotification(processedPayload) : null,
        channels.includes('push') && preferences.push ? this.sendPushNotification(processedPayload) : null,
        channels.includes('email') && preferences.email ? this.sendEmailNotification(processedPayload) : null,
        channels.includes('sms') && preferences.sms ? this.sendSMSNotification(processedPayload) : null
      ]);

      await this.logNotification(processedPayload);
      this.emit('notificationSent', processedPayload);
    } catch (error) {
      console.error('Failed to send notification:', error);
      this.emit('notificationError', { payload, error });
    }
  }

  async sendBulkNotifications(payloads: NotificationPayload[]): Promise<void> {
    const batchSize = 100;
    
    for (let i = 0; i < payloads.length; i += batchSize) {
      const batch = payloads.slice(i, i + batchSize);
      await Promise.all(batch.map(payload => this.sendNotification(payload)));
      
      // Rate limiting
      if (i + batchSize < payloads.length) {
        await this.delay(1000);
      }
    }
  }

  async scheduleNotification(payload: NotificationPayload): Promise<string> {
    const notificationId = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.redis.zadd(
      'scheduled_notifications',
      payload.scheduledFor!.getTime(),
      JSON.stringify({ ...payload, id: notificationId })
    );

    return notificationId;
  }

  async cancelScheduledNotification(notificationId: string): Promise<boolean> {
    const notifications = await this.redis.zrange('scheduled_notifications', 0, -1);
    
    for (const notification of notifications) {
      const parsed = JSON.parse(notification);
      if (parsed.id === notificationId) {
        await this.redis.zrem('scheduled_notifications', notification);
        return true;
      }
    }
    
    return false;
  }

  async processScheduledNotifications(): Promise<void> {
    const now = Date.now();
    const notifications = await this.redis.zrangebyscore('scheduled_notifications', 0, now);
    
    for (const notification of notifications) {
      try {
        const payload = JSON.parse(notification);
        await this.sendNotification(payload);
        await this.redis.zrem('scheduled_notifications', notification);
      } catch (error) {
        console.error('Failed to process scheduled notification:', error);
      }
    }
  }

  async createDigest(userId: string, period: 'daily' | 'weekly'): Promise<void> {
    const startDate = new Date();
    if (period === 'daily') {
      startDate.setDate(startDate.getDate() - 1);
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }

    const { data: notifications } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (!notifications || notifications.length === 0) return;

    const digestData = this.groupNotificationsByType(notifications);
    
    await this.sendNotification({
      userId,
      type: 'digest',
      title: `Your ${period} digest`,
      message: `You have ${notifications.length} new notifications`,
      templateId: `${period}_digest`,
      templateVariables: digestData,
      channels: ['email'],
      priority: 'low'
    });
  }

  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    await this.supabase
      .from('notification_preferences')
      .upsert({ user_id: userId, ...preferences });

    await this.redis.del(`preferences:${userId}`);
  }

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const cached = await this.redis.get(`preferences:${userId}`);
    if (cached) return JSON.parse(cached);

    const { data } = await this.supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    const preferences = data || this.getDefaultPreferences(userId);
    await this.redis.setex(`preferences:${userId}`, 3600, JSON.stringify(preferences));
    
    return preferences;
  }

  async registerPushSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    await this.supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        created_at: new Date().toISOString()
      });
  }

  async unregisterPushSubscription(userId: string, endpoint: string): Promise<void> {
    await this.supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);
  }

  private async sendInAppNotification(payload: NotificationPayload): Promise<void> {
    await this.supabase
      .from('notifications')
      .insert({
        user_id: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data,
        read: false,
        created_at: new Date().toISOString()
      });

    // Real-time notification via WebSocket
    await this.redis.publish(`notifications:${payload.userId}`, JSON.stringify({
      type: 'new_notification',
      notification: payload
    }));
  }

  private async sendPushNotification(payload: NotificationPayload): Promise<void> {
    const { data: subscriptions } = await this.supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', payload.userId);

    if (!subscriptions || subscriptions.length === 0) return;

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: payload.data,
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, pushPayload);
        } catch (error) {
          console.error('Push notification failed:', error);
          // Remove invalid subscription
          if (error.statusCode === 410) {
            await this.supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
        }
      })
    );
  }

  private async sendEmailNotification(payload: NotificationPayload): Promise<void> {
    const { data: user } = await this.supabase
      .from('users')
      .select('email, display_name')
      .eq('id', payload.userId)
      .single();

    if (!user?.email) return;

    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: user.email,
      subject: payload.title,
      text: payload.message,
      html: this.generateEmailHTML(payload, user.display_name)
    };

    await this.emailTransporter.sendMail(mailOptions);
  }

  private async sendSMSNotification(payload: NotificationPayload): Promise<void> {
    const { data: user } = await this.supabase
      .from('users')
      .select('phone')
      .eq('id', payload.userId)
      .single();

    if (!user?.phone) return;

    await this.twilioClient.messages.create({
      body: `${payload.title}: ${payload.message}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.phone
    });
  }

  private async processTemplate(payload: NotificationPayload): Promise<NotificationPayload> {
    if (!payload.templateId || !payload.templateVariables) return payload;

    const template = this.templates.get(payload.templateId);
    if (!template) return payload;

    const processedPayload = { ...payload };
    
    processedPayload.title = this.replaceVariables(template.subject, payload.templateVariables);
    processedPayload.message = this.replaceVariables(template.textTemplate, payload.templateVariables);

    return processedPayload;
  }

  private replaceVariables(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  private shouldSendNotification(payload: NotificationPayload, preferences: NotificationPreferences): boolean {
    if (!preferences.categories[payload.type as keyof typeof preferences.categories]) {
      return false;
    }

    if (preferences.quietHours.enabled) {
      const now = new Date();
      const start = new Date(`${now.toDateString()} ${preferences.quietHours.start}`);
      const end = new Date(`${now.toDateString()} ${preferences.quietHours.end}`);
      
      if (now >= start && now <= end) {
        return payload.priority === 'urgent';
      }
    }

    return true;
  }

  private getDefaultChannels(preferences: NotificationPreferences, type: string): Array<'email' | 'push' | 'sms' | 'inApp'> {
    const channels: Array<'email' | 'push' | 'sms' | 'inApp'> = ['inApp'];
    
    if (preferences.push) channels.push('push');
    if (preferences.email && ['digest', 'systemUpdates'].includes(type)) channels.push('email');
    
    return channels;
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      email: true,
      push: true,
      sms: false,
      inApp: true,
      categories: {
        likes: true,
        comments: true,
        follows: true,
        mentions: true,
        reposts: true,
        messages: true,
        communityUpdates: true,
        systemUpdates: true,
        marketing: false
      },
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      }
    };
  }

  private generateEmailHTML(payload: NotificationPayload, displayName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${payload.title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a1a1a; color: white; padding: 20px; text-align: center;">
            <h1>Cirkel.io</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Hi ${displayName},</h2>
            <p>${payload.message}</p>
            <div style="margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                View on Cirkel.io
              </a>
            </div>
          </div>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>You received this email because you have notifications enabled.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">Manage your notification preferences</a></p>
          </div>
        </body>
      </html>
    `;
  }

  private groupNotificationsByType(notifications: any[]): Record<string, any> {
    const grouped = notifications.reduce((acc, notification) => {
      if (!acc[notification.type]) acc[notification.type] = [];
      acc[notification.type].push(notification);
      return acc;
    }, {});

    return {
      total: notifications.length,
      types: grouped,
      summary: Object.entries(grouped).map(([type, items]) => ({
        type,
        count: (items as any[]).length
      }))
    };
  }

  private async loadTemplates(): Promise<void> {
    const { data: templates } = await this.supabase
      .from('notification_templates')
      .select('*');

    templates?.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private async logNotification(payload: NotificationPayload): Promise<void> {
    await this.supabase
      .from('notification_logs')
      .insert({
        user_id: payload.userId,
        type: payload.type,
        title: payload.title,
        channels: payload.channels,
        priority: payload.priority,
        sent_at: new Date().toISOString()
      });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const notificationManager = new NotificationManager();