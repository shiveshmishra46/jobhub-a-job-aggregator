import express from 'express';
import { body, query, validationResult } from 'express-validator';
import jobAggregatorService from '../services/jobAggregatorService.js';
import geminiService from '../services/geminiService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get aggregated jobs from multiple sources
router.get('/search', [
  query('keywords').optional().trim(),
  query('location').optional().trim(),
  query('jobType').optional().isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance']),
  query('workMode').optional().isIn(['remote', 'onsite', 'hybrid']),
  query('experienceLevel').optional().isIn(['entry', 'junior', 'mid', 'senior', 'lead']),
  query('paymentType').optional().isIn(['paid', 'unpaid']),
  query('salaryMin').optional().isInt({ min: 0 }),
  query('salaryMax').optional().isInt({ min: 0 }),
  query('sortBy').optional().isIn(['newest', 'relevance', 'salary']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      keywords = 'software engineer',
      location = '',
      jobType = '',
      workMode = '',
      experienceLevel = '',
      paymentType = '',
      salaryMin,
      salaryMax,
      sortBy = 'relevance',
      page = 1,
      limit = 20
    } = req.query;

    // Aggregate jobs from multiple sources
    const rawJobs = await jobAggregatorService.aggregateJobs({
      keywords,
      location,
      jobType,
      limit: parseInt(limit) * 2 // Get more to account for filtering
    });

    // Format jobs
    const formattedJobs = rawJobs.map(job => jobAggregatorService.formatJobData(job));

    // Apply filters
    const filteredJobs = jobAggregatorService.filterJobs(formattedJobs, {
      location,
      jobType,
      workMode,
      experienceLevel,
      paymentType,
      salaryMin,
      salaryMax
    });

    // Sort jobs
    const sortedJobs = jobAggregatorService.sortJobs(filteredJobs, sortBy);

    // Paginate
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedJobs = sortedJobs.slice(startIndex, startIndex + parseInt(limit));

    const pagination = {
      current: parseInt(page),
      pages: Math.ceil(sortedJobs.length / parseInt(limit)),
      total: sortedJobs.length,
      hasNext: startIndex + parseInt(limit) < sortedJobs.length,
      hasPrev: parseInt(page) > 1
    };

    res.json({
      jobs: paginatedJobs,
      pagination,
      filters: {
        keywords,
        location,
        jobType,
        workMode,
        experienceLevel,
        paymentType,
        salaryMin,
        salaryMax,
        sortBy
      }
    });

  } catch (error) {
    console.error('Job search error:', error);
    res.status(500).json({ message: 'Error searching jobs' });
  }
});

// Get AI recommendations based on resume
router.post('/ai-recommendations', authenticateToken, [
  body('resumeData').notEmpty().withMessage('Resume data required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { resumeData } = req.body;

    // Get current available jobs
    const availableJobs = await jobAggregatorService.aggregateJobs({
      keywords: resumeData.skills?.join(' ') || 'software engineer',
      limit: 100
    });

    const formattedJobs = availableJobs.map(job => jobAggregatorService.formatJobData(job));

    // Get AI recommendations
    const recommendations = await geminiService.getJobRecommendations(resumeData, formattedJobs);

    // Get full job details for recommended jobs
    const recommendedJobs = recommendations.map(rec => {
      const job = formattedJobs.find(j => j.id === rec.jobId);
      return {
        ...job,
        matchScore: rec.matchScore,
        reasons: rec.reasons
      };
    }).filter(Boolean);

    res.json({
      recommendations: recommendedJobs,
      totalJobs: formattedJobs.length,
      message: 'AI recommendations generated successfully'
    });

  } catch (error) {
    console.error('AI recommendations error:', error);
    res.status(500).json({ message: 'Error generating AI recommendations' });
  }
});

// Chat with AI about jobs
router.post('/ai-chat', authenticateToken, [
  body('message').trim().isLength({ min: 1 }).withMessage('Message required'),
  body('resumeData').optional(),
  body('chatHistory').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { message, resumeData, chatHistory } = req.body;

    // Get current available jobs for context
    const availableJobs = await jobAggregatorService.aggregateJobs({
      keywords: resumeData?.skills?.join(' ') || 'software engineer',
      limit: 50
    });

    const formattedJobs = availableJobs.map(job => jobAggregatorService.formatJobData(job));

    // Get AI response
    const aiResponse = await geminiService.chatWithAI(message, {
      resumeData,
      availableJobs: formattedJobs,
      chatHistory
    });

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ message: 'Error getting AI response' });
  }
});

// Parse resume using AI
router.post('/parse-resume', authenticateToken, async (req, res) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText) {
      return res.status(400).json({ message: 'Resume text required' });
    }

    const parsedData = await geminiService.parseResume(resumeText);

    res.json({
      data: parsedData,
      message: 'Resume parsed successfully'
    });

  } catch (error) {
    console.error('Resume parsing error:', error);
    res.status(500).json({ message: 'Error parsing resume' });
  }
});

export default router;