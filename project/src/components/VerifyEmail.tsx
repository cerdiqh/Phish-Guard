import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, CheckCircle, XCircle, Mail } from 'lucide-react';

const API_URL = () => (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

interface Props {
  token?: string;
  onGoToLogin: () => void;
}

const VerifyEmail: React.FC<Props> = ({ token, onGoToLogin }) => {
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>(token ? 'verifying' : 'pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL()}/api/verify-email/${token}`)
      .then(r => { setStatus('success'); setMessage(r.data.message); })
      .catch(e => { setStatus('error'); setMessage(e.response?.data?.error || 'Verification failed'); });
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <Shield className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">PhishGuard</h2>

        {status === 'pending' && (
          <>
            <Mail className="h-16 w-16 text-blue-500 mx-auto my-6" />
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Check your email</h3>
            <p className="text-gray-600 mb-6">
              We've sent a verification link to your email address. Click the link in the email to activate your account.
            </p>
            <p className="text-sm text-gray-500 mb-6">Didn't receive it? Check your spam folder.</p>
          </>
        )}

        {status === 'verifying' && (
          <>
            <div className="my-8 flex justify-center">
              <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-600">Verifying your email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto my-6" />
            <h3 className="text-xl font-semibold text-green-700 mb-3">Email Verified!</h3>
            <p className="text-gray-600 mb-6">{message || 'Your account is now active.'}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto my-6" />
            <h3 className="text-xl font-semibold text-red-700 mb-3">Verification Failed</h3>
            <p className="text-gray-600 mb-6">{message}</p>
          </>
        )}

        <button
          onClick={onGoToLogin}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;
