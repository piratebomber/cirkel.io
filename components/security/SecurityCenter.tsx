'use client';

import { useState, useEffect } from 'react';
import { useSecurityStore } from '@/store/security';

export default function SecurityCenter() {
  const {
    encryptionKeys,
    zkProofs,
    threats,
    complianceRules,
    securityScore,
    generateEncryptionKey,
    encryptMessage,
    decryptMessage,
    createZKProof,
    verifyZKProof,
    scanForThreats,
    mitigateThreat,
    setupCompliance,
    auditCompliance,
    enableE2EEncryption,
    setupZKAuth,
    detectAnomalies,
    generateSecurityReport
  } = useSecurityStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [encryptionData, setEncryptionData] = useState({
    algorithm: 'RSA' as 'RSA' | 'ECDSA' | 'Ed25519',
    keySize: 2048
  });
  const [messageData, setMessageData] = useState({
    message: '',
    recipientId: '',
    encrypted: ''
  });
  const [zkData, setZkData] = useState({
    claim: '',
    evidence: ''
  });
  const [complianceData, setComplianceData] = useState({
    regulation: 'GDPR' as 'GDPR' | 'CCPA' | 'COPPA' | 'HIPAA' | 'SOX' | 'PCI_DSS',
    requirements: ''
  });

  useEffect(() => {
    scanForThreats();
  }, []);

  const handleGenerateKey = async () => {
    await generateEncryptionKey(encryptionData.algorithm, encryptionData.keySize);
    setShowCreateModal(false);
  };

  const handleEncryptMessage = async () => {
    const encrypted = await encryptMessage(messageData.message, messageData.recipientId);
    setMessageData({ ...messageData, encrypted });
  };

  const handleCreateZKProof = async () => {
    await createZKProof(zkData.claim, { evidence: zkData.evidence });
    setZkData({ claim: '', evidence: '' });
  };

  const handleSetupCompliance = async () => {
    await setupCompliance(complianceData.regulation, { requirements: complianceData.requirements });
    setComplianceData({ regulation: 'GDPR', requirements: '' });
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getThreatSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Security Center</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Security Tools
          </button>
          <button
            onClick={() => generateSecurityReport()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Security Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Security Score</p>
              <p className={`text-3xl font-bold px-3 py-1 rounded ${getSecurityScoreColor(securityScore)}`}>
                {securityScore}/100
              </p>
            </div>
            <div className="text-4xl">🛡️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Threats</p>
              <p className="text-3xl font-bold text-red-600">
                {threats.filter(t => !t.mitigated).length}
              </p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Encryption Keys</p>
              <p className="text-3xl font-bold text-blue-600">{encryptionKeys.length}</p>
            </div>
            <div className="text-4xl">🔐</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">ZK Proofs</p>
              <p className="text-3xl font-bold text-purple-600">{zkProofs.length}</p>
            </div>
            <div className="text-4xl">🔒</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'encryption', label: 'Encryption' },
          { id: 'threats', label: 'Threats' },
          { id: 'compliance', label: 'Compliance' },
          { id: 'zkauth', label: 'Zero Knowledge' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Security Status</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">End-to-End Encryption</span>
                <span className="text-green-600 font-semibold">✅ Enabled</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Two-Factor Authentication</span>
                <span className="text-green-600 font-semibold">✅ Enabled</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Zero-Knowledge Auth</span>
                <span className="text-blue-600 font-semibold">🔄 Available</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Threat Detection</span>
                <span className="text-green-600 font-semibold">✅ Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Compliance Monitoring</span>
                <span className="text-green-600 font-semibold">✅ Active</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => setupZKAuth('current-user')}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
              >
                Setup Zero-Knowledge Authentication
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Security Events</h3>
            
            <div className="space-y-3">
              {threats.slice(0, 5).map((threat) => (
                <div key={threat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium">{threat.type}</div>
                    <div className="text-sm text-gray-600">{threat.description}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(threat.detectedAt).toLocaleString()}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getThreatSeverityColor(threat.severity)}`}>
                    {threat.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'encryption' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Message Encryption</h3>
            
            <div className="space-y-4">
              <textarea
                placeholder="Enter message to encrypt..."
                value={messageData.message}
                onChange={(e) => setMessageData({...messageData, message: e.target.value})}
                className="w-full p-3 border rounded-lg h-24"
              />
              
              <input
                type="text"
                placeholder="Recipient ID"
                value={messageData.recipientId}
                onChange={(e) => setMessageData({...messageData, recipientId: e.target.value})}
                className="w-full p-3 border rounded-lg"
              />
              
              <button
                onClick={handleEncryptMessage}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Encrypt Message
              </button>
              
              {messageData.encrypted && (
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm font-medium text-gray-700 mb-2">Encrypted Message:</div>
                  <div className="text-xs font-mono break-all">{messageData.encrypted}</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Encryption Keys</h3>
            
            <div className="space-y-3 mb-4">
              {encryptionKeys.map((key) => (
                <div key={key.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{key.algorithm}</div>
                      <div className="text-sm text-gray-600">{key.keySize} bits</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Generate New Key
            </button>
          </div>
        </div>
      )}

      {activeTab === 'threats' && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Threat Detection</h3>
              <button
                onClick={() => scanForThreats()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Scan Now
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Threat Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {threats.map((threat) => (
                  <tr key={threat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 capitalize">{threat.type}</div>
                        <div className="text-sm text-gray-500">{threat.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getThreatSeverityColor(threat.severity)}`}>
                        {threat.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {threat.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${
                        threat.mitigated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {threat.mitigated ? 'Mitigated' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!threat.mitigated && (
                        <button
                          onClick={() => mitigateThreat(threat.id, ['block', 'quarantine'])}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Mitigate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Compliance Rules</h3>
            
            <div className="space-y-3 mb-4">
              {complianceRules.map((rule) => (
                <div key={rule.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">{rule.regulation}</div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      rule.status === 'compliant' ? 'bg-green-100 text-green-800' :
                      rule.status === 'non_compliant' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rule.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{rule.requirement}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last audit: {new Date(rule.lastAudit).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <select
                value={complianceData.regulation}
                onChange={(e) => setComplianceData({...complianceData, regulation: e.target.value as any})}
                className="w-full p-3 border rounded-lg"
              >
                <option value="GDPR">GDPR</option>
                <option value="CCPA">CCPA</option>
                <option value="COPPA">COPPA</option>
                <option value="HIPAA">HIPAA</option>
                <option value="SOX">SOX</option>
                <option value="PCI_DSS">PCI DSS</option>
              </select>
              
              <textarea
                placeholder="Compliance requirements..."
                value={complianceData.requirements}
                onChange={(e) => setComplianceData({...complianceData, requirements: e.target.value})}
                className="w-full p-3 border rounded-lg h-24"
              />
              
              <button
                onClick={handleSetupCompliance}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Setup Compliance Rule
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Data Protection</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Data Retention</h4>
                <p className="text-sm text-blue-700">
                  Automatically delete or anonymize data based on retention policies
                </p>
                <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                  Configure Retention
                </button>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Data Anonymization</h4>
                <p className="text-sm text-green-700">
                  Remove personally identifiable information from datasets
                </p>
                <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                  Anonymize Data
                </button>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Audit Logs</h4>
                <p className="text-sm text-purple-700">
                  Track all data access and modifications for compliance
                </p>
                <button className="mt-2 bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700">
                  View Audit Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'zkauth' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Zero-Knowledge Proofs</h3>
            
            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Claim to prove"
                value={zkData.claim}
                onChange={(e) => setZkData({...zkData, claim: e.target.value})}
                className="w-full p-3 border rounded-lg"
              />
              
              <textarea
                placeholder="Evidence (will be kept private)"
                value={zkData.evidence}
                onChange={(e) => setZkData({...zkData, evidence: e.target.value})}
                className="w-full p-3 border rounded-lg h-24"
              />
              
              <button
                onClick={handleCreateZKProof}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
              >
                Create ZK Proof
              </button>
            </div>

            <div className="space-y-3">
              {zkProofs.map((proof) => (
                <div key={proof.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{proof.claim}</div>
                      <div className="text-sm text-gray-600">
                        Verifier: {proof.verifier}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        proof.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {proof.isValid ? 'Valid' : 'Invalid'}
                      </span>
                      <button
                        onClick={() => verifyZKProof(proof.id)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Privacy Features</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-medium text-indigo-900 mb-2">Anonymous Authentication</h4>
                <p className="text-sm text-indigo-700 mb-3">
                  Prove identity without revealing personal information
                </p>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
                  Enable Anonymous Auth
                </button>
              </div>

              <div className="p-4 bg-teal-50 rounded-lg">
                <h4 className="font-medium text-teal-900 mb-2">Private Messaging</h4>
                <p className="text-sm text-teal-700 mb-3">
                  End-to-end encrypted messages with zero-knowledge verification
                </p>
                <button
                  onClick={() => enableE2EEncryption('conversation-id')}
                  className="bg-teal-600 text-white px-4 py-2 rounded text-sm hover:bg-teal-700"
                >
                  Enable E2E Encryption
                </button>
              </div>

              <div className="p-4 bg-pink-50 rounded-lg">
                <h4 className="font-medium text-pink-900 mb-2">Selective Disclosure</h4>
                <p className="text-sm text-pink-700 mb-3">
                  Share only specific attributes without revealing full identity
                </p>
                <button className="bg-pink-600 text-white px-4 py-2 rounded text-sm hover:bg-pink-700">
                  Configure Disclosure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Generate Encryption Key</h2>
            
            <div className="space-y-4">
              <select
                value={encryptionData.algorithm}
                onChange={(e) => setEncryptionData({...encryptionData, algorithm: e.target.value as any})}
                className="w-full p-3 border rounded-lg"
              >
                <option value="RSA">RSA</option>
                <option value="ECDSA">ECDSA</option>
                <option value="Ed25519">Ed25519</option>
              </select>
              
              <select
                value={encryptionData.keySize}
                onChange={(e) => setEncryptionData({...encryptionData, keySize: Number(e.target.value)})}
                className="w-full p-3 border rounded-lg"
              >
                <option value={1024}>1024 bits</option>
                <option value={2048}>2048 bits</option>
                <option value={4096}>4096 bits</option>
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateKey}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
              >
                Generate Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}