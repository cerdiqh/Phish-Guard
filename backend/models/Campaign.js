const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  name: String,
  description: String,
  status: { type: String, enum: ['draft', 'active', 'completed', 'paused'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  targetCount: Number,
  clickCount: Number,
  reportCount: Number,
  template: Object,
  targets: Array,
  emailStatus: [
    {
      email: String,
      status: String,
      error: String
    }
  ]
});

module.exports = mongoose.model('Campaign', CampaignSchema); 