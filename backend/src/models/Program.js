const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema(
  {
    programName: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    language: {
      type: String,
      required: true,
      trim: true,
    },
    vidwans: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vidwan',
    }],
    status: {
      type: String,
      enum: ['Tentative', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Tentative',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index to optimize date range overlaps query
ProgramSchema.index({ startDate: 1, endDate: 1 });
ProgramSchema.index({ vidwans: 1 });

module.exports = mongoose.model('Program', ProgramSchema);
