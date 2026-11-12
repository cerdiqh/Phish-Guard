import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Eye, Plus, Users, Mail, Calendar, Activity, Upload, X, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { Campaign } from '../types';
import { io as socketIOClient } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const API_URL = () => (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

interface Target { email: string; name: string; department: string; }
interface TargetGroup { _id: string; name: string; targets: Target[]; }

interface CampaignManagerProps {
  user?: any;
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  onNotify?: (msg: string) => void;
}

const statusColor = (s: string) => {
  if (s === 'active') return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  if (s === 'completed') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
  if (s === 'paused') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

const CampaignManager: React.FC<CampaignManagerProps> = ({ user, campaigns, setCampaigns, onNotify }) => {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [targetGroups, setTargetGroups] = useState<TargetGroup[]>([]);
  const [form, setForm] = useState({ name: '', description: '', templateId: '', scheduledAt: '' });
  const [targets, setTargets] = useState<Target[]>([]);
  const [manualTarget, setManualTarget] = useState({ email: '', name: '', department: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    axios.get(`${API_URL()}/api/campaigns`, { headers: headers() })
      .then(r => setCampaigns(r.data))
      .catch(() => console.error('Failed to fetch campaigns'));

    axios.get(`${API_URL()}/api/templates`, { headers: headers() })
      .then(r => setTemplates(r.data))
      .catch(() => console.error('Failed to fetch templates'));

    axios.get(`${API_URL()}/api/target-groups`, { headers: headers() })
      .then(r => setTargetGroups(r.data))
      .catch(() => {});

    const socket = socketIOClient(API_URL());
    socket.on('campaignCreated', (campaign: any) => {
      setCampaigns(prev => [campaign, ...prev]);
      onNotify?.(`New campaign created: ${campaign.name}`);
    });
    socket.on('campaignUpdated', (campaign: any) => {
      setCampaigns(prev => prev.map(c => (c.id === campaign._id || c.id === campaign.id) ? { ...c, ...campaign } : c));
    });
    socket.on('emailStatus', ({ campaignId, email, status, error }: any) => {
      setCampaigns(prev => prev.map(c => {
        const id = (c as any)._id || c.id;
        if (id !== campaignId) return c;
        const emailStatus = c.emailStatus ? [...c.emailStatus] : [];
        const idx = emailStatus.findIndex(e => e.email === email);
        if (idx !== -1) emailStatus[idx] = { ...emailStatus[idx], status, error };
        else emailStatus.push({ email, status, error });
        return { ...c, emailStatus };
      }));
      if (status === 'sent') toast.success(`Email sent to ${email}`);
      else if (status === 'failed') toast.error(`Failed to send to ${email}: ${error}`);
    });
    socket.on('emailOpened', ({ campaignId, email, openCount }: any) => {
      setCampaigns(prev => prev.map(c => {
        const id = (c as any)._id || c.id;
        if (id !== campaignId) return c;
        const emailStatus = [...(c.emailStatus || [])];
        const idx = emailStatus.findIndex(e => e.email === email);
        if (idx !== -1) emailStatus[idx] = { ...emailStatus[idx], openCount };
        return { ...c, emailStatus };
      }));
      onNotify?.(`Email opened by ${email} (${openCount}x)`);
    });
    socket.on('emailClicked', ({ campaignId, email, clickCount }: any) => {
      setCampaigns(prev => prev.map(c => {
        const id = (c as any)._id || c.id;
        if (id !== campaignId) return c;
        const emailStatus = [...(c.emailStatus || [])];
        const idx = emailStatus.findIndex(e => e.email === email);
        if (idx !== -1) emailStatus[idx] = { ...emailStatus[idx], clickCount };
        return { ...c, emailStatus };
      }));
      onNotify?.(`Link clicked by ${email} (${clickCount}x)`);
    });
    return () => { socket.disconnect(); };
  }, []);

  const handlePauseResume = async (c: Campaign) => {
    const id = (c as any)._id || c.id;
    const newStatus = c.status === 'active' ? 'paused' : 'active';
    try {
      await axios.patch(`${API_URL()}/api/campaigns/${id}/status`, { status: newStatus }, { headers: headers() });
      setCampaigns(prev => prev.map(x => ((x as any)._id || x.id) === id ? { ...x, status: newStatus as any } : x));
    } catch {
      toast.error('Failed to update campaign status');
    }
  };

  const loadFromGroup = (group: TargetGroup) => {
    const newTargets = group.targets.filter(t => !targets.some(x => x.email === t.email));
    setTargets(prev => [...prev, ...newTargets]);
    toast.success(`Loaded ${newTargets.length} targets from "${group.name}"`);
  };

  const handleSendReminder = async () => {
    if (!selectedCampaign) return;
    const id = (selectedCampaign as any)._id || selectedCampaign.id;
    setSendingReminder(true);
    try {
      const { data } = await axios.post(`${API_URL()}/api/campaigns/${id}/send-reminder`, {}, { headers: headers() });
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send reminder');
    } finally {
      setSendingReminder(false);
    }
  };

  const addManualTarget = () => {
    if (!manualTarget.email) return;
    if (targets.some(t => t.email === manualTarget.email)) { toast.error('Email already added'); return; }
    setTargets(prev => [...prev, { ...manualTarget }]);
    setManualTarget({ email: '', name: '', department: '' });
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const added: Target[] = [];
      lines.forEach(line => {
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        const email = parts[0] || '';
        const name = parts[1] || '';
        const department = parts[2] || '';
        if (email && email.includes('@') && !targets.some(t => t.email === email)) {
          added.push({ email, name, department });
        }
      });
      if (added.length) { setTargets(prev => [...prev, ...added]); toast.success(`Added ${added.length} targets`); }
      else toast.error('No valid emails found in CSV');
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.templateId) { toast.error('Select a template'); return; }
    if (targets.length === 0) { toast.error('Add at least one target'); return; }
    setSubmitting(true);
    try {
      const payload = { ...form, targets };
      const { data } = await axios.post(`${API_URL()}/api/campaigns`, payload, { headers: headers() });
      setCampaigns(prev => [data, ...prev]);
      setShowModal(false);
      setForm({ name: '', description: '', templateId: '', scheduledAt: '' });
      setTargets([]);
      toast.success('Campaign created!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const calcRate = (count: number, total: number) =>
    total > 0 ? ((count / total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campaign Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and monitor phishing awareness campaigns</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors text-sm font-medium">
            <Plus className="h-4 w-4 mr-2" /> New Campaign
          </button>
        )}
      </div>

      {!selectedCampaign ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.length === 0 && (
            <div className="lg:col-span-2 text-center py-16 text-gray-500 dark:text-gray-400">
              No campaigns yet. Create one to get started.
            </div>
          )}
          {campaigns.map((campaign) => {
            const id = (campaign as any)._id || campaign.id;
            return (
              <div key={id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0 mr-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{campaign.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{campaign.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusColor(campaign.status)}`}>{campaign.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Users className="h-5 w-5 text-gray-500 dark:text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Targets</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{campaign.targetCount}</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <Activity className="h-5 w-5 text-red-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Click Rate</p>
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400">{calcRate(campaign.clickCount, campaign.targetCount)}%</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Mail className="h-5 w-5 text-green-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reported</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">{campaign.reportCount}</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setSelectedCampaign(campaign)} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center">
                    <Eye className="h-4 w-4 mr-2" /> View
                  </button>
                  {campaign.status === 'active' && (
                    <button onClick={() => handlePauseResume(campaign)} className="bg-yellow-100 dark:bg-yellow-900/40 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 text-yellow-700 dark:text-yellow-300 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
                      <Pause className="h-4 w-4 mr-1" /> Pause
                    </button>
                  )}
                  {campaign.status === 'paused' && (
                    <button onClick={() => handlePauseResume(campaign)} className="bg-green-100 dark:bg-green-900/40 hover:bg-green-200 dark:hover:bg-green-900/60 text-green-700 dark:text-green-300 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
                      <Play className="h-4 w-4 mr-1" /> Resume
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedCampaign.name}</h2>
            <div className="flex items-center gap-3">
              {selectedCampaign.status === 'active' && user?.role === 'admin' && (
                <button onClick={handleSendReminder} disabled={sendingReminder} className="text-sm bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/60 px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 transition-colors">
                  {sendingReminder ? 'Sending…' : '📧 Send Reminder'}
                </button>
              )}
              <button onClick={() => setSelectedCampaign(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">← Back</button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 overflow-x-auto">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Target Results</h3>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {['Employee', 'Department', 'Email Status', 'Opens/Clicks'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedCampaign.targets.map((emp, i) => {
                    const es = selectedCampaign.emailStatus?.find(e => e.email === emp.email);
                    return (
                      <tr key={i}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{emp.name || '—'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{emp.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{emp.department || '—'}</td>
                        <td className="px-4 py-3">
                          {es ? (
                            <span className={`px-2 py-1 text-xs rounded-full ${es.status === 'sent' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}`}>{es.status}</span>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {es ? `${es.openCount ?? 0} / ${es.clickCount ?? 0}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Summary</h3>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Click Rate</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-300">{calcRate(selectedCampaign.clickCount, selectedCampaign.targetCount)}%</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Report Rate</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300">{calcRate(selectedCampaign.reportCount, selectedCampaign.targetCount)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Campaign</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Name *</label>
                  <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template *</label>
                  <div className="relative">
                    <select required value={form.templateId} onChange={e => setForm(f => ({ ...f, templateId: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none">
                      <option value="">Select template…</option>
                      {templates.map(t => <option key={t._id || t.id} value={t._id || t.id}>{t.name} ({t.difficulty})</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule Date (optional)</label>
                  <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Targets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Targets ({targets.length})</label>
                  <div className="flex items-center gap-3">
                    {targetGroups.length > 0 && (
                      <div className="relative">
                        <select defaultValue="" onChange={e => { const g = targetGroups.find(x => x._id === e.target.value); if (g) loadFromGroup(g); e.target.value = ''; }}
                          className="text-xs text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-600 rounded px-2 py-1 bg-white dark:bg-gray-700 cursor-pointer">
                          <option value="">Load from Group…</option>
                          {targetGroups.map(g => <option key={g._id} value={g._id}>{g.name} ({g.targets.length})</option>)}
                        </select>
                      </div>
                    )}
                    <label className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline flex items-center">
                      <Upload className="h-3 w-3 mr-1" /> Import CSV
                      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCSV} />
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">CSV format: email, name, department (one per line)</p>
                <div className="flex gap-2 mb-2">
                  <input type="email" placeholder="email@example.com *" value={manualTarget.email} onChange={e => setManualTarget(m => ({ ...m, email: e.target.value }))}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="Name" value={manualTarget.name} onChange={e => setManualTarget(m => ({ ...m, name: e.target.value }))}
                    className="w-28 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="Dept" value={manualTarget.department} onChange={e => setManualTarget(m => ({ ...m, department: e.target.value }))}
                    className="w-24 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={addManualTarget} className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 px-3 py-2 rounded-lg text-sm font-medium">Add</button>
                </div>
                {targets.length > 0 && (
                  <div className="max-h-36 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
                    {targets.map((t, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{t.email}</span>
                          {t.name && <span className="ml-2 text-gray-500 dark:text-gray-400">{t.name}</span>}
                          {t.department && <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">({t.department})</span>}
                        </div>
                        <button type="button" onClick={() => setTargets(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium">
                  {submitting ? 'Creating…' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManager;
