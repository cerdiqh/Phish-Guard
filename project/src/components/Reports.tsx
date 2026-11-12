import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, FileText, Users, AlertTriangle, CheckCircle } from 'lucide-react';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

interface RiskEmployee {
  email: string;
  name: string;
  openCount: number;
  clickCount: number;
  campaigns: number;
  riskLevel: 'High' | 'Medium' | 'Low';
  riskScore: number;
}

interface CampaignRow {
  name: string;
  status: string;
  sent: number;
  opened: number;
  clicked: number;
  openRate: string;
  clickRate: string;
  createdAt: string;
}

interface ReportsProps {
  user?: any;
}

const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [riskEmployees, setRiskEmployees] = useState<RiskEmployee[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !['admin', 'manager'].includes(user?.role)) return;
    fetch(`${API_URL}/api/export/campaigns`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setCampaigns)
      .catch(() => {});
    fetch(`${API_URL}/api/employees/risk-scores`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setRiskEmployees)
      .catch(() => {});
  }, [user]);

  const riskChartData = [
    { level: 'High', count: riskEmployees.filter(e => e.riskLevel === 'High').length, fill: '#DC2626' },
    { level: 'Medium', count: riskEmployees.filter(e => e.riskLevel === 'Medium').length, fill: '#F59E0B' },
    { level: 'Low', count: riskEmployees.filter(e => e.riskLevel === 'Low').length, fill: '#10B981' },
  ];

  const getRecommendations = () => {
    const highRisk = riskEmployees.filter(e => e.riskLevel === 'High');
    const clicked = riskEmployees.filter(e => e.clickCount > 0);
    const recs = [];
    if (highRisk.length > 0) {
      recs.push({ type: 'critical', title: 'High-Risk Employees Need Training', description: `${highRisk.length} employees are high-risk. Provide immediate security awareness training.`, action: 'Schedule mandatory training sessions' });
    }
    if (clicked.length > 0) {
      recs.push({ type: 'warning', title: 'Employees Clicked Phishing Links', description: `${clicked.length} employees have clicked phishing links. Implement targeted remedial training.`, action: 'Enroll in remedial phishing awareness course' });
    }
    if (recs.length === 0) {
      recs.push({ type: 'info', title: 'No Critical Issues', description: 'No high-risk employees detected yet. Run campaigns to generate data.', action: 'Create and launch a phishing simulation' });
    }
    return recs;
  };

  const recommendations = getRecommendations();

  function exportEmployeesToCSV() {
    const hdrs = ['Name', 'Email', 'Risk Level', 'Risk Score', 'Opens', 'Clicks', 'Campaigns'];
    const rows = riskEmployees.map(e => [e.name, e.email, e.riskLevel, String(e.riskScore), String(e.openCount), String(e.clickCount), String(e.campaigns)]);
    downloadCSV([hdrs, ...rows], 'employee_risk_report.csv');
  }

  function exportCampaignsToCSV() {
    const headers = ['Campaign Name', 'Status', 'Sent', 'Opened', 'Clicked', 'Open Rate', 'Click Rate', 'Created'];
    const rows = campaigns.map(c => [c.name, c.status, String(c.sent), String(c.opened), String(c.clicked), c.openRate, c.clickRate, c.createdAt]);
    downloadCSV([headers, ...rows], 'campaigns_report.csv');
  }

  function downloadCSV(data: string[][], filename: string) {
    const csv = data.map(r => r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function exportToPDF() {
    window.print();
  }

  if (!['admin', 'manager'].includes(user?.role)) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Report</h1>
        <p className="text-gray-600 dark:text-gray-400">Report data is available to managers and admins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Awareness Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Analytics and insights from your phishing campaigns</p>
        </div>
        <div className="flex gap-2 flex-wrap no-print">
          <select value={selectedTimeframe} onChange={e => setSelectedTimeframe(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          {riskEmployees.length > 0 && (
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center text-sm" onClick={exportEmployeesToCSV}>
              <Download className="h-4 w-4 mr-1" /> Employees CSV
            </button>
          )}
          {campaigns.length > 0 && (
            <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center text-sm" onClick={exportCampaignsToCSV}>
              <Download className="h-4 w-4 mr-1" /> Campaigns CSV
            </button>
          )}
          <button className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-2 rounded-lg flex items-center text-sm" onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-1" /> Export PDF
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 flex items-center">
          <Users className="h-8 w-8 text-blue-600 mr-4 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tracked Employees</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{riskEmployees.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 flex items-center">
          <AlertTriangle className="h-8 w-8 text-red-600 mr-4 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High-Risk Employees</p>
            <p className="text-2xl font-bold text-red-600">{riskEmployees.filter(e => e.riskLevel === 'High').length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 flex items-center">
          <CheckCircle className="h-8 w-8 text-green-600 mr-4 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Campaigns Run</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{campaigns.length}</p>
          </div>
        </div>
      </div>

      {/* Risk distribution chart */}
      {riskEmployees.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Employee Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={riskChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="level" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Employees" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Employee risk table */}
      {riskEmployees.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Employee Risk Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Employee', 'Risk Level', 'Opens', 'Clicks', 'Campaigns'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {riskEmployees.map((emp, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{emp.name || '—'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{emp.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${emp.riskLevel === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' : emp.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'}`}>{emp.riskLevel}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{emp.openCount}</td>
                    <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium">{emp.clickCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{emp.campaigns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      {campaigns.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Campaign Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Campaign', 'Status', 'Sent', 'Opened', 'Clicked', 'Open Rate', 'Click Rate', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {campaigns.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{c.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-800' : c.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{c.sent}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{c.opened}</td>
                    <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium">{c.clicked}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{c.openRate}</td>
                    <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400">{c.clickRate}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{c.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Improvement Recommendations</h3>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${rec.type === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-400' : rec.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-400'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {rec.type === 'critical' ? <AlertTriangle className="h-5 w-5 text-red-400" /> : rec.type === 'warning' ? <AlertTriangle className="h-5 w-5 text-yellow-400" /> : <CheckCircle className="h-5 w-5 text-blue-400" />}
                </div>
                <div className="ml-3">
                  <h4 className={`text-sm font-medium ${rec.type === 'critical' ? 'text-red-800 dark:text-red-300' : rec.type === 'warning' ? 'text-yellow-800 dark:text-yellow-300' : 'text-blue-800 dark:text-blue-300'}`}>{rec.title}</h4>
                  <p className={`mt-1 text-sm ${rec.type === 'critical' ? 'text-red-700 dark:text-red-400' : rec.type === 'warning' ? 'text-yellow-700 dark:text-yellow-400' : 'text-blue-700 dark:text-blue-400'}`}>{rec.description}</p>
                  <p className={`mt-2 text-xs font-medium ${rec.type === 'critical' ? 'text-red-800 dark:text-red-300' : rec.type === 'warning' ? 'text-yellow-800 dark:text-yellow-300' : 'text-blue-800 dark:text-blue-300'}`}>Action: {rec.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;