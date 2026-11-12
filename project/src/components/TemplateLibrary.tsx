import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, AlertTriangle, Eye, Plus, Send, X, Trash2, Edit2 } from 'lucide-react';

const API_URL = () => (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

interface Template {
  _id: string;
  name: string;
  subject: string;
  sender: string;
  content: string;
  type: 'credential_harvest' | 'malware' | 'social_engineering' | 'spear_phishing';
  difficulty: 'easy' | 'medium' | 'hard';
  indicators: string[];
}

interface TemplateLibraryProps {
  user?: any;
}

const typeEmoji: Record<string, string> = {
  credential_harvest: '🔐',
  malware: '🦠',
  social_engineering: '👤',
  spear_phishing: '🎯',
};

const difficultyClass: Record<string, string> = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  hard: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

const blank = { name: '', subject: '', sender: '', content: '', type: 'credential_harvest' as Template['type'], difficulty: 'easy' as Template['difficulty'], indicators: '' };

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ user }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Template | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Template | null>(null);
  const [form, setForm] = useState(blank);
  const [sendModal, setSendModal] = useState<Template | null>(null);
  const [sendEmail, setSendEmail] = useState('');
  const [sendStatus, setSendStatus] = useState('');
  const [sending, setSending] = useState(false);
  const canEdit = ['admin', 'manager'].includes(user?.role);

  useEffect(() => {
    axios.get(`${API_URL()}/api/templates`, { headers: headers() })
      .then(r => setTemplates(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, indicators: form.indicators.split(',').map(s => s.trim()).filter(Boolean) };
      const res = await axios.post(`${API_URL()}/api/templates`, payload, { headers: headers() });
      setTemplates(prev => [res.data, ...prev]);
      setShowCreate(false);
      setForm(blank);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create template');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      const payload = { ...form, indicators: form.indicators.split(',').map(s => s.trim()).filter(Boolean) };
      const res = await axios.put(`${API_URL()}/api/templates/${editTarget._id}`, payload, { headers: headers() });
      setTemplates(prev => prev.map(t => t._id === editTarget._id ? res.data : t));
      setEditTarget(null);
      setForm(blank);
      if (selected?._id === editTarget._id) setSelected(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await axios.delete(`${API_URL()}/api/templates/${id}`, { headers: headers() });
      setTemplates(prev => prev.filter(t => t._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch {
      alert('Failed to delete template');
    }
  };

  const handleSendTest = async () => {
    if (!sendModal || !sendEmail) return;
    setSending(true);
    setSendStatus('');
    try {
      const res = await axios.post(`${API_URL()}/api/templates/${sendModal._id}/send-test`, { toEmail: sendEmail }, { headers: headers() });
      setSendStatus(res.data.message);
    } catch (err: any) {
      setSendStatus(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const openEdit = (t: Template) => {
    setEditTarget(t);
    setForm({ name: t.name, subject: t.subject, sender: t.sender, content: t.content, type: t.type, difficulty: t.difficulty, indicators: (t.indicators || []).join(', ') });
  };

  const TemplateForm = ({ onSubmit, title, onClose }: { onSubmit: (e: React.FormEvent) => void; title: string; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {(['name', 'subject', 'sender'] as const).map(f => (
            <div key={f}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">{f}</label>
              <input type="text" required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={(form as any)[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content <span className="text-xs text-gray-500">(use [PHISHING_LINK] for the link)</span></label>
            <textarea required rows={4} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as Template['type'] }))}>
                <option value="credential_harvest">Credential Harvest</option>
                <option value="malware">Malware</option>
                <option value="social_engineering">Social Engineering</option>
                <option value="spear_phishing">Spear Phishing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
              <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value as Template['difficulty'] }))}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Indicators <span className="text-xs text-gray-500">(comma separated)</span></label>
            <input type="text" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={form.indicators} onChange={e => setForm(p => ({ ...p, indicators: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">Save</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Template Library</h1>
          <p className="text-gray-600 dark:text-gray-400">Phishing email templates for security awareness campaigns</p>
        </div>
        {canEdit && (
          <button onClick={() => { setForm(blank); setShowCreate(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus className="h-4 w-4" /> Create Template
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">Loading templates…</div>
      ) : !selected ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(t => (
            <div key={t._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{typeEmoji[t.type] || '📧'}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">{t.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{t.type.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyClass[t.difficulty]}`}>{t.difficulty}</span>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-2 mb-3 truncate">
                <span className="text-xs text-gray-500 dark:text-gray-400">Subject: </span>{t.subject}
              </div>
              {t.indicators?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {t.indicators.slice(0, 2).map((ind, i) => (
                    <span key={i} className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full">{ind}</span>
                  ))}
                  {t.indicators.length > 2 && <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">+{t.indicators.length - 2}</span>}
                </div>
              )}
              <div className="mt-auto flex gap-2">
                <button onClick={() => setSelected(t)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1">
                  <Eye className="h-4 w-4" /> Preview
                </button>
                {canEdit && (
                  <>
                    <button onClick={() => { setSendModal(t); setSendEmail(''); setSendStatus(''); }} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors" title="Send test email">
                      <Send className="h-4 w-4" />
                    </button>
                    <button onClick={() => openEdit(t)} className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(t._id)} className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-sm transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selected.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{selected.type.replace(/_/g, ' ')} · {selected.difficulty}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">← Back</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Email Preview</h3>
              <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600 rounded-t-lg flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><Mail className="h-4 w-4" /> Phishing Simulation</div>
                  <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400"><AlertTriangle className="h-3 w-3" /> SIMULATION</div>
                </div>
                <div className="p-4">
                  <div className="border-b border-gray-200 dark:border-gray-600 pb-3 mb-3 text-sm">
                    <p><span className="text-gray-500 dark:text-gray-400">From: </span><span className="font-medium text-gray-900 dark:text-white">{selected.sender}</span></p>
                    <p className="mt-1"><span className="text-gray-500 dark:text-gray-400">Subject: </span><span className="font-medium text-gray-900 dark:text-white">{selected.subject}</span></p>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans">{selected.content.replace('[PHISHING_LINK]', '🔗 [SIMULATED PHISHING LINK]')}</pre>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Details</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{typeEmoji[selected.type]} {selected.type.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Difficulty</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${difficultyClass[selected.difficulty]}`}>{selected.difficulty}</span>
                </div>
              </div>
              {selected.indicators?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Red Flags</h4>
                  <div className="space-y-2">
                    {selected.indicators.map((ind, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{ind}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {canEdit && (
                <div className="space-y-2 pt-2">
                  <button onClick={() => { setSendModal(selected); setSendEmail(''); setSendStatus(''); }} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" /> Send Test Email
                  </button>
                  <button onClick={() => openEdit(selected)} className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <Edit2 className="h-4 w-4" /> Edit Template
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && <TemplateForm title="Create New Template" onSubmit={handleCreate} onClose={() => setShowCreate(false)} />}
      {/* Edit modal */}
      {editTarget && <TemplateForm title="Edit Template" onSubmit={handleEdit} onClose={() => { setEditTarget(null); setForm(blank); }} />}

      {/* Send test email modal */}
      {sendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Send Test Email</h3>
              <button onClick={() => setSendModal(null)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Send a test copy of <strong>{sendModal.name}</strong> to an email address. It will be clearly marked as a simulation.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient Email</label>
              <input
                type="email"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="test@example.com"
                value={sendEmail}
                onChange={e => setSendEmail(e.target.value)}
              />
            </div>
            {sendStatus && (
              <p className={`text-sm mb-4 ${sendStatus.includes('sent') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{sendStatus}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSendModal(null)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleSendTest} disabled={sending || !sendEmail} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2">
                {sending ? 'Sending…' : <><Send className="h-4 w-4" /> Send</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;
