import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import aiSkillMatchingService from '../services/aiSkillMatching.js';
import recommendationEngine from '../services/recommendationEngine.js';
import jobScrapingService from '../services/jobScrapingService.js';
import linkedinIntegration from '../services/linkedinIntegration.js';

const router = express.Router();

// Get AI-powered job recommendations
router.get('/recommendations/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    // Ensure user can only get their own recommendations or admin/recruiter can get any
    if (req.user._id.toString() !== userId && !['admin', 'recruiter'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const recommendations = await aiSkillMatchingService.getJobRecommendations(userId, parseInt(limit));
    
    res.json({
      recommendations,
      message: 'AI recommendations generated successfully'
    });
  } catch (error) {
    console.error('AI recommendations error:', error);
    res.status(500).json({ message: 'Error generating AI recommendations' });
  }
});

// Get personalized recommendations using collaborative filtering
router.get('/personalized/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    if (req.user._id.toString() !== userId && !['admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const recommendations = await recommendationEngine.getPersonalizedRecommendations(userId, parseInt(limit));
    
    res.json({
      recommendations,
      message: 'Personalized recommendations generated successfully'
    });
  } catch (error) {
    console.error('Personalized recommendations error:', error);
    res.status(500).json({ message: 'Error generating personalized recommendations' });
  }
});

// Get trending jobs
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const trendingJobs = await recommendationEngine.getTrendingJobs(parseInt(limit));
    
    res.json({
      jobs: trendingJobs,
      message: 'Trending jobs retrieved successfully'
    });
  } catch (error) {
    console.error('Trending jobs error:', error);
    res.status(500).json({ message: 'Error getting trending jobs' });
  }
});

// Update user interaction for ML learning
router.post('/interaction', authenticateToken, async (req, res) => {
  try {
    const { jobId, interactionType, weight = 1 } = req.body;
    const userId = req.user._id.toString();

    await recommendationEngine.updateUserInteraction(userId, jobId, interactionType, weight);
    
    res.json({
      message: 'User interaction recorded successfully'
    });
  } catch (error) {
    console.error('User interaction error:', error);
    res.status(500).json({ message: 'Error recording user interaction' });
  }
});

// Scrape jobs from external portals (admin only)
router.post('/scrape-jobs', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { keywords = ['software engineer', 'developer', 'data scientist'] } = req.body;
    
    // Start scraping in background
    jobScrapingService.scrapeAllPortals(keywords).then(jobs => {
      console.log(`Scraped ${jobs.length} jobs successfully`);
    }).catch(error => {
      console.error('Background scraping error:', error);
    });

    res.json({
      message: 'Job scraping started in background',
      keywords
    });
  } catch (error) {
    console.error('Job scraping error:', error);
    res.status(500).json({ message: 'Error starting job scraping' });
  }
});

// LinkedIn integration endpoints
router.get('/linkedin/auth-url', authenticateToken, (req, res) => {
  try {
    const state = req.user._id.toString();
    const authUrl = linkedinIntegration.generateAuthUrl(state);
    
    res.json({
      authUrl,
      message: 'LinkedIn auth URL generated'
    });
  } catch (error) {
    console.error('LinkedIn auth URL error:', error);
    res.status(500).json({ message: 'Error generating LinkedIn auth URL' });
  }
});

router.post('/linkedin/callback', authenticateToken, async (req, res) => {
  try {
    const { code, state } = req.body;
    
    // Verify state matches user ID
    if (state !== req.user._id.toString()) {
      return res.status(400).json({ message: 'Invalid state parameter' });
    }

    const accessToken = await linkedinIntegration.getAccessToken(code);
    const updatedUser = await linkedinIntegration.syncProfileToUser(req.user._id, accessToken);
    
    res.json({
      message: 'LinkedIn profile synced successfully',
      user: updatedUser.getPublicProfile()
    });
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.status(500).json({ message: 'Error processing LinkedIn callback' });
  }
});

// Initialize AI services (admin only)
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Initialize AI services in background
    Promise.all([
      aiSkillMatchingService.initializeModel(),
      recommendationEngine.initialize()
    ]).then(() => {
      console.log('AI services initialized successfully');
    }).catch(error => {
      console.error('AI initialization error:', error);
    });

    res.json({
      message: 'AI services initialization started'
    });
  } catch (error) {
    console.error('AI initialization error:', error);
    res.status(500).json({ message: 'Error initializing AI services' });
  }
});

// Get AI model status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'recruiter'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    res.json({
      aiSkillMatching: {
        initialized: aiSkillMatchingService.isModelTrained,
        status: 'operational'
      },
      recommendationEngine: {
        initialized: recommendationEngine.isInitialized,
        status: 'operational'
      },
      jobScraping: {
        status: 'operational'
      },
      linkedinIntegration: {
        status: 'operational'
      }
    });
  } catch (error) {
    console.error('AI status error:', error);
    res.status(500).json({ message: 'Error getting AI status' });
  }
});

export default router;