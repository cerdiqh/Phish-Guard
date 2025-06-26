export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'paused';
  createdAt: string;
  targetCount: number;
  clickCount: number;
  reportCount: number;
  template: PhishingTemplate;
  targets: Employee[];
  emailStatus?: Array<{
    email: string;
    status: string;
    error?: string;
    openCount?: number;
    clickCount?: number;
    lastOpenedAt?: string;
    lastClickedAt?: string;
  }>;
}

export interface PhishingTemplate {
  id: string;
  name: string;
  subject: string;
  sender: string;
  content: string;
  type: 'credential_harvest' | 'malware' | 'social_engineering' | 'spear_phishing';
  difficulty: 'easy' | 'medium' | 'hard';
  indicators: string[];
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  riskLevel: 'low' | 'medium' | 'high';
  trainingHistory: TrainingRecord[];
  lastActivity: string;
  clicked: boolean;
  reported: boolean;
  clickTimestamp?: string;
  reportTimestamp?: string;
}

export interface TrainingRecord {
  id: string;
  campaignId: string;
  completedAt: string;
  score: number;
  timeToClick?: number;
  timeToReport?: number;
  improvements: string[];
}

export interface AnalyticsData {
  totalCampaigns: number;
  activeCampaigns: number;
  totalEmployees: number;
  overallClickRate: number;
  overallReportRate: number;
  riskDistribution: Record<string, number>;
  campaignTrends: Array<{
    month: string;
    campaigns: number;
    clickRate: number;
    reportRate: number;
  }>;
}