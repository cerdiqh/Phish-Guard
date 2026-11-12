import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Trash2, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_URL = () => (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  createdAt?: string;
}

const roleBadge = (role: string) => {
  if (role === 'admin') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  if (role === 'manager') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

const UserManagement: React.FC<{ currentUserId?: string }> = ({ currentUserId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    axios.get(`${API_URL()}/api/users`, { headers: headers() })
      .then(r => setUsers(r.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const changeRole = async (id: string, role: string) => {
    try {
      const { data } = await axios.patch(`${API_URL()}/api/users/${id}/role`, { role }, { headers: headers() });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role: data.role } : u));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await axios.delete(`${API_URL()}/api/users/${id}`, { headers: headers() });
      setUsers(prev => prev.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage user accounts and roles</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
          <Users className="h-5 w-5 text-gray-500 mr-2" />
          <span className="font-medium text-gray-900 dark:text-white">{users.length} registered users</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading users…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Username', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map(u => (
                  <tr key={u._id} className={u._id === currentUserId ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm mr-3">
                          {u.username[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {u.username} {u._id === currentUserId && <span className="text-xs text-blue-500">(you)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u._id === currentUserId ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleBadge(u.role)}`}>{u.role}</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={e => changeRole(u._id, e.target.value)}
                          className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u._id !== currentUserId && (
                        <button
                          onClick={() => setConfirmDelete(u._id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center mb-3">
          <Shield className="h-4 w-4 text-gray-500 mr-2" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Role permissions</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div><span className="font-semibold text-red-700 dark:text-red-400">Admin</span> — Full access: manage users, campaigns, templates, reports</div>
          <div><span className="font-semibold text-blue-700 dark:text-blue-400">Manager</span> — Create templates, view all reports, cannot manage users</div>
          <div><span className="font-semibold text-gray-700 dark:text-gray-300">Employee</span> — View own reports, access training and analyzer</div>
        </div>
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete user?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">This cannot be undone. The user will lose all access immediately.</p>
            <div className="flex space-x-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Cancel</button>
              <button onClick={() => deleteUser(confirmDelete)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
