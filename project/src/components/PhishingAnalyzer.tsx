import React, { useState } from 'react';

const PhishingAnalyzer: React.FC = () => {
  const [emailText, setEmailText] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setAnalysis('');
    try {
      const res = await fetch(`${API_URL}/api/analyze-phishing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailText })
      });
      if (!res.ok) throw new Error('Failed to analyze email');
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'Error analyzing email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Phishing Email Analyzer (AI-Powered)</h2>
      <textarea
        className="w-full border border-gray-300 rounded p-3 mb-4 min-h-[120px]"
        placeholder="Paste a suspicious email here..."
        value={emailText}
        onChange={e => setEmailText(e.target.value)}
        disabled={loading}
      />
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold disabled:opacity-50"
        onClick={handleAnalyze}
        disabled={!emailText.trim() || loading}
      >
        {loading ? 'Analyzing...' : 'Analyze Email'}
      </button>
      {error && <div className="text-red-600 mt-4">{error}</div>}
      {analysis && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
          <h3 className="font-semibold mb-2 text-green-700">AI Analysis:</h3>
          <pre className="whitespace-pre-wrap text-gray-800">{analysis}</pre>
        </div>
      )}
    </div>
  );
};

export default PhishingAnalyzer; 