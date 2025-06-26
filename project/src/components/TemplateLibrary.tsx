import React, { useState } from 'react';
import { Mail, AlertTriangle, Eye, Copy, Plus } from 'lucide-react';
import { mockTemplates } from '../data/mockData';
import { PhishingTemplate } from '../types';

interface TemplateLibraryProps {
  user?: any;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ user }) => {
  const [templates, setTemplates] = useState<PhishingTemplate[]>(mockTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<PhishingTemplate | null>(null);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<PhishingTemplate | null>(null);
  const [templateInProgress, setTemplateInProgress] = useState({
    name: '',
    subject: '',
    sender: '',
    content: '',
    type: 'credential_harvest' as PhishingTemplate['type'],
    difficulty: 'easy' as PhishingTemplate['difficulty'],
    indicators: [''],
  });

  const getTypeIcon = (type: PhishingTemplate['type']) => {
    switch (type) {
      case 'credential_harvest':
        return '🔐';
      case 'malware':
        return '🦠';
      case 'social_engineering':
        return '👤';
      case 'spear_phishing':
        return '🎯';
      default:
        return '📧';
    }
  };

  const getDifficultyColor = (difficulty: PhishingTemplate['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderEmailPreview = (template: PhishingTemplate) => {
    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm max-w-2xl">
        {/* Email Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Phishing Simulation</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-600">SIMULATION</span>
            </div>
          </div>
        </div>

        {/* Email Content */}
        <div className="p-4">
          <div className="border-b border-gray-200 pb-3 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">From:</p>
                <p className="text-sm font-medium text-gray-900">{template.sender}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Subject:</p>
                <p className="text-sm font-medium text-gray-900">{template.subject}</p>
              </div>
            </div>
          </div>

          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm text-gray-800">
              {template.content.replace('[PHISHING_LINK]', '🔗 [SIMULATED PHISHING LINK]')}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Library</h1>
          <p className="text-gray-600">Pre-built phishing email templates for security awareness training</p>
        </div>
        {['admin', 'manager'].includes(user?.role) && (
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors" onClick={() => setShowNewTemplateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </button>
        )}
      </div>

      {!selectedTemplate ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.filter(template => template != null).map((template) => {
            // Additional safety check to ensure template is not null
            if (!template) return null;
            
            return (
              <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getTypeIcon(template.type)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{template.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                    {template.difficulty}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Subject:</p>
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded">{template.subject}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Key Indicators:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.indicators?.slice(0, 2).map((indicator, index) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        {indicator}
                      </span>
                    ))}
                    {template.indicators && template.indicators.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{template.indicators.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedTemplate(template)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </button>
                  {['admin', 'manager'].includes(user?.role) && (
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center" onClick={() => alert('Template selected for use!')}>
                      <Copy className="h-4 w-4 mr-1" />
                      Use
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">{selectedTemplate.name}</h2>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Templates
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Email Preview</h3>
              {renderEmailPreview(selectedTemplate)}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Template Details</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700">Type</h4>
                  <p className="text-sm text-gray-900 mt-1 capitalize flex items-center">
                    <span className="mr-2">{getTypeIcon(selectedTemplate.type)}</span>
                    {selectedTemplate.type.replace('_', ' ')}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700">Difficulty</h4>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getDifficultyColor(selectedTemplate.difficulty)}`}>
                    {selectedTemplate.difficulty}
                  </span>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Red Flags</h4>
                  <div className="space-y-2">
                    {selectedTemplate.indicators?.map((indicator, index) => (
                      <div key={index} className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-sm text-gray-900">{indicator}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  {['admin', 'manager'].includes(user?.role) && (
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors" onClick={() => alert('Template selected for use!')}>
                      Use Template
                    </button>
                  )}
                  {['admin', 'manager'].includes(user?.role) && (
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors" onClick={() => { setTemplateToEdit(selectedTemplate); setShowEditTemplateModal(true); }}>
                      Edit Copy
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for New Template */}
      {showNewTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Template</h2>
            <form onSubmit={e => {
              e.preventDefault();
              setTemplates(prev => [
                {
                  ...templateInProgress,
                  id: (prev.length + 1).toString(),
                  indicators: templateInProgress.indicators.filter(i => i.trim()),
                },
                ...prev,
              ]);
              setShowNewTemplateModal(false);
              setTemplateInProgress({ name: '', subject: '', sender: '', content: '', type: 'credential_harvest', difficulty: 'easy', indicators: [''] });
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" required className="w-full border border-gray-300 rounded px-3 py-2" value={templateInProgress.name} onChange={e => setTemplateInProgress({ ...templateInProgress, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input type="text" required className="w-full border border-gray-300 rounded px-3 py-2" value={templateInProgress.subject} onChange={e => setTemplateInProgress({ ...templateInProgress, subject: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender</label>
                <input type="text" required className="w-full border border-gray-300 rounded px-3 py-2" value={templateInProgress.sender} onChange={e => setTemplateInProgress({ ...templateInProgress, sender: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea required className="w-full border border-gray-300 rounded px-3 py-2" value={templateInProgress.content} onChange={e => setTemplateInProgress({ ...templateInProgress, content: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2" value={templateInProgress.type} onChange={e => setTemplateInProgress({ ...templateInProgress, type: e.target.value as PhishingTemplate['type'] })}>
                  <option value="credential_harvest">Credential Harvest</option>
                  <option value="malware">Malware</option>
                  <option value="social_engineering">Social Engineering</option>
                  <option value="spear_phishing">Spear Phishing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2" value={templateInProgress.difficulty} onChange={e => setTemplateInProgress({ ...templateInProgress, difficulty: e.target.value as PhishingTemplate['difficulty'] })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Indicators (comma separated)</label>
                <input type="text" className="w-full border border-gray-300 rounded px-3 py-2" value={templateInProgress.indicators.join(', ')} onChange={e => setTemplateInProgress({ ...templateInProgress, indicators: e.target.value.split(',').map(i => i.trim()) })} />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={() => setShowNewTemplateModal(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal for Edit Template */}
      {showEditTemplateModal && templateToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Template</h2>
            <form onSubmit={e => {
              e.preventDefault();
              setTemplates(prev => prev.map(t => t.id === templateToEdit.id ? { ...templateToEdit, ...templateInProgress, indicators: templateInProgress.indicators.filter(i => i.trim()) } : t));
              setShowEditTemplateModal(false);
              setTemplateToEdit(null);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" required className="w-full border border-gray-300 rounded px-3 py-2" value={templateInProgress.name} onChange={e => setTemplateInProgress({ ...templateInProgress, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input type="text" required className="w-full border border-gray-300 rounded px-3 py-2" value={templateInProgress.subject} onChange={e => setTemplateInProgress({ ...templateInProgress, subject: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender</label>
                <input type="text" required className="w-full border border-gray-300 rounded px-3 py-2" value={templateInProgress.sender} onChange={e => setTemplateInProgress({ ...templateInProgress, sender: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea required className="w-full border border-gray-300 rounded px-3 py-2" value={templateInProgress.content} onChange={e => setTemplateInProgress({ ...templateInProgress, content: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2" value={templateInProgress.type} onChange={e => setTemplateInProgress({ ...templateInProgress, type: e.target.value as PhishingTemplate['type'] })}>
                  <option value="credential_harvest">Credential Harvest</option>
                  <option value="malware">Malware</option>
                  <option value="social_engineering">Social Engineering</option>
                  <option value="spear_phishing">Spear Phishing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2" value={templateInProgress.difficulty} onChange={e => setTemplateInProgress({ ...templateInProgress, difficulty: e.target.value as PhishingTemplate['difficulty'] })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Indicators (comma separated)</label>
                <input type="text" className="w-full border border-gray-300 rounded px-3 py-2" value={templateInProgress.indicators.join(', ')} onChange={e => setTemplateInProgress({ ...templateInProgress, indicators: e.target.value.split(',').map(i => i.trim()) })} />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={() => setShowEditTemplateModal(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;