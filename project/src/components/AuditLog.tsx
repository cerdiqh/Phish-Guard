import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardList } from 'lucide-react';

const API_URL = () => (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

interface LogEntry {
  _id: string;
  userEmail: string;
  action: string;
  details: string;
  ip: string;
  createdAt: string;
}

const actionLabel = (action: string) => {
  const map: Record<string, string> = {
    login: 'Login',
    register: 'Register',
    campaign_create: 'Campaign Created',
    template_create: 'Template Created',
    template_delete: 'Template Deleted',
    user_delete: 'User Deleted',
    role_change: 'Role Changed',
    reminder_sent: 'Reminder Sent',
  };
  return map[action] || action;
};

const actionColor = (action: string) => {
  if (action.includes('delete')) return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  if (action.includes('create')) return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  if (action === 'login') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL()}/api/audit-log`, { headers: headers() })
      .then(r => setLogs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-7 w-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
          <p className="text-gray-600 dark:text-gray-400">Last 100 security-relevant actions</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">No audit log entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Time', 'User', 'Action', 'Details', 'IP'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatTime(log.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{log.userEmail || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionColor(log.action)}`}>{actionLabel(log.action)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{log.details || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{log.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
