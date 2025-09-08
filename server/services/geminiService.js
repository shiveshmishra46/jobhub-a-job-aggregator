import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  // Parse resume content and extract structured data
  async parseResume(resumeText) {
    try {
      const prompt = `
        Analyze this resume and extract structured information in JSON format:
        
        Resume Content:
        ${resumeText}
        
        Please extract and return ONLY a JSON object with these fields:
        {
          "name": "candidate name",
          "email": "email if found",
          "phone": "phone if found",
          "skills": ["skill1", "skill2", "skill3"],
          "experience": [
            {
              "title": "job title",
              "company": "company name",
              "duration": "duration",
              "description": "brief description"
            }
          ],
          "education": [
            {
              "degree": "degree name",
              "institution": "school/university",
              "year": "graduation year"
            }
          ],
          "summary": "brief professional summary",
          "totalExperience": "years of experience as number"
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Could not parse resume data');
    } catch (error) {
      console.error('Resume parsing error:', error);
      throw new Error('Failed to parse resume');
    }
  }

  // Get job recommendations based on resume and available jobs
  async getJobRecommendations(resumeData, availableJobs) {
    try {
      const prompt = `
        Based on this candidate profile and available jobs, recommend the best matches:
        
        Candidate Profile:
        - Skills: ${resumeData.skills?.join(', ') || 'Not specified'}
        - Experience: ${resumeData.totalExperience || 0} years
        - Education: ${resumeData.education?.map(e => e.degree).join(', ') || 'Not specified'}
        - Summary: ${resumeData.summary || 'Not provided'}
        
        Available Jobs:
        ${availableJobs.map((job, index) => `
        ${index + 1}. ${job.title} at ${job.company}
           - Location: ${job.location}
           - Skills Required: ${job.skills?.join(', ') || 'Not specified'}
           - Experience: ${job.experienceLevel || 'Not specified'}
           - Type: ${job.jobType} (${job.workMode})
           - Job ID: ${job._id}
        `).join('\n')}
        
        Return a JSON array of recommended job IDs with match scores and reasons:
        [
          {
            "jobId": "job_id_here",
            "matchScore": 0.95,
            "reasons": ["reason1", "reason2", "reason3"]
          }
        ]
        
        Only recommend jobs with match score > 0.6. Limit to top 5 recommendations.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return [];
    } catch (error) {
      console.error('Job recommendation error:', error);
      return [];
    }
  }

  // Chat with AI about jobs and career advice
  async chatWithAI(message, context = {}) {
    try {
      const { resumeData, availableJobs, chatHistory } = context;
      
      let prompt = `
        You are an AI career advisor and job search assistant. Help the user with their job search and career questions.
        
        Context:
      `;
      
      if (resumeData) {
        prompt += `
        User's Profile:
        - Skills: ${resumeData.skills?.join(', ') || 'Not specified'}
        - Experience: ${resumeData.totalExperience || 0} years
        - Education: ${resumeData.education?.map(e => e.degree).join(', ') || 'Not specified'}
        `;
      }
      
      if (availableJobs && availableJobs.length > 0) {
        prompt += `
        
        Available Jobs (sample):
        ${availableJobs.slice(0, 10).map((job, index) => `
        ${index + 1}. ${job.title} at ${job.company} - ${job.location} (${job.jobType})
        `).join('')}
        `;
      }
      
      if (chatHistory && chatHistory.length > 0) {
        prompt += `
        
        Previous conversation:
        ${chatHistory.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')}
        `;
      }
      
      prompt += `
        
        User's question: ${message}
        
        Please provide helpful, personalized advice. If recommending jobs, mention specific job titles and companies from the available jobs list.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI chat error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  // Analyze job market trends
  async analyzeJobMarket(jobs) {
    try {
      const prompt = `
        Analyze these job listings and provide market insights:
        
        Jobs Data:
        ${jobs.map(job => `
        - ${job.title} at ${job.company} (${job.location}) - ${job.salary?.min || 'Not specified'} salary
        `).join('\n')}
        
        Provide insights on:
        1. Most in-demand skills
        2. Salary trends
        3. Popular locations
        4. Job type distribution
        5. Growth opportunities
        
        Return as JSON:
        {
          "topSkills": ["skill1", "skill2"],
          "salaryTrends": "description",
          "popularLocations": ["location1", "location2"],
          "insights": ["insight1", "insight2"]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return null;
    } catch (error) {
      console.error('Market analysis error:', error);
      return null;
    }
  }
}

export default new GeminiService();