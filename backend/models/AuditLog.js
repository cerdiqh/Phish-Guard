const mongoose = require('mongoose');
const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: String,
  action: String,
  details: String,
  ip: String,
}, { timestamps: true });
module.exports = mongoose.model('AuditLog', AuditLogSchema);
