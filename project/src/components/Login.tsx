import React, { useState } from 'react';
import axios from 'axios';

const Login: React.FC<{ onLogin: (user: any) => void; onBack?: () => void }> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_URL}/api/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-slide-in">
        <h2 className="text-3xl font-extrabold text-blue-700 mb-4 text-center">Login to PhishGuard</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Email</label>
            <input type="email" className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400 transition" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Password</label>
            <input type="password" className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400 transition" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div className="text-red-600 text-center">{error}</div>}
          <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg font-semibold shadow-lg hover:scale-105 transform transition-all duration-200">Login</button>
        </form>
        {onBack && (
          <button onClick={onBack} className="mt-6 w-full text-blue-600 hover:underline transition">← Back to Home</button>
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

export default Login; 