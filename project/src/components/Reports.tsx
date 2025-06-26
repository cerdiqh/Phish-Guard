import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Download, Filter, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { mockEmployees, mockCampaigns } from '../data/mockData';

interface ReportsProps {
  user?: any;
}

const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  const departmentData = mockEmployees.reduce((acc, emp) => {
    if (!acc[emp.department]) {
      acc[emp.department] = { clicked: 0, reported: 0, total: 0 };
    }
    acc[emp.department].total++;
    if (emp.clicked) acc[emp.department].clicked++;
    if (emp.reported) acc[emp.department].reported++;
    return acc;
  }, {} as Record<string, { clicked: number; reported: number; total: number }>);

  const departmentChartData = Object.entries(departmentData).map(([dept, data]) => ({
    department: dept,
    clickRate: ((data.clicked / data.total) * 100).toFixed(1),
    reportRate: ((data.reported / data.total) * 100).toFixed(1),
    employees: data.total
  }));

  const riskTrendData = [
    { month: 'Sep', high: 35, medium: 45, low: 70 },
    { month: 'Oct', high: 32, medium: 48, low: 70 },
    { month: 'Nov', high: 28, medium: 52, low: 70 },
    { month: 'Dec', high: 30, medium: 55, low: 65 }
  ];

  const getRecommendations = () => {
    const highRiskEmployees = mockEmployees.filter(emp => emp.riskLevel === 'high');
    const clickedEmployees = mockEmployees.filter(emp => emp.clicked);
    
    const recommendations = [];

    if (highRiskEmployees.length > 0) {
      recommendations.push({
        type: 'critical',
        title: 'High-Risk Employees Need Immediate Training',
        description: `${highRiskEmployees.length} employees are classified as high-risk. Provide additional security awareness training.`,
        action: 'Schedule mandatory training sessions'
      });
    }

    if (clickedEmployees.length > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Employees Fell for Phishing Attempts',
        description: `${clickedEmployees.length} employees clicked on phishing links. Implement targeted remedial training.`,
        action: 'Enroll in remedial phishing awareness course'
      });
    }

    const marketingClicked = mockEmployees.filter(emp => emp.department === 'Marketing' && emp.clicked);
    if (marketingClicked.length > 0) {
      recommendations.push({
        type: 'info',
        title: 'Marketing Department Needs Focus',
        description: 'Marketing team shows higher susceptibility to social engineering attacks.',
        action: 'Implement department-specific training modules'
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  // CSV export helper
  function exportEmployeesToCSV() {
    const headers = ['Name', 'Email', 'Department', 'Risk Level', 'Clicked', 'Reported', 'Last Activity'];
    const rows = mockEmployees.map(emp => [
      emp.name,
      emp.email,
      emp.department,
      emp.riskLevel,
      emp.clicked ? 'Yes' : 'No',
      emp.reported ? 'Yes' : 'No',
      emp.lastActivity
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_report.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (!['admin', 'manager'].includes(user?.role)) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Report</h1>
        <p className="text-gray-600">You can only view your own report data.</p>
        {/* Render only the user's own report data here */}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Awareness Reports</h1>
          <p className="text-gray-600">Detailed analytics and insights from your phishing campaigns</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors" onClick={exportEmployeesToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Targets</p>
              <p className="text-2xl font-bold text-gray-900">{mockEmployees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clicked Links</p>
              <p className="text-2xl font-bold text-red-900">
                {mockEmployees.filter(emp => emp.clicked).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reported Phishing</p>
              <p className="text-2xl font-bold text-green-900">
                {mockEmployees.filter(emp => emp.reported).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-purple-900">2.3m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="clickRate" fill="#DC2626" name="Click Rate %" />
              <Bar dataKey="reportRate" fill="#10B981" name="Report Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Level Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={riskTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="high" stroke="#DC2626" name="High Risk" />
              <Line type="monotone" dataKey="medium" stroke="#F59E0B" name="Medium Risk" />
              <Line type="monotone" dataKey="low" stroke="#10B981" name="Low Risk" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Employee List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Employee Performance Details</h3>
        </div>
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
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommendation
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      employee.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                      employee.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {employee.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(employee.lastActivity).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.clicked ? (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Clicked Link
                      </span>
                    ) : employee.reported ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Reported Suspicious
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        No Action
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {employee.clicked ? 'Immediate training required' :
                     employee.riskLevel === 'high' ? 'Additional awareness training' :
                     'Continue regular training'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Improvement Recommendations</h3>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${
              rec.type === 'critical' ? 'bg-red-50 border-red-400' :
              rec.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
              'bg-blue-50 border-blue-400'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {rec.type === 'critical' ? (
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  ) : rec.type === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-blue-400" />
                  )}
                </div>
                <div className="ml-3">
                  <h4 className={`text-sm font-medium ${
                    rec.type === 'critical' ? 'text-red-800' :
                    rec.type === 'warning' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    {rec.title}
                  </h4>
                  <p className={`mt-1 text-sm ${
                    rec.type === 'critical' ? 'text-red-700' :
                    rec.type === 'warning' ? 'text-yellow-700' :
                    'text-blue-700'
                  }`}>
                    {rec.description}
                  </p>
                  <p className={`mt-2 text-xs font-medium ${
                    rec.type === 'critical' ? 'text-red-800' :
                    rec.type === 'warning' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    Recommended Action: {rec.action}
                  </p>
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