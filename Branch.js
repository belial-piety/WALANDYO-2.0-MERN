const mongoose = require('mongoose');

const orderAuditLogSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    action: {
      type: String,
      enum: ['created', 'voided', 'reprinted'],
      required: true,
    },
    notes: {
      type: String,
      default: null,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    staffNameSnap: {
      type: String,
      default: '',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('OrderAuditLog', orderAuditLogSchema);
