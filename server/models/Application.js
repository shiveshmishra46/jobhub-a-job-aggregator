import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'interview-scheduled', 'rejected', 'hired'],
    default: 'pending',
    index: true
  },
  coverLetter: String,
  resume: {
    fileId: mongoose.Schema.Types.ObjectId,
    filename: String,
    contentType: String
  },
  interview: {
    scheduled: { type: Boolean, default: false },
    date: Date,
    time: String,
    type: {
      type: String,
      enum: ['phone', 'video', 'in-person']
    },
    location: String,
    meetingLink: String,
    notes: String
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    strengths: [String],
    improvements: [String]
  },
  timeline: [{
    status: String,
    date: { type: Date, default: Date.now },
    notes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  withdrawnAt: Date,
  withdrawnReason: String
}, {
  timestamps: true
});

// Compound indexes
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ candidate: 1, status: 1 });
applicationSchema.index({ recruiter: 1, status: 1 });
applicationSchema.index({ createdAt: -1 });

// Pre-save middleware to add timeline entry
applicationSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      status: this.status,
      date: new Date()
    });
  }
  next();
});

// Method to update status with timeline
applicationSchema.methods.updateStatus = function(newStatus, updatedBy, notes) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    date: new Date(),
    notes,
    updatedBy
  });
  return this.save();
};

// Method to schedule interview
applicationSchema.methods.scheduleInterview = function(interviewData) {
  this.interview = {
    ...interviewData,
    scheduled: true
  };
  this.status = 'interview-scheduled';
  this.timeline.push({
    status: 'interview-scheduled',
    date: new Date(),
    notes: `Interview scheduled for ${interviewData.date}`
  });
  return this.save();
};

// Static method to get application stats
applicationSchema.statics.getStats = function(recruiterId) {
  return this.aggregate([
    { $match: { recruiter: recruiterId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

export default mongoose.model('Application', applicationSchema);