import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CampaignManager from './components/CampaignManager';
import TemplateLibrary from './components/TemplateLibrary';
import Reports from './components/Reports';
import Training from './components/Training';
import Login from './components/Login';
import Register from './components/Register';
import { Toaster } from 'react-hot-toast';
import { Campaign } from './types';
import LandingPage from './components/LandingPage';
import Chatbot from './components/Chatbot';
import PhishingAnalyzer from './components/PhishingAnalyzer';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null);
  const navigate = useNavigate();

  const handleLogin = (user: any) => {
    setUser(user);
    setShowAuth(null);
    navigate('/');
  };
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) {
    if (!showAuth) {
      return <LandingPage onLogin={() => setShowAuth('login')} onRegister={() => setShowAuth('register')} />;
    }
    return showAuth === 'login' ? (
      <Login onLogin={handleLogin} onBack={() => setShowAuth(null)} />
    ) : (
      <Register onRegister={() => setShowAuth('login')} onBack={() => setShowAuth(null)} />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} campaigns={campaigns} />;
      case 'campaigns':
        return <CampaignManager user={user} campaigns={campaigns} setCampaigns={setCampaigns} />;
      case 'templates':
        return <TemplateLibrary user={user} />;
      case 'reports':
        return <Reports user={user} />;
      case 'training':
        return <Training />;
      case 'analyzer':
        return <PhishingAnalyzer />;
      default:
        return <Dashboard onTabChange={setActiveTab} campaigns={campaigns} />;
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Chatbot context={activeTab} />
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="flex justify-end p-2">
          <span className="mr-4">Logged in as: {user?.username} ({user?.role})</span>
          <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded">Logout</button>
        </div>
        {renderContent()}
      </Layout>
    </>
  );
}

export default App;