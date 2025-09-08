import express from 'express';
import { body, validationResult } from 'express-validator';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { authenticateToken, requireStudent, requireRecruiter } from '../middleware/auth.js';

const router = express.Router();

// Apply for a job (students only)
router.post('/', authenticateToken, requireStudent, [
  body('jobId').isMongoId().withMessage('Valid job ID required'),
  body('coverLetter').optional().trim().isLength({ max: 2000 }).withMessage('Cover letter too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { jobId, coverLetter } = req.body;

    // Check if job exists and is active
    const job = await Job.findOne({ _id: jobId, isActive: true })
      .populate('postedBy', '_id');

    if (!job) {
      return res.status(404).json({ message: 'Job not found or no longer active' });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      candidate: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Create application
    const application = new Application({
      job: jobId,
      candidate: req.user._id,
      recruiter: job.postedBy._id,
      coverLetter,
      resume: req.user.profile?.resume || null
    });

    await application.save();

    // Add application to job
    job.applications.push(application._id);
    await job.save();

    // Populate application for response
    const populatedApplication = await Application.findById(application._id)
      .populate('job', 'title company')
      .populate('candidate', 'name email profile')
      .populate('recruiter', 'name email');

    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${job.postedBy._id}`).emit('newApplication', {
        message: `New application received for ${job.title}`,
        application: populatedApplication
      });
    }

    res.status(201).json({
      message: 'Application submitted successfully',
      application: populatedApplication
    });

  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({ message: 'Server error while submitting application' });
  }
});

// Get user's applications (students only)
router.get('/my-applications', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { candidate: req.user._id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await Application.find(filter)
      .populate('job', 'title company location jobType workMode salary')
      .populate('recruiter', 'name company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(filter);

    const pagination = {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
      hasNext: skip + parseInt(limit) < total,
      hasPrev: parseInt(page) > 1
    };

    res.json({
      applications,
      pagination
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Server error while fetching applications' });
  }
});

// Get applications for recruiter's jobs (recruiters only)
router.get('/received', authenticateToken, requireRecruiter, async (req, res) => {
  try {
    const { status, jobId, page = 1, limit = 20 } = req.query;

    const filter = { recruiter: req.user._id };
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (jobId) {
      filter.job = jobId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await Application.find(filter)
      .populate('job', 'title company location')
      .populate('candidate', 'name email profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(filter);

    const pagination = {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
      hasNext: skip + parseInt(limit) < total,
      hasPrev: parseInt(page) > 1
    };

    res.json({
      applications,
      pagination
    });

  } catch (error) {
    console.error('Get received applications error:', error);
    res.status(500).json({ message: 'Server error while fetching applications' });
  }
});

// Update application status (recruiters only)
router.put('/:id/status', authenticateToken, requireRecruiter, [
  body('status').isIn(['pending', 'reviewed', 'shortlisted', 'interview-scheduled', 'rejected', 'hired'])
    .withMessage('Invalid status'),
  body('notes').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { status, notes } = req.body;

    const application = await Application.findOne({
      _id: req.params.id,
      recruiter: req.user._id
    }).populate('candidate', 'name email')
      .populate('job', 'title company');

    if (!application) {
      return res.status(404).json({ message: 'Application not found or unauthorized' });
    }

    // Update status with timeline
    await application.updateStatus(status, req.user._id, notes);

    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      const statusMessages = {
        reviewed: 'Your application has been reviewed',
        shortlisted: 'Congratulations! You have been shortlisted',
        'interview-scheduled': 'Interview has been scheduled',
        rejected: 'Application status updated',
        hired: 'Congratulations! You have been hired'
      };

      io.to(`user_${application.candidate._id}`).emit('applicationUpdate', {
        message: `${statusMessages[status]} for ${application.job.title}`,
        applicationId: application._id,
        status,
        job: application.job
      });
    }

    res.json({
      message: 'Application status updated successfully',
      application
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Server error while updating application status' });
  }
});

// Schedule interview (recruiters only)
router.put('/:id/interview', authenticateToken, requireRecruiter, [
  body('date').isISO8601().withMessage('Valid date required'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time required (HH:MM)'),
  body('type').isIn(['phone', 'video', 'in-person']).withMessage('Invalid interview type'),
  body('location').optional().trim(),
  body('meetingLink').optional().isURL(),
  body('notes').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const application = await Application.findOne({
      _id: req.params.id,
      recruiter: req.user._id
    }).populate('candidate', 'name email')
      .populate('job', 'title company');

    if (!application) {
      return res.status(404).json({ message: 'Application not found or unauthorized' });
    }

    // Schedule interview
    await application.scheduleInterview(req.body);

    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${application.candidate._id}`).emit('interviewScheduled', {
        message: `Interview scheduled for ${application.job.title}`,
        applicationId: application._id,
        interview: application.interview,
        job: application.job
      });
    }

    res.json({
      message: 'Interview scheduled successfully',
      application
    });

  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({ message: 'Server error while scheduling interview' });
  }
});

// Add feedback to application (recruiters only)
router.put('/:id/feedback', authenticateToken, requireRecruiter, [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comments').optional().trim().isLength({ max: 1000 }),
  body('strengths').optional().isArray(),
  body('improvements').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const application = await Application.findOne({
      _id: req.params.id,
      recruiter: req.user._id
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found or unauthorized' });
    }

    // Add feedback
    application.feedback = {
      ...application.feedback,
      ...req.body
    };

    await application.save();

    res.json({
      message: 'Feedback added successfully',
      application
    });

  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({ message: 'Server error while adding feedback' });
  }
});

// Withdraw application (students only)
router.delete('/:id', authenticateToken, requireStudent, [
  body('reason').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      candidate: req.user._id
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found or unauthorized' });
    }

    if (application.status === 'hired') {
      return res.status(400).json({ message: 'Cannot withdraw application after being hired' });
    }

    // Mark as withdrawn
    application.withdrawnAt = new Date();
    application.withdrawnReason = req.body.reason;
    application.status = 'withdrawn';

    await application.save();

    res.json({
      message: 'Application withdrawn successfully'
    });

  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({ message: 'Server error while withdrawing application' });
  }
});

// Get application statistics (recruiters only)
router.get('/stats', authenticateToken, requireRecruiter, async (req, res) => {
  try {
    const stats = await Application.getStats(req.user._id);
    
    const formattedStats = {
      total: 0,
      pending: 0,
      reviewed: 0,
      shortlisted: 0,
      'interview-scheduled': 0,
      rejected: 0,
      hired: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.json(formattedStats);

  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({ message: 'Server error while fetching application statistics' });
  }
});

export default router;