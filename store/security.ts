import { create } from 'zustand';
import { EncryptionKey, ZKProof, ThreatDetection, ComplianceRule } from '@/types/web3';

interface SecurityState {
  encryptionKeys: EncryptionKey[];
  zkProofs: ZKProof[];
  threats: ThreatDetection[];
  complianceRules: ComplianceRule[];
  securityScore: number;
  
  // Actions
  generateEncryptionKey: (algorithm: string, keySize: number) => Promise<void>;
  encryptMessage: (message: string, recipientId: string) => Promise<string>;
  decryptMessage: (encryptedMessage: string, keyId: string) => Promise<string>;
  createZKProof: (claim: string, evidence: any) => Promise<void>;
  verifyZKProof: (proofId: string) => Promise<boolean>;
  scanForThreats: () => Promise<void>;
  mitigateThreat: (threatId: string, actions: string[]) => Promise<void>;
  setupCompliance: (regulation: string, requirements: any) => Promise<void>;
  auditCompliance: (ruleId: string) => Promise<any>;
  enableE2EEncryption: (conversationId: string) => Promise<void>;
  setupZKAuth: (userId: string) => Promise<void>;
  detectAnomalies: (userId: string) => Promise<any>;
  generateSecurityReport: () => Promise<any>;
  setupDataRetention: (dataType: string, period: number) => Promise<void>;
  anonymizeData: (dataId: string) => Promise<void>;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  encryptionKeys: [],
  zkProofs: [],
  threats: [],
  complianceRules: [],
  securityScore: 0,

  generateEncryptionKey: async (algorithm, keySize) => {
    try {
      const response = await fetch('/api/security/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm, keySize })
      });
      const key = await response.json();
      set(state => ({ encryptionKeys: [...state.encryptionKeys, key] }));
    } catch (error) {
      console.error('Failed to generate encryption key:', error);
    }
  },

  encryptMessage: async (message, recipientId) => {
    try {
      const response = await fetch('/api/security/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, recipientId })
      });
      const { encryptedMessage } = await response.json();
      return encryptedMessage;
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      return '';
    }
  },

  decryptMessage: async (encryptedMessage, keyId) => {
    try {
      const response = await fetch('/api/security/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedMessage, keyId })
      });
      const { message } = await response.json();
      return message;
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      return '';
    }
  },

  createZKProof: async (claim, evidence) => {
    try {
      const response = await fetch('/api/security/zk-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim, evidence })
      });
      const proof = await response.json();
      set(state => ({ zkProofs: [...state.zkProofs, proof] }));
    } catch (error) {
      console.error('Failed to create ZK proof:', error);
    }
  },

  verifyZKProof: async (proofId) => {
    try {
      const response = await fetch(`/api/security/zk-proof/${proofId}/verify`, {
        method: 'POST'
      });
      const { isValid } = await response.json();
      return isValid;
    } catch (error) {
      console.error('Failed to verify ZK proof:', error);
      return false;
    }
  },

  scanForThreats: async () => {
    try {
      const response = await fetch('/api/security/threats/scan', {
        method: 'POST'
      });
      const threats = await response.json();
      set({ threats });
    } catch (error) {
      console.error('Failed to scan for threats:', error);
    }
  },

  mitigateThreat: async (threatId, actions) => {
    try {
      await fetch(`/api/security/threats/${threatId}/mitigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions })
      });
      set(state => ({
        threats: state.threats.map(t => 
          t.id === threatId ? { ...t, mitigated: true, mitigationActions: actions } : t
        )
      }));
    } catch (error) {
      console.error('Failed to mitigate threat:', error);
    }
  },

  setupCompliance: async (regulation, requirements) => {
    try {
      const response = await fetch('/api/security/compliance/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regulation, requirements })
      });
      const rule = await response.json();
      set(state => ({ complianceRules: [...state.complianceRules, rule] }));
    } catch (error) {
      console.error('Failed to setup compliance:', error);
    }
  },

  auditCompliance: async (ruleId) => {
    try {
      const response = await fetch(`/api/security/compliance/${ruleId}/audit`, {
        method: 'POST'
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to audit compliance:', error);
      return null;
    }
  },

  enableE2EEncryption: async (conversationId) => {
    try {
      await fetch(`/api/security/e2e/${conversationId}/enable`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to enable E2E encryption:', error);
    }
  },

  setupZKAuth: async (userId) => {
    try {
      const response = await fetch(`/api/security/zk-auth/${userId}/setup`, {
        method: 'POST'
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to setup ZK auth:', error);
      return null;
    }
  },

  detectAnomalies: async (userId) => {
    try {
      const response = await fetch(`/api/security/anomalies/${userId}`, {
        method: 'GET'
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to detect anomalies:', error);
      return null;
    }
  },

  generateSecurityReport: async () => {
    try {
      const response = await fetch('/api/security/report', {
        method: 'GET'
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to generate security report:', error);
      return null;
    }
  },

  setupDataRetention: async (dataType, period) => {
    try {
      await fetch('/api/security/data-retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataType, period })
      });
    } catch (error) {
      console.error('Failed to setup data retention:', error);
    }
  },

  anonymizeData: async (dataId) => {
    try {
      await fetch(`/api/security/anonymize/${dataId}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to anonymize data:', error);
    }
  }
}));