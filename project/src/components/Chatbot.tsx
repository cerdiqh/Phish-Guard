import React, { useState } from 'react';
import Fuse from 'fuse.js';

// Simple FAQ knowledge base (expand as needed)
const FAQ = [
  {
    question: 'How do I create a phishing campaign?',
    answer: 'Go to the Campaign Manager, click on "Create Campaign", and follow the steps to set up your phishing simulation.'
  },
  {
    question: 'How do I view reports?',
    answer: 'Navigate to the Reports section from the dashboard to view detailed analytics of your campaigns.'
  },
  {
    question: 'How do I register a new user?',
    answer: 'Go to the Register page and fill in the required information to create a new account.'
  },
  {
    question: 'How do I log in?',
    answer: 'Click the Login button on the landing page and enter your email and password.'
  },
  {
    question: 'What user roles are available?',
    answer: 'PhishGuard supports three roles: admin, manager, and employee. Admins have full access, managers can manage campaigns and templates, and employees participate in training and simulations.'
  },
  {
    question: 'How do I launch a new phishing campaign?',
    answer: 'In the Campaign Manager, click "New Campaign", fill in the campaign details, select a template, and add your targets.'
  },
  {
    question: 'How do I pause or resume a campaign?',
    answer: 'In the Campaign Manager, find your campaign and use the pause/resume button to change its status.'
  },
  {
    question: 'How do I use the Template Library?',
    answer: 'Go to the Template Library to view, create, edit, or delete phishing email templates. Only admins and managers can modify templates.'
  },
  {
    question: 'How do I access training modules?',
    answer: 'Go to the Training section to access interactive modules on phishing fundamentals, social engineering, mobile security, and incident response.'
  },
  {
    question: 'What training modules are available?',
    answer: 'Training modules include: Phishing Fundamentals, Advanced Social Engineering, Mobile Security Awareness, and Incident Response Protocol.'
  },
  {
    question: 'How do I take a quiz after training?',
    answer: 'After completing a training module, click the "Take Quiz" button to test your knowledge.'
  },
  {
    question: 'How do I report a phishing incident?',
    answer: 'Go to the Reports section or use the Report Incidents feature in the Training module to submit details about suspicious emails or activities.'
  },
  {
    question: 'What analytics are available on the dashboard?',
    answer: 'The dashboard shows live stats such as total campaigns, active campaigns, total employees, click rate, emails sent, emails failed, total opens, and total clicks.'
  },
  {
    question: 'How do I earn certificates?',
    answer: 'Complete training modules and quizzes to earn badges and certificates for your achievements.'
  },
  {
    question: 'What are security guidelines?',
    answer: 'Security guidelines provide best practices and company policies to help you stay safe from phishing and other cyber threats.'
  },
  {
    question: 'How does PhishGuard track email opens and clicks?',
    answer: 'PhishGuard uses tracking pixels and unique links in simulated phishing emails to monitor when emails are opened and links are clicked.'
  },
  {
    question: 'How do I reset my password?',
    answer: 'Currently, password reset is not implemented. Please contact your administrator if you need help.'
  },
  {
    question: 'Who can create or edit templates?',
    answer: 'Only users with the admin or manager role can create, edit, or delete phishing email templates.'
  },
  {
    question: 'What is PhishGuard?',
    answer: 'PhishGuard is a phishing awareness and simulation platform that helps organizations train employees, launch phishing simulations, and track security awareness.'
  },
  {
    question: 'Who developed PhishGuard?',
    answer: 'PhishGuard was developed by Abubakar Yahaya Baraya (Baraya), a cybersecurity enthusiast and junior pentester.'
  },
  {
    question: 'I forgot my password. What should I do?',
    answer: 'Currently, password reset is not available. Please contact your administrator for assistance.'
  },
  {
    question: 'Why can’t I create a campaign?',
    answer: 'Only users with the admin or manager role can create campaigns. Make sure you are logged in with the correct role.'
  },
  {
    question: 'How do I add targets to a campaign?',
    answer: 'When creating a campaign, you can add target email addresses in the targets section. Make sure to separate multiple emails as required.'
  },
  {
    question: 'What do the campaign statuses mean?',
    answer: 'Draft: Not started yet. Active: Running and sending emails. Paused: Temporarily stopped. Completed: Finished and closed.'
  },
  {
    question: 'How do I edit or delete a campaign?',
    answer: 'Currently, campaigns can only be paused or resumed. Editing or deleting campaigns may be added in future updates.'
  },
  {
    question: 'How do I interpret the analytics in reports?',
    answer: 'Reports show metrics like open rate, click rate, and report rate. High click rates may indicate users are falling for phishing attempts.'
  },
  {
    question: 'How do I improve my organization’s phishing resilience?',
    answer: 'Regularly run campaigns, encourage training completion, and review analytics to identify and support at-risk users.'
  },
  {
    question: 'Can I customize phishing templates?',
    answer: 'Yes, admins and managers can create and edit templates in the Template Library. You can set subject, sender, content, and difficulty.'
  },
  {
    question: 'What is a phishing simulation?',
    answer: 'A phishing simulation is a safe, controlled test where employees receive fake phishing emails to assess their awareness and response.'
  },
  {
    question: 'How do I onboard new employees?',
    answer: 'Register new users via the Register page. Assign them the appropriate role (employee, manager, or admin) during registration.'
  },
  {
    question: 'What should I do if I suspect a real phishing attack?',
    answer: 'Report the incident immediately using the Report Incidents feature or contact your IT/security team.'
  },
  {
    question: 'How do I update my profile information?',
    answer: 'Profile editing is not currently available. Please contact your administrator for changes.'
  },
  {
    question: 'What are some best practices to avoid phishing?',
    answer: 'Be cautious with unexpected emails, check sender addresses, avoid clicking suspicious links, and report anything unusual.'
  },
  {
    question: 'How do I know if I passed a training module?',
    answer: 'After completing a module and its quiz, you will see your results and may earn a badge or certificate.'
  },
  {
    question: 'Can I retake training or quizzes?',
    answer: 'Yes, you can revisit training modules and retake quizzes as often as you like to improve your knowledge.'
  },
  {
    question: 'How do I contact support?',
    answer: 'For support, contact the developer at cerdiqhbaraya@gmail.com or use the contact links on the landing page.'
  },
  {
    question: 'What is social engineering?',
    answer: 'Social engineering is the use of deception to manipulate individuals into divulging confidential information. Training modules cover this topic.'
  },
  {
    question: 'What is spear phishing?',
    answer: 'Spear phishing is a targeted phishing attack aimed at specific individuals or organizations. It is covered in the Advanced Social Engineering module.'
  },
  {
    question: 'What is smishing?',
    answer: 'Smishing is phishing conducted via SMS/text messages. Learn more in the Mobile Security Awareness module.'
  },
  {
    question: 'How do I stay safe on mobile devices?',
    answer: 'Be wary of suspicious SMS, avoid installing unknown apps, and don’t scan QR codes from untrusted sources.'
  },
  // Add more Q&A pairs as needed
];

const fuse = new Fuse(FAQ, { keys: ['question'], threshold: 0.4 });

function findAnswer(userQuestion: string, context?: string): string {
  // If context is provided, boost context-relevant answers
  let results = fuse.search(userQuestion);
  if (context) {
    // Boost answers that mention the context in the question
    results = results.sort((a, b) => {
      const aHasContext = a.item.question.toLowerCase().includes(context.toLowerCase()) ? 1 : 0;
      const bHasContext = b.item.question.toLowerCase().includes(context.toLowerCase()) ? 1 : 0;
      return bHasContext - aHasContext;
    });
  }
  if (results.length > 0) {
    return results[0].item.answer;
  }
  // Fallback if no match
  return "Sorry, I couldn't find an answer to your question. Please try rephrasing or check the documentation.";
}

// Helper to render links in text
function renderWithLinks(text: string) {
  // Regex for URLs and emails
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (!part) return null;
    if (/^https?:\/\//.test(part) || /^www\./.test(part)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return <a key={i} href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'underline' }}>{part}</a>;
    }
    if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/.test(part)) {
      return <a key={i} href={`mailto:${part}`} style={{ color: '#1976d2', textDecoration: 'underline' }}>{part}</a>;
    }
    return part;
  });
}

interface ChatbotProps {
  context?: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ context }) => {
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<{ [index: number]: 'up' | 'down' | null }>({});
  const [expanded, setExpanded] = useState<{ [index: number]: boolean }>({});
  const [minimized, setMinimized] = useState(false);
  const [topQuestions, setTopQuestions] = useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Update analytics in localStorage and state
  function updateAnalytics(question: string) {
    const analytics = JSON.parse(localStorage.getItem('chatbot_analytics') || '{}') as Record<string, number>;
    analytics[question] = (analytics[question] || 0) + 1;
    localStorage.setItem('chatbot_analytics', JSON.stringify(analytics));
    // Get top 5 questions
    const sorted = Object.entries(analytics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([q]) => q);
    setTopQuestions(sorted);
  }

  React.useEffect(() => {
    if (!minimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [minimized]);

  React.useEffect(() => {
    const analytics = JSON.parse(localStorage.getItem('chatbot_analytics') || '{}') as Record<string, number>;
    const sorted = Object.entries(analytics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([q]) => q);
    setTopQuestions(sorted);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user' as const, text: input };
    const answer = findAnswer(input, context);
    const botMessage = { sender: 'bot' as const, text: answer };
    setMessages([...messages, userMessage, botMessage]);
    setInput('');
    // Track analytics for the matched question
    if (answer !== "Sorry, I couldn't find an answer to your question. Please try rephrasing or check the documentation.") {
      // Find the matched FAQ question
      const fuseResults = fuse.search(input);
      if (fuseResults.length > 0) {
        updateAnalytics(fuseResults[0].item.question);
      }
    }
  };

  const handleFeedback = (idx: number, value: 'up' | 'down') => {
    setFeedback(prev => ({ ...prev, [idx]: value }));
  };

  if (minimized) {
    return (
      <button
        aria-label="Open chatbot"
        style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000, background: '#1976d2', color: '#fff', border: 'none', borderRadius: '50%', width: 56, height: 56, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 28, cursor: 'pointer' }}
        onClick={() => setMinimized(false)}
      >
        💬
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="PhishGuard Chatbot"
      tabIndex={-1}
      style={{ position: 'fixed', bottom: 20, right: 20, width: 320, background: '#fff', border: '1px solid #ccc', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 1000 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
        <span>PhishGuard Chatbot</span>
        <div>
          <button
            aria-label="Minimize chatbot"
            style={{ background: 'none', border: 'none', color: '#1976d2', fontSize: 20, cursor: 'pointer', marginRight: 8 }}
            onClick={() => setMinimized(true)}
            tabIndex={0}
          >
            
          </button>
          <button
            aria-label="Close chatbot"
            style={{ background: 'none', border: 'none', color: '#d32f2f', fontSize: 20, cursor: 'pointer' }}
            onClick={() => setMinimized(true)}
            tabIndex={0}
          >
            ×
          </button>
        </div>
      </div>
      {topQuestions.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee', background: '#f9f9f9' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Top Questions:</div>
          <ul style={{ paddingLeft: 16, margin: 0 }}>
            {topQuestions.map((q, i) => (
              <li key={i} style={{ fontSize: 13, marginBottom: 2, cursor: 'pointer', color: '#1976d2', textDecoration: 'underline' }}
                  tabIndex={0}
                  onClick={() => setInput(q)}
                  onKeyDown={e => { if (e.key === 'Enter') setInput(q); }}
              >{q}</li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ maxHeight: 240, overflowY: 'auto', padding: 12 }}>
        {messages.map((msg, idx) => {
          const isLong = msg.sender === 'bot' && msg.text.length > 120;
          const showFull = expanded[idx];
          const displayText = isLong && !showFull ? msg.text.slice(0, 120) + '...' : msg.text;
          return (
            <div key={idx} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', margin: '8px 0' }}>
              <span style={{ background: msg.sender === 'user' ? '#e0f7fa' : '#f1f8e9', padding: '6px 12px', borderRadius: 16, display: 'inline-block' }}>{msg.sender === 'bot' ? renderWithLinks(displayText) : displayText}</span>
              {isLong && (
                <button
                  style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: 12, marginLeft: 4 }}
                  onClick={() => setExpanded(prev => ({ ...prev, [idx]: !showFull }))}
                  aria-label={showFull ? 'Show less' : 'Read more'}
                  tabIndex={0}
                >
                  {showFull ? 'Show less' : 'Read more'}
                </button>
              )}
              {/* Feedback for bot answers */}
              {msg.sender === 'bot' && (
                <div style={{ marginTop: 4, textAlign: 'left' }}>
                  <button
                    aria-label="Thumbs up"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: feedback[idx] === 'up' ? '#1976d2' : '#bbb',
                      fontSize: 18,
                      cursor: 'pointer',
                      marginRight: 8
                    }}
                    onClick={() => handleFeedback(idx, 'up')}
                    disabled={!!feedback[idx]}
                    tabIndex={0}
                  >
                    👍
                  </button>
                  <button
                    aria-label="Thumbs down"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: feedback[idx] === 'down' ? '#d32f2f' : '#bbb',
                      fontSize: 18,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleFeedback(idx, 'down')}
                    disabled={!!feedback[idx]}
                    tabIndex={0}
                  >
                    👎
                  </button>
                  {feedback[idx] && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>
                      {feedback[idx] === 'up' ? 'Thanks for your feedback!' : 'Sorry this wasn\'t helpful.'}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid #eee', padding: 8 }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Ask me about PhishGuard..."
          style={{ flex: 1, border: 'none', outline: 'none', padding: 8 }}
          aria-label="Chatbot input"
        />
        <button
          onClick={handleSend}
          style={{ marginLeft: 8, padding: '8px 16px', borderRadius: 8, background: '#1976d2', color: '#fff', border: 'none' }}
          aria-label="Send message"
          tabIndex={0}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot; 