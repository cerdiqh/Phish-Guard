import React, { useState, useEffect } from 'react';
import { Play, Book, Award, CheckCircle, Clock, Users, ChevronRight, RotateCcw } from 'lucide-react';

const moduleContent: Record<string, { topics: { title: string; body: string }[] }> = {
  '1': {
    topics: [
      {
        title: 'What is phishing?',
        body: 'Phishing is a cyberattack where criminals impersonate trusted entities (banks, employers, tech companies) via email, SMS, or fake websites to steal credentials, financial data, or install malware. It is the most common entry point for data breaches worldwide.',
      },
      {
        title: 'Common phishing techniques',
        body: 'Email phishing sends bulk fake messages. Spear phishing targets specific individuals using personal details. Whaling targets executives. Clone phishing duplicates a real email and replaces links. Vishing uses phone calls. Smishing uses SMS texts.',
      },
      {
        title: 'Red flags to watch for',
        body: 'Watch for: urgent or threatening language ("your account will be closed"), generic greetings ("Dear User"), mismatched sender domains (support@paypa1.com), unexpected attachments, requests for passwords or card numbers, and URLs that look almost right but are slightly off.',
      },
      {
        title: 'How to verify suspicious emails',
        body: 'Hover over links before clicking to preview the real URL. Check the sender\'s full email address, not just the display name. Contact the sender through a known phone number or website — not from contact details in the suspicious email. When in doubt, report it to your security team.',
      },
    ],
  },
  '2': {
    topics: [
      {
        title: 'Spear phishing tactics',
        body: 'Spear phishing uses public information from LinkedIn, company websites, or social media to craft highly personalised messages. Attackers may know your name, job title, manager\'s name, and recent projects, making the email look entirely legitimate.',
      },
      {
        title: 'Business email compromise',
        body: 'BEC attacks impersonate executives or vendors to request urgent wire transfers or change payment details. They often target finance staff. Red flags: unusual urgency, requests to bypass normal approval, instructions to keep the transaction secret.',
      },
      {
        title: 'Voice phishing (vishing)',
        body: 'Vishing uses phone calls where attackers pose as IT support, banks, or government officials. They create urgency and pressure you to reveal passwords or install remote access software. Legitimate IT staff never ask for your password over the phone.',
      },
      {
        title: 'Pretexting and impersonation',
        body: 'Pretexting involves creating a fabricated scenario to extract information — e.g., pretending to be an auditor needing access to systems. Always verify identity through official channels before granting access or sharing information, even if the request seems routine.',
      },
    ],
  },
  '3': {
    topics: [
      {
        title: 'SMS phishing (smishing)',
        body: 'Smishing sends fake SMS messages claiming to be from banks, delivery companies, or government agencies with malicious links. Mobile browsers make it harder to inspect URLs. Never tap links in unsolicited texts — go directly to the official app or website instead.',
      },
      {
        title: 'Malicious mobile apps',
        body: 'Attackers distribute fake apps that mimic legitimate ones (banking apps, security tools) to steal credentials or access contacts and messages. Only install apps from official stores (Google Play, App Store), and check permissions carefully before granting access.',
      },
      {
        title: 'QR code scams',
        body: 'QR codes can redirect to phishing sites or trigger downloads. Attackers place fake QR code stickers over legitimate ones in public places, or embed them in emails. Use a QR scanner that previews the URL before opening it, and be suspicious of unexpected QR codes.',
      },
      {
        title: 'Mobile browsing safety',
        body: 'Always check for HTTPS before entering credentials on mobile. Be wary of public Wi-Fi — use a VPN. Keep your OS and apps updated. Enable screen lock and remote wipe. Do not click pop-up warnings saying your phone is infected — these are usually scam ads.',
      },
    ],
  },
  '4': {
    topics: [
      {
        title: 'Immediate response steps',
        body: 'If you clicked a phishing link or submitted credentials: disconnect from the network immediately, do not click anything else, do not try to "undo" by logging in again (you may be on the fake site). Call your IT/security team right away and change your password from a trusted device.',
      },
      {
        title: 'How to report incidents',
        body: 'Report to your security team as soon as possible — even if you only suspect something. Forward suspicious emails as an attachment (not inline) so headers are preserved. Include: what you clicked, what information you entered, the time it happened, and the device you used.',
      },
      {
        title: 'Damage assessment',
        body: 'The security team will assess: were credentials exposed? Was malware downloaded? Were other accounts accessible? Early reporting dramatically limits damage. Most breaches escalate because employees wait days to report out of embarrassment — reporting quickly is the right action, not a mistake.',
      },
      {
        title: 'Recovery procedures',
        body: 'Recovery steps include: changing all passwords (starting with email and banking), enabling MFA on all accounts, scanning the device for malware, notifying affected parties if data was shared, and reviewing account activity for unauthorised actions. Document everything for the incident report.',
      },
    ],
  },
};

const quizBank: Record<string, { question: string; options: string[]; answer: number; explanation: string }[]> = {
  '1': [
    { question: 'What is the primary goal of a phishing attack?', options: ['Slow down your computer', 'Steal credentials or sensitive data', 'Send spam emails', 'Block your internet access'], answer: 1, explanation: 'Phishing aims to steal credentials, financial data, or install malware by tricking users into trusting fake communications.' },
    { question: 'Which of these is a red flag in an email?', options: ['Personalised greeting with your full name', 'Urgent threat of account suspension', 'Email from a known colleague', 'A link to your company intranet'], answer: 1, explanation: 'Urgency and threats are classic phishing tactics designed to make you act before thinking.' },
    { question: 'You receive an email from "support@paypa1.com". What should you do?', options: ['Click the link since PayPal is trusted', 'Reply asking for more details', 'Report it as phishing — the domain is fake', 'Forward it to a friend'], answer: 2, explanation: 'paypa1.com uses a number "1" instead of the letter "l" — a common lookalike domain trick.' },
    { question: 'What does hovering over a link before clicking reveal?', options: ['The sender\'s real identity', 'The actual destination URL', 'Whether the email is encrypted', 'The email\'s spam score'], answer: 1, explanation: 'Hovering shows the real URL in the status bar, letting you spot mismatched or suspicious destinations.' },
    { question: 'Which technique sends fake messages to a large number of random people?', options: ['Spear phishing', 'Vishing', 'Email phishing', 'Pretexting'], answer: 2, explanation: 'Standard email phishing casts a wide net. Spear phishing is targeted at specific individuals.' },
  ],
  '2': [
    { question: 'What makes spear phishing more dangerous than regular phishing?', options: ['It uses malware attachments', 'It is personalised with real details about you', 'It comes from known email addresses', 'It targets only executives'], answer: 1, explanation: 'Spear phishing uses personal details gathered from social media and company websites to seem legitimate.' },
    { question: 'Your CEO emails you urgently asking for a wire transfer to a new vendor. What should you do?', options: ['Process it immediately — the CEO approved it', 'Verify by calling the CEO on their known number', 'Reply to the email to confirm', 'Ask a colleague to process it instead'], answer: 1, explanation: 'BEC attacks impersonate executives. Always verify financial requests through a separate, trusted communication channel.' },
    { question: 'A caller claims to be IT support and asks for your password to fix an issue. What do you do?', options: ['Give it since they are from IT', 'Refuse — legitimate IT never asks for passwords', 'Give only part of the password', 'Ask them to email you first'], answer: 1, explanation: 'No legitimate IT professional needs your password. This is a vishing attack.' },
    { question: 'What is "pretexting"?', options: ['Sending emails before the real attack', 'Creating a fake scenario to extract information', 'Testing phishing filters', 'Adding fake text to legitimate emails'], answer: 1, explanation: 'Pretexting involves fabricating a scenario (e.g., fake auditor, vendor, support agent) to manipulate someone into sharing information.' },
    { question: 'Which department is most commonly targeted by Business Email Compromise?', options: ['Marketing', 'Engineering', 'Finance', 'HR'], answer: 2, explanation: 'Finance teams handle payments and transfers, making them the primary target for BEC attacks.' },
  ],
  '3': [
    { question: 'You receive an SMS from your bank with a link to verify your account. What should you do?', options: ['Tap the link — your bank is trusted', 'Open the bank\'s official app directly instead', 'Reply to the SMS with your account number', 'Forward it to customer service'], answer: 1, explanation: 'Go directly to the official app or website. Banks rarely send unsolicited links via SMS.' },
    { question: 'Which is the safest place to download mobile apps?', options: ['Links shared in group chats', 'Email attachments', 'Official app stores (Google Play / App Store)', 'QR codes on posters'], answer: 2, explanation: 'Official stores have security vetting processes. Third-party sources and links in messages bypass these controls.' },
    { question: 'You scan a QR code on a flyer and your phone shows a suspicious URL. What should you do?', options: ['Open it anyway — QR codes are safe', 'Do not open it and report the flyer', 'Enter your details to see what happens', 'Share it with friends to check'], answer: 1, explanation: 'Always preview QR code URLs before opening. Attackers place fake QR stickers over legitimate ones.' },
    { question: 'What is smishing?', options: ['Phishing via social media', 'Phishing via SMS text messages', 'Phishing via phone calls', 'Phishing via malicious apps'], answer: 1, explanation: 'Smishing = SMS + phishing. It uses text messages to trick victims into clicking links or calling fake numbers.' },
    { question: 'Which is the best protection when using public Wi-Fi?', options: ['Logging out of all accounts', 'Using a VPN', 'Only visiting HTTPS sites', 'Turning off notifications'], answer: 1, explanation: 'A VPN encrypts all your traffic, protecting it from anyone monitoring the same public network.' },
  ],
  '4': [
    { question: 'You clicked a link in a suspicious email. What is the FIRST thing you should do?', options: ['Change your password in the same browser', 'Disconnect from the network and call IT', 'Restart your computer', 'Delete the email'], answer: 1, explanation: 'Disconnecting prevents potential malware from spreading or data from being exfiltrated. Contact IT immediately.' },
    { question: 'Why is it important to report phishing attempts quickly?', options: ['To avoid getting in trouble', 'Early reporting limits damage and protects colleagues', 'So IT can delete the email', 'To get credit for finding it'], answer: 1, explanation: 'Most breaches escalate because employees delay reporting. Quick reporting allows the security team to contain the threat.' },
    { question: 'You entered your credentials on a phishing site. Which account should you secure FIRST?', options: ['Your social media', 'Your email account', 'Your work computer login', 'Your online shopping account'], answer: 1, explanation: 'Email is the master key — attackers use it to reset passwords on all other accounts. Secure it first.' },
    { question: 'How should you forward a suspicious email to IT for investigation?', options: ['Copy-paste the content into a new email', 'Forward it as an attachment to preserve headers', 'Screenshot it and send the image', 'Share the sender\'s name only'], answer: 1, explanation: 'Forwarding as an attachment preserves full email headers, which IT needs to trace the attack.' },
    { question: 'After a phishing incident, what should you NOT do?', options: ['Change all your passwords', 'Report it to the security team', 'Wait a few days to see if anything bad happens', 'Scan your device for malware'], answer: 2, explanation: 'Waiting dramatically increases damage. Attackers move fast — report immediately so the team can respond.' },
  ],
};

const STORAGE_KEY = 'phishguard_training_progress';

function loadProgress(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {}
}

const trainingModules = [
  { id: '1', title: 'Phishing Fundamentals', description: 'Learn to identify common phishing techniques and red flags', duration: '15 minutes', difficulty: 'Beginner', topics: ['What is phishing?', 'Common phishing techniques', 'Red flags to watch for', 'How to verify suspicious emails'] },
  { id: '2', title: 'Advanced Social Engineering', description: 'Understand sophisticated social engineering attacks', duration: '25 minutes', difficulty: 'Intermediate', topics: ['Spear phishing tactics', 'Business email compromise', 'Voice phishing (vishing)', 'Pretexting and impersonation'] },
  { id: '3', title: 'Mobile Security Awareness', description: 'Protect yourself from mobile-based phishing attacks', duration: '20 minutes', difficulty: 'Intermediate', topics: ['SMS phishing (smishing)', 'Malicious mobile apps', 'QR code scams', 'Mobile browsing safety'] },
  { id: '4', title: 'Incident Response Protocol', description: 'What to do when you encounter a phishing attempt', duration: '10 minutes', difficulty: 'Beginner', topics: ['Immediate response steps', 'How to report incidents', 'Damage assessment', 'Recovery procedures'] },
];

const Training: React.FC = () => {
  const [completedModules, setCompletedModules] = useState<Record<string, boolean>>(loadProgress);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [view, setView] = useState<'outline' | 'lesson' | 'quiz' | 'result'>('outline');
  const [topicIndex, setTopicIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const doneCount = Object.values(completedModules).filter(Boolean).length;
  const totalModules = trainingModules.length;
  const completionRate = Math.round((doneCount / totalModules) * 100);

  const getDifficultyColor = (d: string) =>
    d === 'Beginner' ? 'bg-green-100 text-green-800' : d === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

  const startModule = (id: string) => {
    setSelectedModule(id);
    setView('outline');
    setTopicIndex(0);
    setQuizIndex(0);
    setScore(0);
    setAnswered(false);
    setSelectedOption(null);
  };

  const goBack = () => {
    setSelectedModule(null);
    setView('outline');
  };

  const handleAnswer = (optIdx: number) => {
    if (answered) return;
    setSelectedOption(optIdx);
    setAnswered(true);
    if (selectedModule && quizBank[selectedModule][quizIndex].answer === optIdx) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    const questions = selectedModule ? quizBank[selectedModule] : [];
    if (quizIndex + 1 < questions.length) {
      setQuizIndex(q => q + 1);
      setAnswered(false);
      setSelectedOption(null);
    } else {
      setView('result');
      const passed = (score + (selectedOption === questions[quizIndex].answer ? 1 : 0)) >= Math.ceil(questions.length * 0.6);
      if (passed && selectedModule) {
        const updated = { ...completedModules, [selectedModule]: true };
        setCompletedModules(updated);
        saveProgress(updated);
      }
    }
  };

  const module = trainingModules.find(m => m.id === selectedModule);
  const content = selectedModule ? moduleContent[selectedModule] : null;
  const questions = selectedModule ? quizBank[selectedModule] : [];
  const finalScore = view === 'result' ? score : 0;
  const passed = finalScore >= Math.ceil(questions.length * 0.6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Awareness Training</h1>
        <p className="text-gray-600 dark:text-gray-400">Interactive training modules to improve your security awareness</p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Progress</h2>
          <div className="flex items-center">
            <Award className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">{doneCount} of {totalModules} completed</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
          <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <Book className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
            <p className="text-xl font-bold text-blue-900 dark:text-blue-300">{totalModules}</p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            <p className="text-xl font-bold text-green-900 dark:text-green-300">{doneCount}</p>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
            <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Rate</p>
            <p className="text-xl font-bold text-purple-900 dark:text-purple-300">{completionRate}%</p>
          </div>
        </div>
      </div>

      {!selectedModule ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trainingModules.map(mod => (
            <div key={mod.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{mod.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{mod.description}</p>
                </div>
                {completedModules[mod.id] && <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />}
              </div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-500 mr-1" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{mod.duration}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(mod.difficulty)}`}>{mod.difficulty}</span>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Topics:</p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {mod.topics.slice(0, 2).map((t, i) => (
                    <li key={i} className="flex items-center"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />{t}</li>
                  ))}
                  {mod.topics.length > 2 && <li className="text-gray-500">+{mod.topics.length - 2} more</li>}
                </ul>
              </div>
              <button onClick={() => startModule(mod.id)} className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${completedModules[mod.id] ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                <Play className="h-4 w-4 mr-2" />
                {completedModules[mod.id] ? 'Review Module' : 'Start Module'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{module?.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{module?.description}</p>
            </div>
            <button onClick={goBack} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">← Back</button>
          </div>

          <div className="p-6 max-w-3xl mx-auto">

            {/* OUTLINE */}
            {view === 'outline' && content && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Module Outline</h3>
                <div className="space-y-3 mb-8">
                  {content.topics.map((t, i) => (
                    <div key={i} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-medium mr-3">{i + 1}</div>
                      <span className="text-gray-700 dark:text-gray-300">{t.title}</span>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-4 justify-center">
                  <button onClick={() => { setView('lesson'); setTopicIndex(0); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center">
                    <Play className="h-4 w-4 mr-2" /> Start Training
                  </button>
                  <button onClick={() => { setView('quiz'); setQuizIndex(0); setScore(0); setAnswered(false); setSelectedOption(null); }} className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium transition-colors">
                    Take Quiz Only
                  </button>
                </div>
              </div>
            )}

            {/* LESSON */}
            {view === 'lesson' && content && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Topic {topicIndex + 1} of {content.topics.length}</span>
                  <div className="flex space-x-1">
                    {content.topics.map((_, i) => (
                      <div key={i} className={`h-2 w-8 rounded-full ${i <= topicIndex ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`} />
                    ))}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{content.topics[topicIndex].title}</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base mb-8">{content.topics[topicIndex].body}</p>
                <div className="flex justify-between">
                  <button onClick={() => topicIndex > 0 ? setTopicIndex(i => i - 1) : setView('outline')} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    ← Back
                  </button>
                  {topicIndex + 1 < content.topics.length ? (
                    <button onClick={() => setTopicIndex(i => i + 1)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  ) : (
                    <button onClick={() => { setView('quiz'); setQuizIndex(0); setScore(0); setAnswered(false); setSelectedOption(null); }} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Take Quiz →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* QUIZ */}
            {view === 'quiz' && questions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Question {quizIndex + 1} of {questions.length}</span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Score: {score}/{questions.length}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{questions[quizIndex].question}</h3>
                <div className="space-y-3 mb-6">
                  {questions[quizIndex].options.map((opt, i) => {
                    let cls = 'w-full text-left p-4 rounded-lg border-2 transition-colors ';
                    if (!answered) {
                      cls += 'border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-gray-700 dark:text-gray-300';
                    } else if (i === questions[quizIndex].answer) {
                      cls += 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300';
                    } else if (i === selectedOption) {
                      cls += 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300';
                    } else {
                      cls += 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-500';
                    }
                    return (
                      <button key={i} className={cls} onClick={() => handleAnswer(i)} disabled={answered}>
                        <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                      </button>
                    );
                  })}
                </div>
                {answered && (
                  <div className={`p-4 rounded-lg mb-6 ${selectedOption === questions[quizIndex].answer ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700'}`}>
                    <p className={`font-semibold mb-1 ${selectedOption === questions[quizIndex].answer ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {selectedOption === questions[quizIndex].answer ? '✓ Correct!' : '✗ Incorrect'}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{questions[quizIndex].explanation}</p>
                  </div>
                )}
                {answered && (
                  <div className="flex justify-end">
                    <button onClick={nextQuestion} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      {quizIndex + 1 < questions.length ? 'Next Question →' : 'See Results →'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* RESULT */}
            {view === 'result' && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">{passed ? '🎉' : '📚'}</div>
                <h3 className={`text-2xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  {passed ? 'Well Done!' : 'Keep Practising'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">You scored <strong>{score} out of {questions.length}</strong></p>
                <p className={`text-sm font-medium mb-8 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  {passed ? 'Module completed! You passed.' : `You need ${Math.ceil(questions.length * 0.6)} correct answers to pass.`}
                </p>
                <div className="flex justify-center space-x-4">
                  {!passed && (
                    <button onClick={() => { setView('quiz'); setQuizIndex(0); setScore(0); setAnswered(false); setSelectedOption(null); }} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                      <RotateCcw className="h-4 w-4 mr-2" /> Retry Quiz
                    </button>
                  )}
                  <button onClick={() => { setView('lesson'); setTopicIndex(0); }} className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    Review Lesson
                  </button>
                  <button onClick={goBack} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Back to Modules
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Book className="h-8 w-8 text-blue-600 mb-3" />
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">Security Guidelines</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Company security policies and best practices</p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Users className="h-8 w-8 text-green-600 mb-3" />
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">Report Incidents</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">How to report suspicious emails and activities</p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Award className="h-8 w-8 text-purple-600 mb-3" />
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">Certifications</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Earn badges for completed training modules</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Training;
