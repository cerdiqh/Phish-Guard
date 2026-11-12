import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Mail, AlertTriangle, Shield } from 'lucide-react';

interface DashboardProps {
  onTabChange?: (tab: string) => void;
  campaigns: import('../types').Campaign[];
}

const Dashboard: React.FC<DashboardProps> = ({ onTabChange, campaigns }) => {
  const totalSent = campaigns.reduce((sum, c) => sum + (c.emailStatus?.filter(e => e.status === 'sent').length || 0), 0);
  const totalFailed = campaigns.reduce((sum, c) => sum + (c.emailStatus?.filter(e => e.status === 'failed').length || 0), 0);
  const totalOpens = campaigns.reduce((sum, c) => sum + (c.emailStatus?.reduce((s, e) => s + (e.openCount || 0), 0) || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.emailStatus?.reduce((s, e) => s + (e.clickCount || 0), 0) || 0), 0);

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const overallClickRate = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : '0.0';

  const stats = [
    {
      title: 'Total Campaigns',
      value: campaigns.length,
      icon: Mail,
      color: 'bg-blue-500',
      change: null,
      positive: true
    },
    {
      title: 'Active Campaigns',
      value: activeCampaigns,
      icon: Shield,
      color: 'bg-green-500',
      change: null,
      positive: true
    },
    {
      title: 'Emails Opened',
      value: totalOpens,
      icon: Users,
      color: 'bg-purple-500',
      change: null,
      positive: true
    },
    {
      title: 'Click Rate',
      value: `${overallClickRate}%`,
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: null,
      positive: false
    }
  ];

  const campaignTrends = campaigns.slice(-6).map(c => ({
    month: new Date((c as any).createdAt || Date.now()).toLocaleString('default', { month: 'short' }),
    sent: c.emailStatus?.filter(e => e.status === 'sent').length || 0,
    clicks: c.emailStatus?.reduce((s, e) => s + (e.clickCount || 0), 0) || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Awareness Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor your organization's phishing awareness training progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live delivery stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Emails Sent</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalSent}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Emails Failed</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{totalFailed}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Opens</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{totalOpens}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Clicks</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{totalClicks}</p>
        </div>
      </div>

      {/* Campaign chart */}
      {campaignTrends.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Email Activity</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={campaignTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="sent" fill="#3B82F6" name="Sent" />
              <Bar dataKey="clicks" fill="#DC2626" name="Clicks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" onClick={() => onTabChange && onTabChange('campaigns')}>
            <Mail className="h-8 w-8 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white">Create Campaign</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Launch a new phishing simulation</p>
          </button>
          <button className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" onClick={() => onTabChange && onTabChange('reports')}>
            <Users className="h-8 w-8 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white">View Reports</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Analyze campaign results</p>
          </button>
          <button className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" onClick={() => onTabChange && onTabChange('training')}>
            <Shield className="h-8 w-8 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white">Training Resources</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Access educational materials</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;