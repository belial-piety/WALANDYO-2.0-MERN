const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
    },
    normalizedName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function () {
  if (this.name) {
    this.normalizedName = this.name.toLowerCase().trim();
  }
});

module.exports = mongoose.model('Category', categorySchema);
