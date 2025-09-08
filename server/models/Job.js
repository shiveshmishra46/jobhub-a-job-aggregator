import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  company: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    logo: String,
    website: String,
    description: String,
    industry: String,
    size: String
  },
  location: {
    type: String,
    required: true,
    index: true
  },
  workMode: {
    type: String,
    enum: ['remote', 'onsite', 'hybrid'],
    required: true,
    index: true
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
    required: true,
    index: true
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
    required: true,
    index: true
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'yearly'
    }
  },
  skills: {
    type: [String],
    required: true,
    index: true
  },
  requirements: [String],
  benefits: [String],
  responsibilities: [String],
  applicationUrl: String,
  applicationDeadline: Date,
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  category: {
    type: String,
    index: true
  },
  tags: [String],
  views: {
    type: Number,
    default: 0
  },
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  }],
  source: {
    type: String,
    enum: ['internal', 'linkedin', 'indeed', 'glassdoor', 'naukri'],
    default: 'internal'
  },
  externalId: String,
  externalUrl: String,
  lastSynced: Date
}, {
  timestamps: true
});

// Indexes for search and filtering
jobSchema.index({ title: 'text', description: 'text', 'company.name': 'text' });
jobSchema.index({ location: 1, workMode: 1, jobType: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ featured: -1, createdAt: -1 });
jobSchema.index({ postedBy: 1, isActive: 1 });

// Virtual for application count
jobSchema.virtual('applicationCount').get(function() {
  return this.applications ? this.applications.length : 0;
});

// Method to increment views
jobSchema.methods.incrementViews = function() {
  return this.updateOne({ $inc: { views: 1 } });
};

// Static method for search
jobSchema.statics.searchJobs = function(query, filters = {}) {
  const searchQuery = { isActive: true };
  
  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  // Apply filters
  if (filters.location) {
    searchQuery.location = new RegExp(filters.location, 'i');
  }
  
  if (filters.workMode) {
    searchQuery.workMode = filters.workMode;
  }
  
  if (filters.jobType) {
    searchQuery.jobType = filters.jobType;
  }
  
  if (filters.experienceLevel) {
    searchQuery.experienceLevel = filters.experienceLevel;
  }
  
  if (filters.skills && filters.skills.length > 0) {
    searchQuery.skills = { $in: filters.skills };
  }
  
  if (filters.salaryMin || filters.salaryMax) {
    searchQuery['salary.min'] = {};
    if (filters.salaryMin) {
      searchQuery['salary.min'].$gte = parseInt(filters.salaryMin);
    }
    if (filters.salaryMax) {
      searchQuery['salary.max'] = { $lte: parseInt(filters.salaryMax) };
    }
  }
  
  return this.find(searchQuery)
    .populate('postedBy', 'name company')
    .sort({ featured: -1, createdAt: -1 });
};

export default mongoose.model('Job', jobSchema);