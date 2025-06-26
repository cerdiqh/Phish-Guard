import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Mail, AlertTriangle, Shield, TrendingUp, TrendingDown } from 'lucide-react';
import { mockAnalytics } from '../data/mockData';

interface DashboardProps {
  onTabChange?: (tab: string) => void;
  campaigns: import('../types').Campaign[];
}

const Dashboard: React.FC<DashboardProps> = ({ onTabChange, campaigns }) => {
  const { totalCampaigns, activeCampaigns, totalEmployees, overallClickRate, overallReportRate, riskDistribution, campaignTrends } = mockAnalytics;

  // Compute live stats
  const totalSent = campaigns.reduce((sum, c) => sum + (c.emailStatus?.filter(e => e.status === 'sent').length || 0), 0);
  const totalFailed = campaigns.reduce((sum, c) => sum + (c.emailStatus?.filter(e => e.status === 'failed').length || 0), 0);
  const totalOpens = campaigns.reduce((sum, c) => sum + (c.emailStatus?.reduce((s, e) => s + (e.openCount || 0), 0) || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.emailStatus?.reduce((s, e) => s + (e.clickCount || 0), 0) || 0), 0);

  const riskData = Object.entries(riskDistribution).map(([level, count]) => ({
    name: level.charAt(0).toUpperCase() + level.slice(1),
    value: count,
    color: level === 'high' ? '#DC2626' : level === 'medium' ? '#F59E0B' : '#10B981'
  }));

  const stats = [
    {
      title: 'Total Campaigns',
      value: totalCampaigns,
      icon: Mail,
      color: 'bg-blue-500',
      change: '+12%',
      positive: true
    },
    {
      title: 'Active Campaigns',
      value: activeCampaigns,
      icon: Shield,
      color: 'bg-green-500',
      change: '+3',
      positive: true
    },
    {
      title: 'Total Employees',
      value: totalEmployees,
      icon: Users,
      color: 'bg-purple-500',
      change: '+5',
      positive: true
    },
    {
      title: 'Click Rate',
      value: `${overallClickRate}%`,
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: '-2.3%',
      positive: false
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Awareness Dashboard</h1>
        <p className="text-gray-600">Monitor your organization's phishing awareness training progress</p>
      </div>

      {/* Live Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Emails Sent</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalSent}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Emails Failed</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{totalFailed}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Total Opens</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{totalOpens}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Total Clicks</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{totalClicks}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {stat.positive ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Trends */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="clickRate" fill="#DC2626" name="Click Rate %" />
              <Bar dataKey="reportRate" fill="#10B981" name="Report Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center space-x-6">
            {riskData.map((item) => (
              <div key={item.name} className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => onTabChange && onTabChange('campaigns')}>
            <Mail className="h-8 w-8 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">Create Campaign</h4>
            <p className="text-sm text-gray-600">Launch a new phishing simulation</p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => onTabChange && onTabChange('reports')}>
            <Users className="h-8 w-8 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900">View Reports</h4>
            <p className="text-sm text-gray-600">Analyze campaign results</p>
          </button>
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => onTabChange && onTabChange('training')}>
            <Shield className="h-8 w-8 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">Training Resources</h4>
            <p className="text-sm text-gray-600">Access educational materials</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;