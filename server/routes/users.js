import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('profile.resume')
      .populate('profile.profilePicture')
      .populate('company.logo');

    res.json(user.getPublicProfile());

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('profile.phone').optional().isMobilePhone(),
  body('profile.bio').optional().trim().isLength({ max: 500 }),
  body('profile.skills').optional().isArray(),
  body('profile.linkedinUrl').optional().isURL(),
  body('profile.githubUrl').optional().isURL(),
  body('profile.portfolioUrl').optional().isURL(),
  body('company.website').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const updates = req.body;
    
    // Merge nested objects properly
    if (updates.profile) {
      updates.profile = { ...req.user.profile, ...updates.profile };
    }
    if (updates.company) {
      updates.company = { ...req.user.company, ...updates.company };
    }
    if (updates.preferences) {
      updates.preferences = { ...req.user.preferences, ...updates.preferences };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'student') {
      // Student dashboard stats
      const totalApplications = await Application.countDocuments({ candidate: userId });
      const pendingApplications = await Application.countDocuments({ 
        candidate: userId, 
        status: 'pending' 
      });
      const shortlistedApplications = await Application.countDocuments({ 
        candidate: userId, 
        status: { $in: ['shortlisted', 'interview-scheduled'] }
      });
      const savedJobsCount = req.user.profile?.savedJobs?.length || 0;

      // Recent applications
      const recentApplications = await Application.find({ candidate: userId })
        .populate('job', 'title company location')
        .sort({ createdAt: -1 })
        .limit(5);

      stats = {
        totalApplications,
        pendingApplications,
        shortlistedApplications,
        savedJobsCount,
        recentApplications
      };

    } else if (userRole === 'recruiter') {
      // Recruiter dashboard stats
      const totalJobs = await Job.countDocuments({ postedBy: userId, isActive: true });
      const totalApplications = await Application.countDocuments({ recruiter: userId });
      const pendingApplications = await Application.countDocuments({ 
        recruiter: userId, 
        status: 'pending' 
      });
      const shortlistedCandidates = await Application.countDocuments({ 
        recruiter: userId, 
        status: { $in: ['shortlisted', 'interview-scheduled', 'hired'] }
      });

      // Recent jobs
      const recentJobs = await Job.find({ postedBy: userId })
        .sort({ createdAt: -1 })
        .limit(5);

      // Recent applications
      const recentApplications = await Application.find({ recruiter: userId })
        .populate('candidate', 'name profile')
        .populate('job', 'title')
        .sort({ createdAt: -1 })
        .limit(5);

      stats = {
        totalJobs,
        totalApplications,
        pendingApplications,
        shortlistedCandidates,
        recentJobs,
        recentApplications
      };

    } else if (userRole === 'admin') {
      // Admin dashboard stats
      const totalUsers = await User.countDocuments();
      const totalStudents = await User.countDocuments({ role: 'student' });
      const totalRecruiters = await User.countDocuments({ role: 'recruiter' });
      const totalJobs = await Job.countDocuments({ isActive: true });
      const totalApplications = await Application.countDocuments();

      // Recent users
      const recentUsers = await User.find()
        .select('name email role createdAt')
        .sort({ createdAt: -1 })
        .limit(10);

      // Recent jobs
      const recentJobs = await Job.find()
        .populate('postedBy', 'name company')
        .sort({ createdAt: -1 })
        .limit(10);

      stats = {
        totalUsers,
        totalStudents,
        totalRecruiters,
        totalJobs,
        totalApplications,
        recentUsers,
        recentJobs
      };
    }

    res.json(stats);

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard statistics' });
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;

    const filter = {};
    if (role && role !== 'all') {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    const pagination = {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
      hasNext: skip + parseInt(limit) < total,
      hasPrev: parseInt(page) > 1
    };

    res.json({
      users,
      pagination
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('profile.resume')
      .populate('profile.profilePicture');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
});

// Update user status (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, [
  body('isActive').isBoolean().withMessage('isActive must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error while updating user status' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deleting other admins
    if (user.role === 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Cannot delete other admin users' });
    }

    // Soft delete by deactivating
    user.isActive = false;
    await user.save();

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

// Search users (for messaging, etc.)
router.get('/search/users', authenticateToken, async (req, res) => {
  try {
    const { q, role } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const filter = {
      _id: { $ne: req.user._id }, // Exclude current user
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    };

    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('name email role profile.profilePicture company.name')
      .limit(10);

    res.json(users);

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error while searching users' });
  }
});

export default router;