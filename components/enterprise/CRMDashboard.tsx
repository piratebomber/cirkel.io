'use client';

import { useState, useEffect } from 'react';
import { useEnterpriseStore } from '@/store/enterprise';

export default function CRMDashboard() {
  const {
    leads,
    salesFunnels,
    crmIntegrations,
    workspaces,
    createLead,
    updateLeadStatus,
    assignLead,
    createSalesFunnel,
    setupCRMIntegration,
    generateLeadReport
  } = useEnterpriseStore();

  const [activeTab, setActiveTab] = useState('leads');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [leadData, setLeadData] = useState({
    source: 'post' as 'post' | 'message' | 'profile' | 'ad' | 'stream',
    contact: {
      name: '',
      email: '',
      phone: '',
      company: '',
      title: ''
    },
    tags: [] as string[],
    notes: [] as string[]
  });
  const [funnelData, setFunnelData] = useState({
    name: '',
    stages: [
      { name: 'Lead', description: 'New lead generated' },
      { name: 'Qualified', description: 'Lead has been qualified' },
      { name: 'Proposal', description: 'Proposal sent' },
      { name: 'Closed', description: 'Deal closed' }
    ]
  });

  const handleCreateLead = async () => {
    await createLead({
      ...leadData,
      score: 50,
      status: 'new'
    });
    setShowCreateModal(false);
    setLeadData({
      source: 'post',
      contact: { name: '', email: '', phone: '', company: '', title: '' },
      tags: [],
      notes: []
    });
  };

  const handleCreateFunnel = async () => {
    await createSalesFunnel({
      ...funnelData,
      stages: funnelData.stages.map((stage, index) => ({
        ...stage,
        id: `stage-${index}`,
        actions: [],
        conditions: {},
        conversionRate: 0
      })),
      automation: [],
      analytics: {
        totalLeads: 0,
        conversionRate: 0,
        averageTime: 0,
        dropoffPoints: [],
        revenue: 0
      },
      isActive: true,
      createdBy: 'current-user'
    });
    setShowCreateModal(false);
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">CRM Dashboard</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Create New
          </button>
          <button
            onClick={() => generateLeadReport({ startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate: new Date() })}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Leads</p>
              <p className="text-3xl font-bold text-blue-600">{leads.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Qualified Leads</p>
              <p className="text-3xl font-bold text-green-600">{getLeadsByStatus('qualified').length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Converted</p>
              <p className="text-3xl font-bold text-purple-600">{getLeadsByStatus('converted').length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Conversion Rate</p>
              <p className="text-3xl font-bold text-orange-600">
                {leads.length > 0 ? Math.round((getLeadsByStatus('converted').length / leads.length) * 100) : 0}%
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'leads', label: 'Leads' },
          { id: 'funnels', label: 'Sales Funnels' },
          { id: 'integrations', label: 'Integrations' },
          { id: 'workspaces', label: 'Workspaces' }
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
      {activeTab === 'leads' && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Lead Management</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
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
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{lead.contact.name}</div>
                        <div className="text-sm text-gray-500">{lead.contact.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.contact.company || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{lead.contact.title || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        lead.source === 'post' ? 'bg-blue-100 text-blue-800' :
                        lead.source === 'message' ? 'bg-green-100 text-green-800' :
                        lead.source === 'profile' ? 'bg-purple-100 text-purple-800' :
                        lead.source === 'ad' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {lead.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getLeadScoreColor(lead.score)}`}>
                        {lead.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => assignLead(lead.id, 'current-user')}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Assign
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        Contact
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'funnels' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {salesFunnels.map((funnel) => (
            <div key={funnel.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{funnel.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  funnel.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {funnel.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                {funnel.stages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium">{stage.name}</div>
                      <div className="text-xs text-gray-500">{stage.description}</div>
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      {stage.conversionRate.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 text-center text-sm border-t pt-4">
                <div>
                  <div className="font-semibold">{funnel.analytics.totalLeads}</div>
                  <div className="text-gray-500">Total Leads</div>
                </div>
                <div>
                  <div className="font-semibold">{funnel.analytics.conversionRate.toFixed(1)}%</div>
                  <div className="text-gray-500">Conversion</div>
                </div>
                <div>
                  <div className="font-semibold">${funnel.analytics.revenue.toLocaleString()}</div>
                  <div className="text-gray-500">Revenue</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {['salesforce', 'hubspot', 'pipedrive', 'zoho'].map((platform) => (
            <div key={platform} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold capitalize">{platform[0]}</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold capitalize">{platform}</h3>
                  <p className="text-sm text-gray-500">CRM Integration</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-red-600">Not Connected</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Sync:</span>
                  <span className="text-gray-500">Never</span>
                </div>
              </div>

              <button
                onClick={() => setupCRMIntegration(platform, {})}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Connect {platform}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Create New {activeTab === 'leads' ? 'Lead' : 'Sales Funnel'}
            </h2>
            
            {activeTab === 'leads' ? (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={leadData.contact.name}
                  onChange={(e) => setLeadData({
                    ...leadData,
                    contact: { ...leadData.contact, name: e.target.value }
                  })}
                  className="w-full p-3 border rounded-lg"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={leadData.contact.email}
                  onChange={(e) => setLeadData({
                    ...leadData,
                    contact: { ...leadData.contact, email: e.target.value }
                  })}
                  className="w-full p-3 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={leadData.contact.company}
                  onChange={(e) => setLeadData({
                    ...leadData,
                    contact: { ...leadData.contact, company: e.target.value }
                  })}
                  className="w-full p-3 border rounded-lg"
                />
                <select
                  value={leadData.source}
                  onChange={(e) => setLeadData({ ...leadData, source: e.target.value as any })}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="post">Post</option>
                  <option value="message">Message</option>
                  <option value="profile">Profile</option>
                  <option value="ad">Advertisement</option>
                  <option value="stream">Stream</option>
                </select>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Funnel Name"
                  value={funnelData.name}
                  onChange={(e) => setFunnelData({ ...funnelData, name: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stages:</label>
                  {funnelData.stages.map((stage, index) => (
                    <input
                      key={index}
                      type="text"
                      value={stage.name}
                      onChange={(e) => {
                        const newStages = [...funnelData.stages];
                        newStages[index] = { ...stage, name: e.target.value };
                        setFunnelData({ ...funnelData, stages: newStages });
                      }}
                      className="w-full p-2 border rounded"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={activeTab === 'leads' ? handleCreateLead : handleCreateFunnel}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}