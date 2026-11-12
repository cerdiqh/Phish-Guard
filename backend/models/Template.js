const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  sender: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['credential_harvest', 'malware', 'social_engineering', 'spear_phishing'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  indicators: { type: [String], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Template', TemplateSchema);
