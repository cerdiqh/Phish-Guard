import React, { useState, useRef, useEffect } from 'react';
import { Shield, LayoutDashboard, Megaphone, FileText, BarChart3, GraduationCap, Users, User, Bell, Sun, Moon, LogOut, UserCheck, AlertTriangle, ClipboardList } from 'lucide-react';

interface Notification { id: string; message: string; time: string; read: boolean; }

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  user?: any;
  onLogout?: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
  notifications?: Notification[];
  onClearNotifications?: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children, activeTab, onTabChange, user, onLogout,
  darkMode, onToggleDark, notifications = [], onClearNotifications,
}) => {
  const [bellOpen, setBellOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'training', label: 'Training', icon: GraduationCap },
    { id: 'target-groups', label: 'Groups', icon: UserCheck },
    ...(['admin', 'manager'].includes(user?.role) ? [{ id: 'risk-scores', label: 'Risk Scores', icon: AlertTriangle }] : []),
    ...(user?.role === 'admin' ? [
      { id: 'users', label: 'Users', icon: Users },
      { id: 'audit-log', label: 'Audit Log', icon: ClipboardList },
    ] : []),
  ];

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">PhishGuard</span>
            </div>
            <div className="flex items-center space-x-2">
              {/* Dark mode toggle */}
              <button
                onClick={onToggleDark}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={darkMode ? 'Light mode' : 'Dark mode'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Notification bell */}
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => { setBellOpen(o => !o); setUserMenuOpen(false); }}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                >
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">{unread}</span>
                  )}
                </button>
                {bellOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</span>
                      {notifications.length > 0 && (
                        <button onClick={onClearNotifications} className="text-xs text-blue-600 hover:text-blue-700">Clear all</button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-6">No notifications</p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 ${!n.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{n.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{n.time}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => { setUserMenuOpen(o => !o); setBellOpen(false); }}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">{user?.username}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                    </div>
                    <button
                      onClick={() => { onTabChange('profile'); setUserMenuOpen(false); }}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <User className="h-4 w-4 mr-2" /> My Profile
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="flex flex-wrap gap-1 mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1.5">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
            </button>
          ))}
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
