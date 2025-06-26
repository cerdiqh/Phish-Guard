import React, { useState } from 'react';
import { Play, Book, Award, CheckCircle, Clock, Users } from 'lucide-react';

const Training: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [showTraining, setShowTraining] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<string | null>(null);

  const trainingModules = [
    {
      id: '1',
      title: 'Phishing Fundamentals',
      description: 'Learn to identify common phishing techniques and red flags',
      duration: '15 minutes',
      difficulty: 'Beginner',
      completed: false,
      topics: [
        'What is phishing?',
        'Common phishing techniques',
        'Red flags to watch for',
        'How to verify suspicious emails'
      ]
    },
    {
      id: '2',
      title: 'Advanced Social Engineering',
      description: 'Understand sophisticated social engineering attacks',
      duration: '25 minutes',
      difficulty: 'Intermediate',
      completed: true,
      topics: [
        'Spear phishing tactics',
        'Business email compromise',
        'Voice phishing (vishing)',
        'Pretexting and impersonation'
      ]
    },
    {
      id: '3',
      title: 'Mobile Security Awareness',
      description: 'Protect yourself from mobile-based phishing attacks',
      duration: '20 minutes',
      difficulty: 'Intermediate',
      completed: false,
      topics: [
        'SMS phishing (smishing)',
        'Malicious mobile apps',
        'QR code scams',
        'Mobile browsing safety'
      ]
    },
    {
      id: '4',
      title: 'Incident Response Protocol',
      description: 'What to do when you encounter a phishing attempt',
      duration: '10 minutes',
      difficulty: 'Beginner',
      completed: true,
      topics: [
        'Immediate response steps',
        'How to report incidents',
        'Damage assessment',
        'Recovery procedures'
      ]
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const completedModules = trainingModules.filter(module => module.completed).length;
  const totalModules = trainingModules.length;
  const completionRate = Math.round((completedModules / totalModules) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Awareness Training</h1>
        <p className="text-gray-600">Interactive training modules to improve your security awareness</p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Progress</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Award className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">{completedModules} of {totalModules} completed</span>
            </div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Book className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Modules Available</p>
            <p className="text-xl font-bold text-blue-900">{totalModules}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-xl font-bold text-green-900">{completedModules}</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-xl font-bold text-purple-900">{completionRate}%</p>
          </div>
        </div>
      </div>

      {!selectedModule ? (
        /* Training Modules Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trainingModules.map((module) => (
            <div key={module.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.title}</h3>
                  <p className="text-sm text-gray-600">{module.description}</p>
                </div>
                {module.completed && (
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-500 mr-1" />
                  <span className="text-sm text-gray-600">{module.duration}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                  {module.difficulty}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Topics covered:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {module.topics.slice(0, 2).map((topic, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                      {topic}
                    </li>
                  ))}
                  {module.topics.length > 2 && (
                    <li className="text-gray-500">+{module.topics.length - 2} more topics</li>
                  )}
                </ul>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedModule(module.id)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                    module.completed
                      ? 'bg-green-100 hover:bg-green-200 text-green-700'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {module.completed ? 'Review' : 'Start Module'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Selected Module Detail */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {trainingModules.find(m => m.id === selectedModule)?.title}
                </h2>
                <p className="text-gray-600 mt-1">
                  {trainingModules.find(m => m.id === selectedModule)?.description}
                </p>
              </div>
              <button
                onClick={() => { setSelectedModule(null); setShowTraining(false); setShowQuiz(false); setQuizResult(null); }}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Modules
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              {/* Module Content Placeholder */}
              {!showTraining && !showQuiz && (
                <div className="text-center py-12">
                  <Play className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Training Module</h3>
                  <p className="text-gray-600 mb-6">
                    This would contain the interactive training content, videos, quizzes, and simulations.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Module Outline:</h4>
                    <div className="text-left space-y-2">
                      {trainingModules.find(m => m.id === selectedModule)?.topics.map((topic, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                            {index + 1}
                          </div>
                          <span className="text-gray-700">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors" onClick={() => { setShowTraining(true); setShowQuiz(false); }}>
                      Start Training
                    </button>
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors" onClick={() => { setShowQuiz(true); setShowTraining(false); }}>
                      Take Quiz
                    </button>
                  </div>
                </div>
              )}
              {/* Training Simulation */}
              {showTraining && (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Training Simulation</h3>
                  <p className="text-gray-600 mb-6">(Simulated) You are now viewing interactive training content for this module.</p>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors" onClick={() => setShowTraining(false)}>
                    Finish Training
                  </button>
                </div>
              )}
              {/* Quiz Modal/Section */}
              {showQuiz && (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Quiz</h3>
                  <p className="text-gray-600 mb-6">(Simulated) Answer this question:</p>
                  <div className="mb-4">
                    <p className="font-medium">What is a common sign of a phishing email?</p>
                    <div className="flex flex-col items-center space-y-2 mt-2">
                      <button className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200" onClick={() => setQuizResult('correct')}>Urgent request for sensitive info</button>
                      <button className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200" onClick={() => setQuizResult('incorrect')}>Email from your manager</button>
                    </div>
                  </div>
                  {quizResult && (
                    <div className="mt-4">
                      <span className={quizResult === 'correct' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                        {quizResult === 'correct' ? 'Correct!' : 'Incorrect. Try again!'}
                      </span>
                      <div className="mt-4">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => { setShowQuiz(false); setQuizResult(null); }}>
                          Close Quiz
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Additional Resources */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <Book className="h-8 w-8 text-blue-600 mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Security Guidelines</h4>
            <p className="text-sm text-gray-600">Company security policies and best practices</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <Users className="h-8 w-8 text-green-600 mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Report Incidents</h4>
            <p className="text-sm text-gray-600">How to report suspicious emails and activities</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <Award className="h-8 w-8 text-purple-600 mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Certifications</h4>
            <p className="text-sm text-gray-600">Earn badges and certificates for completed training</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Training;