import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CampaignManager from './components/CampaignManager';
import TemplateLibrary from './components/TemplateLibrary';
import Reports from './components/Reports';
import Training from './components/Training';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import UserManagement from './components/UserManagement';
import UserProfile from './components/UserProfile';
import TargetGroups from './components/TargetGroups';
import RiskScores from './components/RiskScores';
import AuditLog from './components/AuditLog';
import LandingPage from './components/LandingPage';
import Chatbot from './components/Chatbot';
import PhishingAnalyzer from './components/PhishingAnalyzer';
import { Toaster } from 'react-hot-toast';
import { Campaign } from './types';

interface Notification { id: string; message: string; time: string; read: boolean; }

const DARK_KEY = 'phishguard_dark';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showAuth, setShowAuth] = useState<'login' | 'register' | 'forgot' | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem(DARK_KEY) === 'true'; } catch { return false; }
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const resetToken = searchParams.get('token');
  const isResetPage = searchParams.get('reset') === '1' && !!resetToken;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try { localStorage.setItem(DARK_KEY, String(darkMode)); } catch {}
  }, [darkMode]);

  const addNotification = (message: string) => {
    const n: Notification = {
      id: Date.now().toString(),
      message,
      time: new Date().toLocaleTimeString(),
      read: false,
    };
    setNotifications(prev => [n, ...prev].slice(0, 20));
  };

  const handleLogin = (u: any) => {
    setUser(u);
    setShowAuth(null);
    addNotification(`Welcome back, ${u.username}!`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    setNotifications([]);
    setCampaigns([]);
    setActiveTab('dashboard');
  };

  if (isResetPage) {
    return (
      <>
        <Toaster position="top-right" />
        <ResetPassword token={resetToken!} onSuccess={() => { navigate('/'); setShowAuth('login'); }} />
      </>
    );
  }

  if (!user) {
    if (showAuth === 'forgot') {
      return (
        <>
          <Toaster position="top-right" />
          <ForgotPassword onBack={() => setShowAuth('login')} />
        </>
      );
    }
    if (!showAuth) {
      return <LandingPage onLogin={() => setShowAuth('login')} onRegister={() => setShowAuth('register')} />;
    }
    return showAuth === 'login' ? (
      <>
        <Toaster position="top-right" />
        <Login onLogin={handleLogin} onBack={() => setShowAuth(null)} onForgotPassword={() => setShowAuth('forgot')} />
      </>
    ) : (
      <>
        <Toaster position="top-right" />
        <Register onRegister={() => setShowAuth('login')} onBack={() => setShowAuth(null)} />
      </>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} campaigns={campaigns} />;
      case 'campaigns':
        return <CampaignManager user={user} campaigns={campaigns} setCampaigns={setCampaigns} onNotify={addNotification} />;
      case 'templates':
        return <TemplateLibrary user={user} />;
      case 'reports':
        return <Reports user={user} />;
      case 'training':
        return <Training />;
      case 'analyzer':
        return <PhishingAnalyzer />;
      case 'target-groups':
        return <TargetGroups />;
      case 'risk-scores':
        return ['admin', 'manager'].includes(user.role) ? <RiskScores /> : null;
      case 'audit-log':
        return user.role === 'admin' ? <AuditLog /> : null;
      case 'users':
        return user.role === 'admin' ? <UserManagement currentUserId={user._id} /> : null;
      case 'profile':
        return <UserProfile />;
      default:
        return <Dashboard onTabChange={setActiveTab} campaigns={campaigns} />;
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Chatbot context={activeTab} />
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
        notifications={notifications}
        onClearNotifications={() => setNotifications([])}
      >
        {renderContent()}
      </Layout>
    </>
  );
}

export default App;
