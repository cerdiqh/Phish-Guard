import React from 'react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-blue-50 to-purple-100">
      {/* Header/Logo */}
      <div className="flex flex-col items-center mt-20 animate-fade-in">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-4 shadow-lg animate-bounce">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="32" fill="#fff" />
            <path d="M32 16L48 24V40L32 48L16 40V24L32 16Z" fill="#6366F1" />
            <circle cx="32" cy="32" r="6" fill="#3B82F6" />
          </svg>
        </div>
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mt-6 animate-slide-in">PhishGuard</h1>
        <p className="mt-4 text-lg text-gray-700 max-w-xl text-center animate-fade-in-slow">
          <span className="font-semibold text-blue-600">PhishGuard</span> is your all-in-one phishing awareness and simulation platform. Launch realistic phishing campaigns, track employee responses, and boost your organization's security culture with interactive training and real-time analytics.
        </p>
        <div className="flex space-x-6 mt-10 animate-fade-in-slow">
          <button onClick={onRegister} className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-lg font-semibold shadow-lg hover:scale-105 transform transition-all duration-200">Register</button>
          <button onClick={onLogin} className="px-8 py-3 bg-white text-blue-700 border border-blue-500 rounded-lg text-lg font-semibold shadow-lg hover:bg-blue-50 hover:scale-105 transform transition-all duration-200">Login</button>
        </div>
      </div>
      {/* About the Developer */}
      <div className="flex justify-center mt-16 mb-10 animate-dev-fade-slide">
        <div className="relative bg-white/60 backdrop-blur-lg border border-purple-200 shadow-2xl rounded-3xl p-8 w-full max-w-2xl flex flex-col md:flex-row items-center md:items-center gap-8 transition-transform hover:scale-[1.025]">
          {/* Developer Photo */}
          <div className="flex-shrink-0 flex items-center justify-center w-full md:w-auto">
            <img
              src="/developer-photo.jpg"
              alt="ABUBAKAR YAHAYA BARAYA (Baraya)"
              className="w-32 h-32 rounded-full object-cover border-4 border-purple-400 shadow-lg ring-4 ring-white/60 transition-transform duration-500 hover:scale-105"
              style={{ background: '#f3f4f6' }}
            />
          </div>
          <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left max-w-xl">
            <h2 className="text-3xl font-extrabold text-purple-700 mb-2 tracking-tight animate-dev-title">
              ABUBAKAR YAHAYA BARAYA <span className="text-base text-purple-400">(Baraya)</span>
            </h2>
            <p className="text-lg text-gray-700 mb-2 animate-dev-bio">
              Cybersecurity enthusiast, <span className="text-yellow-600 font-semibold">bug bounty hunter</span>, and <span className="text-pink-600 font-semibold">junior pentester</span> passionate about making the digital world safer. Creator of PhishGuard.
            </p>
            <p className="text-gray-600 mb-2 animate-dev-bio">
              Driven by curiosity and a love for ethical hacking, I help organizations defend against phishing threats. When not hunting bugs, I enjoy chess, Call of Duty Mobile, and anime.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 animate-dev-social w-full">
              <a href="mailto:cerdiqhbaraya@gmail.com" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 transition shadow text-base font-medium mb-2">
                <svg className="w-5 h-5 text-blue-600 group-hover:scale-110 transition" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4z" stroke="none"/><path d="M4 4l8 8 8-8"/></svg>
                cerdiqhbaraya
              </a>
              <a href="https://github.com/cerdiqh" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition shadow text-base font-medium mb-2">
                <svg className="w-5 h-5 text-gray-800 group-hover:scale-110 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.49 2.87 8.3 6.84 9.64.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.38 9.38 0 0112 6.8c.85.004 1.7.12 2.5.35 1.9-1.33 2.74-1.05 2.74-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.58.69.48A10.01 10.01 0 0022 12.26C22 6.58 17.52 2 12 2z"/></svg>
                cerdiqh
              </a>
              <a href="https://x.com/cerdiqh" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-4 py-2 rounded-full bg-black hover:bg-gray-900 transition shadow text-base font-medium text-white mb-2">
                <svg className="w-5 h-5 text-white group-hover:scale-110 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M17.53 2H6.47A4.47 4.47 0 002 6.47v11.06A4.47 4.47 0 006.47 22h11.06A4.47 4.47 0 0022 17.53V6.47A4.47 4.47 0 0017.53 2zM8.94 17.53l2.53-3.7 2.53 3.7H8.94zm6.12-1.41l-2.53-3.7 2.53-3.7v7.4zm-7.4-7.4l2.53 3.7-2.53 3.7v-7.4zm1.41-1.41h7.4l-3.7 2.53-3.7-2.53zm7.4 7.4l-2.53-3.7 2.53-3.7v7.4z"/></svg>
                @cerdiqh
              </a>
              <a href="https://www.linkedin.com/in/abubakar-baraya-34b041353/" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 hover:bg-blue-200 transition shadow text-base font-medium mb-2">
                <svg className="w-5 h-5 text-blue-700 group-hover:scale-110 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.29c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm15.5 10.29h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.75 1.37-1.54 2.82-1.54 3.01 0 3.57 1.98 3.57 4.56v4.75z"/></svg>
                abubakar-baraya
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* Animations for Developer Section */}
      <style>{`
        .animate-dev-fade-slide { animation: devFadeSlide 1.2s cubic-bezier(.4,2,.6,1); }
        .animate-dev-title { animation: fadeIn 1.2s .2s both; }
        .animate-dev-bio { animation: fadeIn 1.2s .4s both; }
        .animate-dev-social { animation: fadeIn 1.2s .6s both; }
        @keyframes devFadeSlide { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default LandingPage; 