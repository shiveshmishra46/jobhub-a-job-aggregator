import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import natural from 'natural';

class RecommendationEngine {
  constructor() {
    this.userItemMatrix = new Map();
    this.itemSimilarityMatrix = new Map();
    this.userSimilarityMatrix = new Map();
    this.isInitialized = false;
  }

  // Initialize the recommendation engine
  async initialize() {
    try {
      console.log('Initializing recommendation engine...');
      await this.buildUserItemMatrix();
      await this.calculateItemSimilarity();
      await this.calculateUserSimilarity();
      this.isInitialized = true;
      console.log('Recommendation engine initialized successfully');
    } catch (error) {
      console.error('Error initializing recommendation engine:', error);
    }
  }

  // Build user-item interaction matrix
  async buildUserItemMatrix() {
    try {
      const applications = await Application.find()
        .populate('candidate', '_id')
        .populate('job', '_id')
        .lean();

      const users = await User.find({ role: 'student' }).lean();
      const jobs = await Job.find({ isActive: true }).lean();

      // Initialize matrix
      for (const user of users) {
        this.userItemMatrix.set(user._id.toString(), new Map());
      }

      // Fill matrix with interaction data
      for (const app of applications) {
        if (app.candidate && app.job) {
          const userId = app.candidate._id.toString();
          const jobId = app.job._id.toString();
          
          if (this.userItemMatrix.has(userId)) {
            // Weight interactions based on application status
            let weight = 1;
            switch (app.status) {
              case 'hired': weight = 5; break;
              case 'shortlisted': weight = 4; break;
              case 'interview-scheduled': weight = 3; break;
              case 'reviewed': weight = 2; break;
              case 'rejected': weight = 0.5; break;
              default: weight = 1;
            }
            
            this.userItemMatrix.get(userId).set(jobId, weight);
          }
        }
      }

      // Add saved jobs with lower weight
      for (const user of users) {
        if (user.profile?.savedJobs) {
          const userId = user._id.toString();
          const userMatrix = this.userItemMatrix.get(userId);
          
          for (const savedJobId of user.profile.savedJobs) {
            const jobId = savedJobId.toString();
            if (!userMatrix.has(jobId)) {
              userMatrix.set(jobId, 0.8); // Lower weight for saved jobs
            }
          }
        }
      }

    } catch (error) {
      console.error('Error building user-item matrix:', error);
    }
  }

  // Calculate item-to-item similarity (job similarity)
  async calculateItemSimilarity() {
    try {
      const jobs = await Job.find({ isActive: true }).lean();
      
      for (let i = 0; i < jobs.length; i++) {
        const jobId1 = jobs[i]._id.toString();
        this.itemSimilarityMatrix.set(jobId1, new Map());
        
        for (let j = i + 1; j < jobs.length; j++) {
          const jobId2 = jobs[j]._id.toString();
          
          const similarity = this.calculateJobSimilarity(jobs[i], jobs[j]);
          
          this.itemSimilarityMatrix.get(jobId1).set(jobId2, similarity);
          
          if (!this.itemSimilarityMatrix.has(jobId2)) {
            this.itemSimilarityMatrix.set(jobId2, new Map());
          }
          this.itemSimilarityMatrix.get(jobId2).set(jobId1, similarity);
        }
      }
    } catch (error) {
      console.error('Error calculating item similarity:', error);
    }
  }

  // Calculate user-to-user similarity
  async calculateUserSimilarity() {
    try {
      const userIds = Array.from(this.userItemMatrix.keys());
      
      for (let i = 0; i < userIds.length; i++) {
        const userId1 = userIds[i];
        this.userSimilarityMatrix.set(userId1, new Map());
        
        for (let j = i + 1; j < userIds.length; j++) {
          const userId2 = userIds[j];
          
          const similarity = this.calculateUserCosineSimilarity(userId1, userId2);
          
          this.userSimilarityMatrix.get(userId1).set(userId2, similarity);
          
          if (!this.userSimilarityMatrix.has(userId2)) {
            this.userSimilarityMatrix.set(userId2, new Map());
          }
          this.userSimilarityMatrix.get(userId2).set(userId1, similarity);
        }
      }
    } catch (error) {
      console.error('Error calculating user similarity:', error);
    }
  }

  // Calculate job similarity based on multiple factors
  calculateJobSimilarity(job1, job2) {
    let similarity = 0;
    let factors = 0;

    // Skill similarity (most important)
    const skillSimilarity = this.calculateSkillSimilarity(job1.skills, job2.skills);
    similarity += skillSimilarity * 0.4;
    factors += 0.4;

    // Location similarity
    if (job1.location === job2.location) {
      similarity += 0.2;
    }
    factors += 0.2;

    // Job type similarity
    if (job1.jobType === job2.jobType) {
      similarity += 0.15;
    }
    factors += 0.15;

    // Experience level similarity
    const expLevels = ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'];
    const exp1Index = expLevels.indexOf(job1.experienceLevel);
    const exp2Index = expLevels.indexOf(job2.experienceLevel);
    const expSimilarity = 1 - Math.abs(exp1Index - exp2Index) / expLevels.length;
    similarity += expSimilarity * 0.15;
    factors += 0.15;

    // Work mode similarity
    if (job1.workMode === job2.workMode) {
      similarity += 0.1;
    }
    factors += 0.1;

    return factors > 0 ? similarity / factors : 0;
  }

  // Calculate skill similarity using Jaccard coefficient
  calculateSkillSimilarity(skills1, skills2) {
    if (!skills1 || !skills2 || skills1.length === 0 || skills2.length === 0) {
      return 0;
    }

    const set1 = new Set(skills1.map(s => s.toLowerCase()));
    const set2 = new Set(skills2.map(s => s.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  // Calculate cosine similarity between users
  calculateUserCosineSimilarity(userId1, userId2) {
    const user1Ratings = this.userItemMatrix.get(userId1);
    const user2Ratings = this.userItemMatrix.get(userId2);
    
    if (!user1Ratings || !user2Ratings) return 0;

    const commonItems = [];
    const user1Vector = [];
    const user2Vector = [];

    // Find common items
    for (const [itemId, rating1] of user1Ratings) {
      if (user2Ratings.has(itemId)) {
        commonItems.push(itemId);
        user1Vector.push(rating1);
        user2Vector.push(user2Ratings.get(itemId));
      }
    }

    if (commonItems.length === 0) return 0;

    // Calculate cosine similarity
    const dotProduct = user1Vector.reduce((sum, val, i) => sum + val * user2Vector[i], 0);
    const magnitude1 = Math.sqrt(user1Vector.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(user2Vector.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    return dotProduct / (magnitude1 * magnitude2);
  }

  // Get personalized job recommendations for a user
  async getPersonalizedRecommendations(userId, limit = 10) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const user = await User.findById(userId).lean();
      if (!user) return [];

      // Get recommendations using multiple approaches
      const contentBasedRecs = await this.getContentBasedRecommendations(userId, limit);
      const collaborativeRecs = await this.getCollaborativeRecommendations(userId, limit);
      const hybridRecs = this.combineRecommendations(contentBasedRecs, collaborativeRecs, limit);

      return hybridRecs;
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  // Content-based recommendations
  async getContentBasedRecommendations(userId, limit) {
    try {
      const user = await User.findById(userId).lean();
      if (!user?.profile?.skills) return [];

      const jobs = await Job.find({ isActive: true }).lean();
      const recommendations = [];

      for (const job of jobs) {
        // Skip jobs user has already interacted with
        const userMatrix = this.userItemMatrix.get(userId);
        if (userMatrix && userMatrix.has(job._id.toString())) {
          continue;
        }

        const score = this.calculateContentScore(user, job);
        recommendations.push({ job, score, type: 'content' });
      }

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting content-based recommendations:', error);
      return [];
    }
  }

  // Collaborative filtering recommendations
  async getCollaborativeRecommendations(userId, limit) {
    try {
      const userMatrix = this.userItemMatrix.get(userId);
      if (!userMatrix) return [];

      const userSimilarities = this.userSimilarityMatrix.get(userId);
      if (!userSimilarities) return [];

      const recommendations = new Map();

      // Find similar users and their job preferences
      for (const [similarUserId, similarity] of userSimilarities) {
        if (similarity < 0.1) continue; // Skip users with low similarity

        const similarUserMatrix = this.userItemMatrix.get(similarUserId);
        if (!similarUserMatrix) continue;

        for (const [jobId, rating] of similarUserMatrix) {
          if (!userMatrix.has(jobId)) { // User hasn't interacted with this job
            const currentScore = recommendations.get(jobId) || 0;
            recommendations.set(jobId, currentScore + similarity * rating);
          }
        }
      }

      // Convert to array and get job details
      const jobRecommendations = [];
      for (const [jobId, score] of recommendations) {
        const job = await Job.findById(jobId).lean();
        if (job) {
          jobRecommendations.push({ job, score, type: 'collaborative' });
        }
      }

      return jobRecommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting collaborative recommendations:', error);
      return [];
    }
  }

  // Calculate content-based score
  calculateContentScore(user, job) {
    let score = 0;

    // Skill matching (most important)
    if (user.profile?.skills && job.skills) {
      const skillSimilarity = this.calculateSkillSimilarity(user.profile.skills, job.skills);
      score += skillSimilarity * 0.5;
    }

    // Location preference
    if (user.preferences?.locations?.includes(job.location)) {
      score += 0.2;
    }

    // Job type preference
    if (user.preferences?.jobTypes?.includes(job.jobType)) {
      score += 0.15;
    }

    // Work mode preference
    if (user.preferences?.workMode === job.workMode || user.preferences?.workMode === 'any') {
      score += 0.15;
    }

    return score;
  }

  // Combine different recommendation approaches
  combineRecommendations(contentBased, collaborative, limit) {
    const combined = new Map();

    // Add content-based recommendations
    for (const rec of contentBased) {
      const jobId = rec.job._id.toString();
      combined.set(jobId, {
        job: rec.job,
        contentScore: rec.score,
        collaborativeScore: 0,
        finalScore: rec.score * 0.6 // Weight content-based at 60%
      });
    }

    // Add collaborative recommendations
    for (const rec of collaborative) {
      const jobId = rec.job._id.toString();
      if (combined.has(jobId)) {
        const existing = combined.get(jobId);
        existing.collaborativeScore = rec.score;
        existing.finalScore = existing.contentScore * 0.6 + rec.score * 0.4;
      } else {
        combined.set(jobId, {
          job: rec.job,
          contentScore: 0,
          collaborativeScore: rec.score,
          finalScore: rec.score * 0.4 // Weight collaborative at 40%
        });
      }
    }

    // Sort by final score and return top recommendations
    return Array.from(combined.values())
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, limit)
      .map(rec => ({
        job: rec.job,
        score: rec.finalScore,
        reasons: this.generateRecommendationReasons(rec)
      }));
  }

  // Generate human-readable recommendation reasons
  generateRecommendationReasons(recommendation) {
    const reasons = [];
    
    if (recommendation.contentScore > 0.3) {
      reasons.push('Matches your skills and preferences');
    }
    
    if (recommendation.collaborativeScore > 0.3) {
      reasons.push('Popular among similar users');
    }
    
    return reasons;
  }

  // Update recommendations when user interacts with jobs
  async updateUserInteraction(userId, jobId, interactionType, weight = 1) {
    try {
      if (!this.userItemMatrix.has(userId)) {
        this.userItemMatrix.set(userId, new Map());
      }

      const userMatrix = this.userItemMatrix.get(userId);
      const currentWeight = userMatrix.get(jobId) || 0;
      
      // Update weight based on interaction type
      let newWeight = currentWeight;
      switch (interactionType) {
        case 'view': newWeight += 0.1 * weight; break;
        case 'save': newWeight += 0.5 * weight; break;
        case 'apply': newWeight += 1.0 * weight; break;
        case 'shortlisted': newWeight += 2.0 * weight; break;
        case 'hired': newWeight += 5.0 * weight; break;
      }

      userMatrix.set(jobId, Math.min(newWeight, 5)); // Cap at 5

      // Periodically recalculate similarities (in production, do this asynchronously)
      if (Math.random() < 0.01) { // 1% chance to trigger recalculation
        setTimeout(() => this.initialize(), 1000);
      }

    } catch (error) {
      console.error('Error updating user interaction:', error);
    }
  }

  // Get trending jobs based on recent interactions
  async getTrendingJobs(limit = 10) {
    try {
      const recentApplications = await Application.find({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      }).populate('job').lean();

      const jobInteractions = new Map();

      for (const app of recentApplications) {
        if (app.job) {
          const jobId = app.job._id.toString();
          const current = jobInteractions.get(jobId) || { job: app.job, count: 0, score: 0 };
          
          current.count++;
          // Weight by application status
          switch (app.status) {
            case 'hired': current.score += 5; break;
            case 'shortlisted': current.score += 3; break;
            case 'interview-scheduled': current.score += 2; break;
            default: current.score += 1;
          }
          
          jobInteractions.set(jobId, current);
        }
      }

      return Array.from(jobInteractions.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => ({
          job: item.job,
          score: item.score,
          interactionCount: item.count
        }));

    } catch (error) {
      console.error('Error getting trending jobs:', error);
      return [];
    }
  }
}

export default new RecommendationEngine();