const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    currentStock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    minLevel: {
      type: Number,
      required: true,
      default: 10,
      min: [0, 'Minimum level cannot be negative'],
    },
    unit: {
      type: String,
      default: 'pcs',
    },
  },
  { timestamps: true }
);

inventorySchema.index({ menuItem: 1, branch: 1 }, { unique: true });

inventorySchema.virtual('status').get(function () {
  if (this.currentStock <= 0) return 'out_of_stock';
  if (this.currentStock <= this.minLevel) return 'low';
  return 'ok';
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
