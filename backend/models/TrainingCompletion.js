const mongoose = require('mongoose');
const TrainingCompletionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moduleId: { type: String, required: true },
  score: Number,
  passed: Boolean,
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });
module.exports = mongoose.model('TrainingCompletion', TrainingCompletionSchema);
