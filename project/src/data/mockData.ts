import { Campaign, PhishingTemplate, Employee, AnalyticsData } from '../types';

export const mockTemplates: PhishingTemplate[] = [
  {
    id: '1',
    name: 'Urgent Password Reset',
    subject: 'URGENT: Your account will be suspended',
    sender: 'security@company-portal.com',
    content: `Dear Employee,

We've detected suspicious activity on your account. Your password must be reset immediately to prevent unauthorized access.

Click here to secure your account: [PHISHING_LINK]

This link will expire in 2 hours. Failure to act will result in account suspension.

Security Team
IT Department`,
    type: 'credential_harvest',
    difficulty: 'easy',
    indicators: ['Urgency tactics', 'Suspicious sender domain', 'Generic greeting']
  },
  {
    id: '2',
    name: 'CEO Invoice Request',
    subject: 'Re: Urgent Payment Processing',
    sender: 'ceo@company.com',
    content: `Hi,

I'm currently in a meeting and need you to process this invoice payment immediately. The vendor is waiting.

Please review and approve: [PHISHING_LINK]

Thanks,
John Smith
CEO`,
    type: 'spear_phishing',
    difficulty: 'hard',
    indicators: ['Authority impersonation', 'Pressure tactics', 'Minimal details']
  },
  {
    id: '3',
    name: 'Software Update Required',
    subject: 'Critical Security Update - Action Required',
    sender: 'updates@microsoft-security.com',
    content: `Microsoft Security Alert

A critical security vulnerability has been discovered. Download the emergency patch immediately:

Download Security Update: [PHISHING_LINK]

This update addresses CVE-2024-0001 and must be installed within 24 hours.

Microsoft Security Team`,
    type: 'malware',
    difficulty: 'medium',
    indicators: ['Fake urgency', 'Impersonation', 'Suspicious download link']
  }
];

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    department: 'Marketing',
    riskLevel: 'low',
    trainingHistory: [],
    lastActivity: '2024-01-15',
    clicked: false,
    reported: true,
    reportTimestamp: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@company.com',
    department: 'Engineering',
    riskLevel: 'medium',
    trainingHistory: [],
    lastActivity: '2024-01-14',
    clicked: true,
    reported: false,
    clickTimestamp: '2024-01-14T14:22:00Z'
  },
  {
    id: '3',
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    department: 'HR',
    riskLevel: 'high',
    trainingHistory: [],
    lastActivity: '2024-01-13',
    clicked: true,
    reported: false,
    clickTimestamp: '2024-01-13T09:15:00Z'
  },
  {
    id: '4',
    name: 'David Wilson',
    email: 'david.wilson@company.com',
    department: 'Finance',
    riskLevel: 'low',
    trainingHistory: [],
    lastActivity: '2024-01-16',
    clicked: false,
    reported: true,
    reportTimestamp: '2024-01-16T11:45:00Z'
  }
];

export const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Q1 Password Security Campaign',
    description: 'Testing employee awareness of password reset phishing attempts',
    status: 'active',
    createdAt: '2024-01-10T00:00:00Z',
    targetCount: 150,
    clickCount: 12,
    reportCount: 45,
    template: mockTemplates[0],
    targets: mockEmployees
  },
  {
    id: '2',
    name: 'Executive Impersonation Test',
    description: 'Advanced spear phishing simulation targeting finance team',
    status: 'completed',
    createdAt: '2024-01-05T00:00:00Z',
    targetCount: 25,
    clickCount: 3,
    reportCount: 18,
    template: mockTemplates[1],
    targets: mockEmployees.slice(0, 2)
  }
];

export const mockAnalytics: AnalyticsData = {
  totalCampaigns: 12,
  activeCampaigns: 3,
  totalEmployees: 150,
  overallClickRate: 8.2,
  overallReportRate: 45.6,
  riskDistribution: {
    low: 65,
    medium: 55,
    high: 30
  },
  campaignTrends: [
    { month: 'Sep', campaigns: 2, clickRate: 12.5, reportRate: 38.2 },
    { month: 'Oct', campaigns: 3, clickRate: 9.8, reportRate: 42.1 },
    { month: 'Nov', campaigns: 4, clickRate: 7.2, reportRate: 47.3 },
    { month: 'Dec', campaigns: 3, clickRate: 8.2, reportRate: 45.6 }
  ]
};