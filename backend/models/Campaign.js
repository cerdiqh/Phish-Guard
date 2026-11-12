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
      error: String,
      openCount: { type: Number, default: 0 },
      clickCount: { type: Number, default: 0 },
      lastOpenedAt: Date,
      lastClickedAt: Date,
    }
  ],
  scheduledAt: Date,
  reminderSent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Campaign', CampaignSchema); 