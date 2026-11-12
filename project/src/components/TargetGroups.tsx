import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Users, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_URL = () => (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

interface Target { email: string; name: string; department: string; }
interface Group { _id: string; name: string; targets: Target[]; createdAt: string; }

interface TargetGroupsProps {
  onLoadGroup?: (targets: Target[]) => void;
}

const TargetGroups: React.FC<TargetGroupsProps> = ({ onLoadGroup }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [targets, setTargets] = useState<Target[]>([]);
  const [manualTarget, setManualTarget] = useState({ email: '', name: '', department: '' });
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`${API_URL()}/api/target-groups`, { headers: headers() })
      .then(r => setGroups(r.data))
      .catch(() => {});
  }, []);

  const addManualTarget = () => {
    if (!manualTarget.email || !manualTarget.email.includes('@')) { toast.error('Valid email required'); return; }
    if (targets.some(t => t.email === manualTarget.email)) { toast.error('Already added'); return; }
    setTargets(prev => [...prev, { ...manualTarget }]);
    setManualTarget({ email: '', name: '', department: '' });
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = (ev.target?.result as string).split('\n').map(l => l.trim()).filter(Boolean);
      const added: Target[] = [];
      lines.forEach(line => {
        const [email = '', name = '', department = ''] = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        if (email.includes('@') && !targets.some(t => t.email === email)) added.push({ email, name, department });
      });
      if (added.length) { setTargets(prev => [...prev, ...added]); toast.success(`Added ${added.length} targets`); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreate = async () => {
    if (!groupName.trim()) { toast.error('Group name required'); return; }
    if (targets.length === 0) { toast.error('Add at least one target'); return; }
    try {
      const { data } = await axios.post(`${API_URL()}/api/target-groups`, { name: groupName, targets }, { headers: headers() });
      setGroups(prev => [data, ...prev]);
      setShowCreate(false);
      setGroupName('');
      setTargets([]);
      toast.success('Group created!');
    } catch {
      toast.error('Failed to create group');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this group?')) return;
    setDeleting(id);
    try {
      await axios.delete(`${API_URL()}/api/target-groups/${id}`, { headers: headers() });
      setGroups(prev => prev.filter(g => g._id !== id));
      toast.success('Group deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Target Groups</h1>
          <p className="text-gray-600 dark:text-gray-400">Save and reuse lists of targets across campaigns</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium">
          <Plus className="h-4 w-4 mr-2" /> New Group
        </button>
      </div>

      {groups.length === 0 && !showCreate && (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          No target groups yet. Create one to reuse target lists in campaigns.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {groups.map(g => (
          <div key={g._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{g.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{g.targets.length} targets · {new Date(g.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                {onLoadGroup && (
                  <button onClick={() => onLoadGroup(g.targets)} className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 font-medium">
                    Use in Campaign
                  </button>
                )}
                <button onClick={() => setExpandedGroup(expandedGroup === g._id ? null : g._id)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <Users className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(g._id)} disabled={deleting === g._id} className="text-red-400 hover:text-red-600 disabled:opacity-40">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {expandedGroup === g._id && (
              <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3 max-h-48 overflow-y-auto space-y-1">
                {g.targets.map((t, i) => (
                  <div key={i} className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                    <span>{t.email}</span>
                    <span className="text-gray-400 text-xs">{t.name} {t.department && `· ${t.department}`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Target Group</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
                <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Finance Team"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Targets ({targets.length})</label>
                  <label className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline flex items-center">
                    <Upload className="h-3 w-3 mr-1" /> Import CSV
                    <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
                  </label>
                </div>
                <div className="flex gap-2 mb-2">
                  <input type="email" placeholder="email@example.com" value={manualTarget.email} onChange={e => setManualTarget(m => ({ ...m, email: e.target.value }))}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  <input type="text" placeholder="Name" value={manualTarget.name} onChange={e => setManualTarget(m => ({ ...m, name: e.target.value }))}
                    className="w-28 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  <input type="text" placeholder="Dept" value={manualTarget.department} onChange={e => setManualTarget(m => ({ ...m, department: e.target.value }))}
                    className="w-24 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  <button type="button" onClick={addManualTarget} className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg text-sm font-medium">Add</button>
                </div>
                {targets.length > 0 && (
                  <div className="max-h-36 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
                    {targets.map((t, i) => (
                      <div key={i} className="flex justify-between px-3 py-2 text-sm">
                        <span className="text-gray-900 dark:text-white">{t.email}</span>
                        <button onClick={() => setTargets(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">Cancel</button>
                <button onClick={handleCreate} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Create Group</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetGroups;
