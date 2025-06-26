import React, { useState, useEffect } from 'react';
import { Play, Pause, Eye, Plus, Users, Mail, Calendar, Activity } from 'lucide-react';
import axios from 'axios';
import { Campaign } from '../types';
import { io as socketIOClient } from 'socket.io-client';
import { toast } from 'react-hot-toast';

interface CampaignManagerProps {
  user?: any;
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
}

const CampaignManager: React.FC<CampaignManagerProps> = ({ user, campaigns, setCampaigns }) => {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    templateId: '',
    targets: [] as string[],
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/campaigns', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setCampaigns(res.data))
      .catch(err => console.error('Failed to fetch campaigns', err));

    // Real-time updates
    const socket = socketIOClient('http://localhost:5000');
    socket.on('campaignCreated', (campaign) => {
      setCampaigns(prev => [campaign, ...prev]);
      toast.success(`New campaign created: ${campaign.name}`);
    });
    socket.on('emailStatus', ({ campaignId, email, status, error }) => {
      setCampaigns(prev => prev.map(c => {
        if (c.id === campaignId || c._id === campaignId) {
          const emailStatus = c.emailStatus ? [...c.emailStatus] : [];
          const idx = emailStatus.findIndex(e => e.email === email);
          if (idx !== -1) {
            emailStatus[idx] = { ...emailStatus[idx], status, error };
          } else {
            emailStatus.push({ email, status, error });
          }
          return { ...c, emailStatus };
        }
        return c;
      }));
      if (status === 'sent') {
        toast.success(`Email sent to ${email}`);
      } else if (status === 'failed') {
        toast.error(`Failed to send email to ${email}: ${error}`);
      }
    });
    socket.on('emailOpened', ({ campaignId, email, openCount }) => {
      setCampaigns(prev => prev.map(c => {
        if (c.id === campaignId || c._id === campaignId) {
          const emailStatus = c.emailStatus ? [...c.emailStatus] : [];
          const idx = emailStatus.findIndex(e => e.email === email);
          if (idx !== -1) {
            emailStatus[idx] = { ...emailStatus[idx], openCount };
          }
          return { ...c, emailStatus };
        }
        return c;
      }));
      toast(`Email opened by ${email} (${openCount}x)`);
    });
    socket.on('emailClicked', ({ campaignId, email, clickCount }) => {
      setCampaigns(prev => prev.map(c => {
        if (c.id === campaignId || c._id === campaignId) {
          const emailStatus = c.emailStatus ? [...c.emailStatus] : [];
          const idx = emailStatus.findIndex(e => e.email === email);
          if (idx !== -1) {
            emailStatus[idx] = { ...emailStatus[idx], clickCount };
          }
          return { ...c, emailStatus };
        }
        return c;
      }));
      toast(`Phishing link clicked by ${email} (${clickCount}x)`);
    });
    return () => { socket.disconnect(); };
  }, [setCampaigns]);

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateClickRate = (campaign: Campaign) => {
    return campaign.targetCount > 0 ? ((campaign.clickCount / campaign.targetCount) * 100).toFixed(1) : '0';
  };

  const calculateReportRate = (campaign: Campaign) => {
    return campaign.targetCount > 0 ? ((campaign.reportCount / campaign.targetCount) * 100).toFixed(1) : '0';
  };

  const handlePauseResume = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: c.status === 'active' ? 'paused' : c.status === 'paused' ? 'active' : c.status,
            }
          : c
      )
    );
    // TODO: Update backend with new status
  };

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    // For demo, use first template and all employees (replace with real selection later)
    const template = { name: 'Default', subject: '', sender: '', content: '', type: 'credential_harvest', difficulty: 'easy', indicators: [] };
    const targets: any[] = [];
    const newCampaignData = {
      name: newCampaign.name,
      description: newCampaign.description,
      status: 'draft',
      createdAt: new Date().toISOString(),
      targetCount: targets.length,
      clickCount: 0,
      reportCount: 0,
      template,
      targets,
    };
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/campaigns', newCampaignData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns((prev) => [res.data, ...prev]);
      setShowNewCampaignModal(false);
      setNewCampaign({ name: '', description: '', templateId: '', targets: [] });
    } catch (err) {
      alert('Failed to create campaign');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Management</h1>
          <p className="text-gray-600">Create and monitor phishing awareness campaigns</p>
        </div>
        {user?.role === 'admin' && (
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors" onClick={() => setShowNewCampaignModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </button>
        )}
      </div>

      {!selectedCampaign ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Users className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">Targets</p>
                  <p className="text-lg font-semibold text-gray-900">{campaign.targetCount}</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <Activity className="h-5 w-5 text-red-600 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">Click Rate</p>
                  <p className="text-lg font-semibold text-red-600">{calculateClickRate(campaign)}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Mail className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">Reported</p>
                  <p className="text-lg font-semibold text-green-600">{campaign.reportCount}</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-sm font-medium text-blue-600">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedCampaign(campaign)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </button>
                {campaign.status === 'active' ? (
                  <button onClick={() => handlePauseResume(campaign.id)} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </button>
                ) : campaign.status === 'paused' ? (
                  <button onClick={() => handlePauseResume(campaign.id)} className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{selectedCampaign.name}</h2>
            <button
              onClick={() => setSelectedCampaign(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Campaigns
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Target Results</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedCampaign.targets.map((employee) => {
                      const emailInfo = selectedCampaign.emailStatus?.find(e => e.email === employee.email);
                      return (
                        <tr key={employee.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                              <div className="text-sm text-gray-500">{employee.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {employee.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {employee.clicked ? (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                Clicked
                              </span>
                            ) : employee.reported ? (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                Reported
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                No Action
                              </span>
                            )}
                            {emailInfo && (
                              <div className="mt-1 text-xs">
                                <span className={`inline-block px-2 py-1 rounded ${emailInfo.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{emailInfo.status}</span>
                                {emailInfo.error && <span className="ml-2 text-red-600">{emailInfo.error}</span>}
                                {typeof emailInfo.openCount === 'number' && (
                                  <span className="ml-2">Opens: {emailInfo.openCount}</span>
                                )}
                                {typeof emailInfo.clickCount === 'number' && (
                                  <span className="ml-2">Clicks: {emailInfo.clickCount}</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              employee.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                              employee.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {employee.riskLevel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Summary</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700">Template Used</h4>
                  <p className="text-sm text-gray-900 mt-1">{selectedCampaign.template.name}</p>
                  <p className="text-xs text-gray-600 mt-1">Difficulty: {selectedCampaign.template.difficulty}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="text-sm font-medium text-red-700">Click Rate</h4>
                  <p className="text-2xl font-bold text-red-900">{calculateClickRate(selectedCampaign)}%</p>
                  <p className="text-xs text-red-600">{selectedCampaign.clickCount} of {selectedCampaign.targetCount} clicked</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="text-sm font-medium text-green-700">Report Rate</h4>
                  <p className="text-2xl font-bold text-green-900">{calculateReportRate(selectedCampaign)}%</p>
                  <p className="text-xs text-green-600">{selectedCampaign.reportCount} of {selectedCampaign.targetCount} reported</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for New Campaign */}
      {showNewCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Campaign</h2>
            <form onSubmit={handleAddCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" required className="w-full border border-gray-300 rounded px-3 py-2" value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea required className="w-full border border-gray-300 rounded px-3 py-2" value={newCampaign.description} onChange={e => setNewCampaign({ ...newCampaign, description: e.target.value })} />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={() => setShowNewCampaignModal(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManager;