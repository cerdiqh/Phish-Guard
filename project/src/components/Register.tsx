import React, { useState } from 'react';
import axios from 'axios';

const Register: React.FC<{ onRegister: () => void; onBack?: () => void }> = ({ onRegister, onBack }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('http://localhost:5000/api/register', { username, email, password, role });
      setSuccess('Registration successful! You can now log in.');
      setUsername(''); setEmail(''); setPassword(''); setRole('employee');
      onRegister();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-slide-in">
        <h2 className="text-3xl font-extrabold text-purple-700 mb-4 text-center">Register for PhishGuard</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Username</label>
            <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-purple-400 transition" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Email</label>
            <input type="email" className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-purple-400 transition" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Password</label>
            <input type="password" className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-purple-400 transition" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Role</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-purple-400 transition" value={role} onChange={e => setRole(e.target.value)}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <div className="text-red-600 text-center">{error}</div>}
          {success && <div className="text-green-600 text-center">{success}</div>}
          <button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-2 rounded-lg font-semibold shadow-lg hover:scale-105 transform transition-all duration-200">Register</button>
        </form>
        {onBack && (
          <button onClick={onBack} className="mt-6 w-full text-purple-600 hover:underline transition">← Back to Home</button>
        )}
      </div>
      <style>{`
        .animate-fade-in { animation: fadeIn 1s ease; }
        .animate-slide-in { animation: slideIn 1.2s cubic-bezier(.4,2,.6,1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-40px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Register; 