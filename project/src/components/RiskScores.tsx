import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Shield, AlertCircle, Search } from 'lucide-react';

const API_URL = () => (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

interface Employee {
  email: string;
  name: string;
  openCount: number;
  clickCount: number;
  campaigns: number;
  riskLevel: 'High' | 'Medium' | 'Low';
  riskScore: number;
}

const RiskScores: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  useEffect(() => {
    axios.get(`${API_URL()}/api/employees/risk-scores`, { headers: headers() })
      .then(r => setEmployees(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const riskBadge = (level: string) => {
    if (level === 'High') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    if (level === 'Medium') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  };

  const riskIcon = (level: string) => {
    if (level === 'High') return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (level === 'Medium') return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <Shield className="h-4 w-4 text-green-500" />;
  };

  const filtered = employees.filter(e =>
    (filter === 'All' || e.riskLevel === filter) &&
    (e.email.toLowerCase().includes(search.toLowerCase()) || e.name.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = { High: employees.filter(e => e.riskLevel === 'High').length, Medium: employees.filter(e => e.riskLevel === 'Medium').length, Low: employees.filter(e => e.riskLevel === 'Low').length };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Risk Scores</h1>
        <p className="text-gray-600 dark:text-gray-400">Track which employees are most vulnerable to phishing</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(['High', 'Medium', 'Low'] as const).map(level => (
          <div key={level} onClick={() => setFilter(filter === level ? 'All' : level)} className={`bg-white dark:bg-gray-800 rounded-lg border p-4 cursor-pointer transition-all ${filter === level ? 'ring-2 ring-blue-500' : 'border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskBadge(level)}`}>{level} Risk</span>
              {riskIcon(level)}
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{counts[level]}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">employees</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search by email or name..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">No employees found. Run campaigns to generate risk data.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Employee', 'Risk Level', 'Risk Score', 'Opens', 'Clicks', 'Campaigns'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{e.name || '—'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{e.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 w-fit px-2 py-1 rounded-full text-xs font-medium ${riskBadge(e.riskLevel)}`}>
                        {riskIcon(e.riskLevel)} {e.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 w-20">
                          <div className={`h-2 rounded-full ${e.riskLevel === 'High' ? 'bg-red-500' : e.riskLevel === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${e.riskScore}%` }} />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{e.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{e.openCount}</td>
                    <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium">{e.clickCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{e.campaigns}</td>
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

export default RiskScores;
