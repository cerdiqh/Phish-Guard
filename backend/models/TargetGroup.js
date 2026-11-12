const mongoose = require('mongoose');
const TargetGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targets: [{ email: String, name: String, department: String }],
}, { timestamps: true });
module.exports = mongoose.model('TargetGroup', TargetGroupSchema);
