import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

export interface CRMContact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  socialProfiles: {
    cirkel?: string;
    twitter?: string;
    linkedin?: string;
  };
  tags: string[];
  customFields: Record<string, any>;
  lastActivity: string;
  leadScore: number;
}

export interface CRMIntegration {
  id: string;
  name: string;
  type: 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho' | 'custom';
  credentials: Record<string, string>;
  mappings: Record<string, string>;
  syncEnabled: boolean;
  lastSync: string;
}

export class CRMIntegrationService {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  private integrations = new Map<string, CRMIntegration>();

  async setupIntegration(
    userId: string,
    type: CRMIntegration['type'],
    credentials: Record<string, string>,
    mappings: Record<string, string>
  ): Promise<string> {
    const integration: CRMIntegration = {
      id: `crm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Integration`,
      type,
      credentials: this.encryptCredentials(credentials),
      mappings,
      syncEnabled: true,
      lastSync: new Date().toISOString()
    };

    const { data } = await this.supabase
      .from('crm_integrations')
      .insert({
        id: integration.id,
        user_id: userId,
        ...integration,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    this.integrations.set(integration.id, integration);
    return integration.id;
  }

  async syncContacts(integrationId: string): Promise<{ synced: number; errors: string[] }> {
    const integration = await this.getIntegration(integrationId);
    if (!integration) throw new Error('Integration not found');

    const errors: string[] = [];
    let synced = 0;

    try {
      const contacts = await this.fetchContactsFromCRM(integration);
      
      for (const contact of contacts) {
        try {
          await this.syncContact(contact, integration);
          synced++;
        } catch (error) {
          errors.push(`Failed to sync ${contact.email}: ${error}`);
        }
      }

      await this.supabase
        .from('crm_integrations')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', integrationId);

    } catch (error) {
      errors.push(`CRM sync failed: ${error}`);
    }

    return { synced, errors };
  }

  async createLead(
    integrationId: string,
    leadData: {
      email: string;
      firstName: string;
      lastName: string;
      company?: string;
      source: string;
      socialActivity: any[];
    }
  ): Promise<string> {
    const integration = await this.getIntegration(integrationId);
    if (!integration) throw new Error('Integration not found');

    const leadScore = this.calculateLeadScore(leadData.socialActivity);
    
    const crmLeadId = await this.createLeadInCRM(integration, {
      ...leadData,
      leadScore,
      customFields: {
        cirkel_activity_score: leadScore,
        social_engagement: leadData.socialActivity.length,
        source_platform: 'cirkel.io'
      }
    });

    // Store locally
    await this.supabase
      .from('crm_leads')
      .insert({
        integration_id: integrationId,
        crm_lead_id: crmLeadId,
        email: leadData.email,
        first_name: leadData.firstName,
        last_name: leadData.lastName,
        company: leadData.company,
        lead_score: leadScore,
        source: leadData.source,
        social_activity: leadData.socialActivity,
        created_at: new Date().toISOString()
      });

    return crmLeadId;
  }

  async updateContactActivity(
    email: string,
    activity: {
      type: 'post' | 'like' | 'comment' | 'share' | 'follow';
      content?: string;
      timestamp: string;
      engagement: number;
    }
  ): Promise<void> {
    const integrations = await this.getActiveIntegrations();
    
    for (const integration of integrations) {
      try {
        const contact = await this.findContactInCRM(integration, email);
        if (contact) {
          await this.updateCRMContactActivity(integration, contact.id, activity);
        }
      } catch (error) {
        console.error(`Failed to update activity for ${email} in ${integration.type}:`, error);
      }
    }
  }

  async generateLeadReport(integrationId: string, dateRange: { start: string; end: string }): Promise<any> {
    const { data: leads } = await this.supabase
      .from('crm_leads')
      .select('*')
      .eq('integration_id', integrationId)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    const totalLeads = leads?.length || 0;
    const avgLeadScore = leads?.reduce((sum, lead) => sum + lead.lead_score, 0) / totalLeads || 0;
    const sourceBreakdown = this.groupBy(leads || [], 'source');
    const companyBreakdown = this.groupBy(leads || [], 'company');

    return {
      totalLeads,
      avgLeadScore,
      sourceBreakdown,
      companyBreakdown,
      timeline: this.generateTimeline(leads || [], dateRange)
    };
  }

  async setupAutomation(
    integrationId: string,
    automation: {
      name: string;
      trigger: 'new_follower' | 'high_engagement' | 'mention' | 'custom';
      conditions: Record<string, any>;
      actions: Array<{
        type: 'create_lead' | 'update_contact' | 'send_email' | 'add_to_campaign';
        parameters: Record<string, any>;
      }>;
    }
  ): Promise<string> {
    const { data } = await this.supabase
      .from('crm_automations')
      .insert({
        integration_id: integrationId,
        name: automation.name,
        trigger: automation.trigger,
        conditions: automation.conditions,
        actions: automation.actions,
        enabled: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    return data.id;
  }

  async executeAutomation(automationId: string, triggerData: any): Promise<void> {
    const { data: automation } = await this.supabase
      .from('crm_automations')
      .select('*')
      .eq('id', automationId)
      .eq('enabled', true)
      .single();

    if (!automation) return;

    const conditionsMet = this.evaluateConditions(automation.conditions, triggerData);
    if (!conditionsMet) return;

    for (const action of automation.actions) {
      try {
        await this.executeAction(automation.integration_id, action, triggerData);
      } catch (error) {
        console.error(`Automation action failed:`, error);
      }
    }

    // Log execution
    await this.supabase
      .from('crm_automation_logs')
      .insert({
        automation_id: automationId,
        trigger_data: triggerData,
        executed_at: new Date().toISOString()
      });
  }

  private async fetchContactsFromCRM(integration: CRMIntegration): Promise<CRMContact[]> {
    const credentials = this.decryptCredentials(integration.credentials);
    
    switch (integration.type) {
      case 'salesforce':
        return this.fetchSalesforceContacts(credentials);
      case 'hubspot':
        return this.fetchHubSpotContacts(credentials);
      case 'pipedrive':
        return this.fetchPipedriveContacts(credentials);
      case 'zoho':
        return this.fetchZohoContacts(credentials);
      default:
        throw new Error(`Unsupported CRM type: ${integration.type}`);
    }
  }

  private async fetchHubSpotContacts(credentials: Record<string, string>): Promise<CRMContact[]> {
    const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        properties: 'email,firstname,lastname,company,phone,hs_lead_status',
        limit: 100
      }
    });

    return response.data.results.map((contact: any) => ({
      id: contact.id,
      email: contact.properties.email,
      firstName: contact.properties.firstname,
      lastName: contact.properties.lastname,
      company: contact.properties.company,
      phone: contact.properties.phone,
      socialProfiles: {},
      tags: [],
      customFields: contact.properties,
      lastActivity: contact.updatedAt,
      leadScore: 0
    }));
  }

  private async fetchSalesforceContacts(credentials: Record<string, string>): Promise<CRMContact[]> {
    const response = await axios.get(`${credentials.instanceUrl}/services/data/v58.0/query`, {
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        q: 'SELECT Id, Email, FirstName, LastName, Company, Phone FROM Contact LIMIT 100'
      }
    });

    return response.data.records.map((contact: any) => ({
      id: contact.Id,
      email: contact.Email,
      firstName: contact.FirstName,
      lastName: contact.LastName,
      company: contact.Company,
      phone: contact.Phone,
      socialProfiles: {},
      tags: [],
      customFields: {},
      lastActivity: new Date().toISOString(),
      leadScore: 0
    }));
  }

  private async fetchPipedriveContacts(credentials: Record<string, string>): Promise<CRMContact[]> {
    const response = await axios.get('https://api.pipedrive.com/v1/persons', {
      params: {
        api_token: credentials.apiToken,
        limit: 100
      }
    });

    return response.data.data.map((contact: any) => ({
      id: contact.id.toString(),
      email: contact.primary_email,
      firstName: contact.first_name,
      lastName: contact.last_name,
      company: contact.org_name,
      phone: contact.phone?.[0]?.value,
      socialProfiles: {},
      tags: [],
      customFields: {},
      lastActivity: contact.update_time,
      leadScore: 0
    }));
  }

  private async fetchZohoContacts(credentials: Record<string, string>): Promise<CRMContact[]> {
    const response = await axios.get('https://www.zohoapis.com/crm/v2/Contacts', {
      headers: {
        'Authorization': `Zoho-oauthtoken ${credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        per_page: 100
      }
    });

    return response.data.data.map((contact: any) => ({
      id: contact.id,
      email: contact.Email,
      firstName: contact.First_Name,
      lastName: contact.Last_Name,
      company: contact.Account_Name,
      phone: contact.Phone,
      socialProfiles: {},
      tags: [],
      customFields: {},
      lastActivity: contact.Modified_Time,
      leadScore: 0
    }));
  }

  private calculateLeadScore(socialActivity: any[]): number {
    let score = 0;
    
    socialActivity.forEach(activity => {
      switch (activity.type) {
        case 'post':
          score += 10;
          break;
        case 'like':
          score += 2;
          break;
        case 'comment':
          score += 5;
          break;
        case 'share':
          score += 8;
          break;
        case 'follow':
          score += 15;
          break;
      }
      
      score += activity.engagement || 0;
    });

    return Math.min(100, score);
  }

  private async getIntegration(integrationId: string): Promise<CRMIntegration | null> {
    if (this.integrations.has(integrationId)) {
      return this.integrations.get(integrationId)!;
    }

    const { data } = await this.supabase
      .from('crm_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (data) {
      this.integrations.set(integrationId, data);
      return data;
    }

    return null;
  }

  private async getActiveIntegrations(): Promise<CRMIntegration[]> {
    const { data } = await this.supabase
      .from('crm_integrations')
      .select('*')
      .eq('sync_enabled', true);

    return data || [];
  }

  private encryptCredentials(credentials: Record<string, string>): Record<string, string> {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const secretKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    
    const encrypted: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(credentials)) {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, secretKey);
      cipher.setAAD(Buffer.from(key));
      
      let encryptedValue = cipher.update(value, 'utf8', 'hex');
      encryptedValue += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      encrypted[key] = `${iv.toString('hex')}:${authTag.toString('hex')}:${encryptedValue}`;
    }
    
    return encrypted;
  }

  private decryptCredentials(credentials: Record<string, string>): Record<string, string> {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const secretKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    
    const decrypted: Record<string, string> = {};
    
    for (const [key, encryptedValue] of Object.entries(credentials)) {
      try {
        const [ivHex, authTagHex, encrypted] = encryptedValue.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        
        const decipher = crypto.createDecipher(algorithm, secretKey);
        decipher.setAAD(Buffer.from(key));
        decipher.setAuthTag(authTag);
        
        let decryptedValue = decipher.update(encrypted, 'hex', 'utf8');
        decryptedValue += decipher.final('utf8');
        
        decrypted[key] = decryptedValue;
      } catch (error) {
        console.error(`Failed to decrypt credential ${key}:`, error);
        decrypted[key] = encryptedValue; // Fallback to original if decryption fails
      }
    }
    
    return decrypted;
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = item[key] || 'Unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private generateTimeline(leads: any[], dateRange: { start: string; end: string }): any[] {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const timeline = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayLeads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate.toDateString() === date.toDateString();
      });
      
      timeline.push({
        date: date.toISOString().split('T')[0],
        count: dayLeads.length,
        avgScore: dayLeads.reduce((sum, lead) => sum + lead.lead_score, 0) / dayLeads.length || 0
      });
    }
    
    return timeline;
  }

  private evaluateConditions(conditions: Record<string, any>, triggerData: any): boolean {
    for (const [key, condition] of Object.entries(conditions)) {
      const value = this.getNestedValue(triggerData, key);
      
      if (condition.operator === 'equals' && value !== condition.value) return false;
      if (condition.operator === 'greater_than' && value <= condition.value) return false;
      if (condition.operator === 'less_than' && value >= condition.value) return false;
      if (condition.operator === 'contains' && !value?.toString().includes(condition.value)) return false;
      if (condition.operator === 'not_equals' && value === condition.value) return false;
      if (condition.operator === 'in' && !condition.value.includes(value)) return false;
    }
    
    return true;
  }

  private async executeAction(integrationId: string, action: any, triggerData: any): Promise<void> {
    const integration = await this.getIntegration(integrationId);
    if (!integration) return;
    
    switch (action.type) {
      case 'create_lead':
        await this.createLeadInCRM(integration, {
          email: triggerData.email,
          firstName: triggerData.firstName,
          lastName: triggerData.lastName,
          company: triggerData.company,
          leadScore: triggerData.leadScore || 0,
          customFields: action.parameters.customFields || {}
        });
        break;
        
      case 'update_contact':
        const contact = await this.findContactInCRM(integration, triggerData.email);
        if (contact) {
          await this.updateContactInCRM(integration, contact.id, action.parameters.updates);
        }
        break;
        
      case 'send_email':
        await this.sendEmailThroughCRM(integration, triggerData.email, action.parameters);
        break;
        
      case 'add_to_campaign':
        await this.addToCampaign(integration, triggerData.email, action.parameters.campaignId);
        break;
    }
  }

  private async syncContact(contact: CRMContact, integration: CRMIntegration): Promise<void> {
    const { data: existingContact } = await this.supabase
      .from('crm_contacts')
      .select('*')
      .eq('integration_id', integration.id)
      .eq('email', contact.email)
      .single();
    
    const contactData = {
      integration_id: integration.id,
      crm_contact_id: contact.id,
      email: contact.email,
      first_name: contact.firstName,
      last_name: contact.lastName,
      company: contact.company,
      phone: contact.phone,
      social_profiles: contact.socialProfiles,
      tags: contact.tags,
      custom_fields: contact.customFields,
      lead_score: contact.leadScore,
      last_activity: contact.lastActivity,
      updated_at: new Date().toISOString()
    };
    
    if (existingContact) {
      await this.supabase
        .from('crm_contacts')
        .update(contactData)
        .eq('id', existingContact.id);
    } else {
      await this.supabase
        .from('crm_contacts')
        .insert({ ...contactData, created_at: new Date().toISOString() });
    }
  }

  private async createLeadInCRM(integration: CRMIntegration, leadData: any): Promise<string> {
    const credentials = this.decryptCredentials(integration.credentials);
    
    switch (integration.type) {
      case 'hubspot':
        const hubspotResponse = await axios.post('https://api.hubapi.com/crm/v3/objects/contacts', {
          properties: {
            email: leadData.email,
            firstname: leadData.firstName,
            lastname: leadData.lastName,
            company: leadData.company,
            hs_lead_status: 'NEW',
            cirkel_lead_score: leadData.leadScore.toString(),
            ...leadData.customFields
          }
        }, {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        return hubspotResponse.data.id;
        
      case 'salesforce':
        const salesforceResponse = await axios.post(`${credentials.instanceUrl}/services/data/v58.0/sobjects/Lead`, {
          Email: leadData.email,
          FirstName: leadData.firstName,
          LastName: leadData.lastName,
          Company: leadData.company || 'Unknown',
          Status: 'Open - Not Contacted',
          LeadSource: 'Cirkel.io',
          Cirkel_Lead_Score__c: leadData.leadScore
        }, {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        return salesforceResponse.data.id;
        
      case 'pipedrive':
        const pipedriveResponse = await axios.post('https://api.pipedrive.com/v1/persons', {
          name: `${leadData.firstName} ${leadData.lastName}`,
          email: [{ value: leadData.email, primary: true }],
          org_name: leadData.company,
          'custom_fields.cirkel_score': leadData.leadScore
        }, {
          params: { api_token: credentials.apiToken }
        });
        return pipedriveResponse.data.data.id.toString();
        
      default:
        throw new Error(`Lead creation not implemented for ${integration.type}`);
    }
  }

  private async findContactInCRM(integration: CRMIntegration, email: string): Promise<any> {
    const credentials = this.decryptCredentials(integration.credentials);
    
    switch (integration.type) {
      case 'hubspot':
        try {
          const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts/search', {
            headers: {
              'Authorization': `Bearer ${credentials.accessToken}`,
              'Content-Type': 'application/json'
            },
            data: {
              filterGroups: [{
                filters: [{
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email
                }]
              }]
            }
          });
          return response.data.results[0] || null;
        } catch {
          return null;
        }
        
      case 'salesforce':
        try {
          const response = await axios.get(`${credentials.instanceUrl}/services/data/v58.0/query`, {
            headers: {
              'Authorization': `Bearer ${credentials.accessToken}`
            },
            params: {
              q: `SELECT Id, Email FROM Contact WHERE Email = '${email}' LIMIT 1`
            }
          });
          return response.data.records[0] || null;
        } catch {
          return null;
        }
        
      default:
        return null;
    }
  }

  private async updateCRMContactActivity(integration: CRMIntegration, contactId: string, activity: any): Promise<void> {
    const credentials = this.decryptCredentials(integration.credentials);
    const activityNote = `Cirkel.io Activity: ${activity.type} - ${activity.content || ''} (Engagement: ${activity.engagement})`;
    
    switch (integration.type) {
      case 'hubspot':
        await axios.post(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/notes`, {
          properties: {
            hs_note_body: activityNote,
            hs_timestamp: new Date(activity.timestamp).getTime()
          }
        }, {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        break;
        
      case 'salesforce':
        await axios.post(`${credentials.instanceUrl}/services/data/v58.0/sobjects/Task`, {
          WhoId: contactId,
          Subject: `Cirkel.io ${activity.type}`,
          Description: activityNote,
          ActivityDate: activity.timestamp.split('T')[0],
          Status: 'Completed'
        }, {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        break;
    }
  }

  private async updateContactInCRM(integration: CRMIntegration, contactId: string, updates: Record<string, any>): Promise<void> {
    const credentials = this.decryptCredentials(integration.credentials);
    
    switch (integration.type) {
      case 'hubspot':
        await axios.patch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
          properties: updates
        }, {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        break;
        
      case 'salesforce':
        await axios.patch(`${credentials.instanceUrl}/services/data/v58.0/sobjects/Contact/${contactId}`, updates, {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        break;
    }
  }

  private async sendEmailThroughCRM(integration: CRMIntegration, email: string, parameters: any): Promise<void> {
    console.log(`Sending email through ${integration.type} to ${email}`);
  }

  private async addToCampaign(integration: CRMIntegration, email: string, campaignId: string): Promise<void> {
    console.log(`Adding ${email} to campaign ${campaignId} in ${integration.type}`);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

export const crmIntegrationService = new CRMIntegrationService();