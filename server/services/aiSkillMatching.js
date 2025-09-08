import * as tf from '@tensorflow/tfjs-node';
import natural from 'natural';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Application from '../models/Application.js';

class AISkillMatchingService {
  constructor() {
    this.model = null;
    this.skillVectorizer = new natural.TfIdf();
    this.jobVectorizer = new natural.TfIdf();
    this.isModelTrained = false;
  }

  // Initialize and train the model
  async initializeModel() {
    try {
      console.log('Initializing AI Skill Matching Model...');
      
      // Try to load existing model
      try {
        this.model = await tf.loadLayersModel('file://./models/skill-matching-model.json');
        this.isModelTrained = true;
        console.log('Loaded existing skill matching model');
      } catch (error) {
        console.log('No existing model found, creating new one...');
        await this.createAndTrainModel();
      }
    } catch (error) {
      console.error('Error initializing AI model:', error);
    }
  }

  // Create and train a new neural network model
  async createAndTrainModel() {
    try {
      // Get training data
      const trainingData = await this.prepareTrainingData();
      
      if (trainingData.inputs.length === 0) {
        console.log('No training data available, using default model');
        this.createDefaultModel();
        return;
      }

      // Create neural network architecture
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [trainingData.inputSize],
            units: 128,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({
            units: 64,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu'
          }),
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
          })
        ]
      });

      // Compile model
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      // Convert training data to tensors
      const xs = tf.tensor2d(trainingData.inputs);
      const ys = tf.tensor2d(trainingData.outputs, [trainingData.outputs.length, 1]);

      // Train the model
      console.log('Training AI model...');
      await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
            }
          }
        }
      });

      // Save the model
      await this.model.save('file://./models/skill-matching-model');
      this.isModelTrained = true;
      
      console.log('AI model trained and saved successfully');
    } catch (error) {
      console.error('Error training AI model:', error);
      this.createDefaultModel();
    }
  }

  // Prepare training data from existing applications
  async prepareTrainingData() {
    try {
      const applications = await Application.find()
        .populate('candidate', 'profile.skills')
        .populate('job', 'skills requirements title description')
        .lean();

      const inputs = [];
      const outputs = [];

      for (const app of applications) {
        if (!app.candidate?.profile?.skills || !app.job?.skills) continue;

        const skillVector = this.createSkillVector(
          app.candidate.profile.skills,
          app.job.skills,
          app.job.title,
          app.job.description
        );

        // Positive example (hired or shortlisted)
        const isPositive = ['hired', 'shortlisted', 'interview-scheduled'].includes(app.status);
        
        inputs.push(skillVector);
        outputs.push(isPositive ? 1 : 0);
      }

      return {
        inputs,
        outputs,
        inputSize: inputs.length > 0 ? inputs[0].length : 100
      };
    } catch (error) {
      console.error('Error preparing training data:', error);
      return { inputs: [], outputs: [], inputSize: 100 };
    }
  }

  // Create skill vector for ML processing
  createSkillVector(candidateSkills, jobSkills, jobTitle, jobDescription) {
    const allSkills = [...new Set([...candidateSkills, ...jobSkills])];
    const vector = [];

    // Skill matching features
    const skillMatch = candidateSkills.filter(skill => 
      jobSkills.some(jobSkill => 
        skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
        jobSkill.toLowerCase().includes(skill.toLowerCase())
      )
    ).length;

    const skillMatchRatio = skillMatch / Math.max(jobSkills.length, 1);
    const candidateSkillCount = candidateSkills.length;
    const jobSkillCount = jobSkills.length;

    // Text similarity features
    const titleSimilarity = this.calculateTextSimilarity(
      candidateSkills.join(' '),
      jobTitle
    );

    const descriptionSimilarity = this.calculateTextSimilarity(
      candidateSkills.join(' '),
      jobDescription
    );

    // Combine features
    vector.push(
      skillMatchRatio,
      candidateSkillCount / 20, // Normalize
      jobSkillCount / 20, // Normalize
      titleSimilarity,
      descriptionSimilarity,
      skillMatch / 10 // Normalize
    );

    // Pad or truncate to fixed size
    while (vector.length < 100) {
      vector.push(0);
    }

    return vector.slice(0, 100);
  }

  // Calculate text similarity using TF-IDF
  calculateTextSimilarity(text1, text2) {
    const tokenizer = new natural.WordTokenizer();
    const tokens1 = tokenizer.tokenize(text1.toLowerCase());
    const tokens2 = tokenizer.tokenize(text2.toLowerCase());

    const tfidf = new natural.TfIdf();
    tfidf.addDocument(tokens1);
    tfidf.addDocument(tokens2);

    let similarity = 0;
    const terms = [...new Set([...tokens1, ...tokens2])];
    
    terms.forEach(term => {
      const score1 = tfidf.tfidf(term, 0);
      const score2 = tfidf.tfidf(term, 1);
      similarity += score1 * score2;
    });

    return Math.min(similarity, 1);
  }

  // Create default model if training fails
  createDefaultModel() {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [100], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    this.model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    this.isModelTrained = true;
  }

  // Get AI-powered job recommendations for a user
  async getJobRecommendations(userId, limit = 10) {
    try {
      if (!this.isModelTrained) {
        await this.initializeModel();
      }

      const user = await User.findById(userId).lean();
      if (!user?.profile?.skills) {
        return [];
      }

      const jobs = await Job.find({ isActive: true }).lean();
      const recommendations = [];

      for (const job of jobs) {
        const skillVector = this.createSkillVector(
          user.profile.skills,
          job.skills,
          job.title,
          job.description
        );

        // Get AI prediction
        const prediction = await this.model.predict(
          tf.tensor2d([skillVector])
        ).data();

        const matchScore = prediction[0];

        recommendations.push({
          job,
          matchScore,
          reasons: this.generateMatchReasons(user.profile.skills, job)
        });
      }

      // Sort by match score and return top recommendations
      return recommendations
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting job recommendations:', error);
      return [];
    }
  }

  // Generate human-readable match reasons
  generateMatchReasons(candidateSkills, job) {
    const matchingSkills = candidateSkills.filter(skill =>
      job.skills.some(jobSkill =>
        skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
        jobSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );

    const reasons = [];

    if (matchingSkills.length > 0) {
      reasons.push(`${matchingSkills.length} matching skills: ${matchingSkills.slice(0, 3).join(', ')}`);
    }

    if (job.experienceLevel === 'entry' && candidateSkills.length < 5) {
      reasons.push('Good for entry-level candidates');
    }

    if (job.workMode === 'remote') {
      reasons.push('Remote work opportunity');
    }

    return reasons;
  }

  // Update model with new application data
  async updateModelWithFeedback(applicationId, outcome) {
    try {
      // This would be called when an application gets a final outcome
      // to continuously improve the model
      console.log(`Updating model with feedback for application ${applicationId}: ${outcome}`);
      
      // In a production system, you would:
      // 1. Add this data point to training set
      // 2. Periodically retrain the model
      // 3. Use online learning techniques for real-time updates
      
    } catch (error) {
      console.error('Error updating model with feedback:', error);
    }
  }
}

export default new AISkillMatchingService();