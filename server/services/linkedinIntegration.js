import axios from 'axios';
import User from '../models/User.js';
import Job from '../models/Job.js';

class LinkedInIntegrationService {
  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID;
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    this.redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    this.baseUrl = 'https://api.linkedin.com/v2';
  }

  // Generate LinkedIn OAuth URL
  generateAuthUrl(state) {
    const scope = 'r_liteprofile r_emailaddress w_member_social';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
      scope: scope
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async getAccessToken(code) {
    try {
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data.access_token;
    } catch (error) {
      console.error('LinkedIn token exchange error:', error);
      throw new Error('Failed to get LinkedIn access token');
    }
  }

  // Get LinkedIn profile information
  async getProfile(accessToken) {
    try {
      const [profileResponse, emailResponse] = await Promise.all([
        axios.get(`${this.baseUrl}/people/~`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }),
        axios.get(`${this.baseUrl}/emailAddress?q=members&projection=(elements*(handle~))`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      ]);

      const profile = profileResponse.data;
      const email = emailResponse.data.elements[0]['handle~'].emailAddress;

      return {
        id: profile.id,
        firstName: profile.localizedFirstName,
        lastName: profile.localizedLastName,
        email: email,
        profilePicture: profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier
      };
    } catch (error) {
      console.error('LinkedIn profile fetch error:', error);
      throw new Error('Failed to fetch LinkedIn profile');
    }
  }

  // Sync LinkedIn profile to user account
  async syncProfileToUser(userId, accessToken) {
    try {
      const linkedinProfile = await this.getProfile(accessToken);
      const detailedProfile = await this.getDetailedProfile(accessToken);

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update user profile with LinkedIn data
      user.profile = {
        ...user.profile,
        linkedinId: linkedinProfile.id,
        linkedinUrl: `https://www.linkedin.com/in/${linkedinProfile.id}`,
        bio: detailedProfile.summary || user.profile.bio,
        skills: [...new Set([...(user.profile.skills || []), ...(detailedProfile.skills || [])])],
        experience: detailedProfile.experience || user.profile.experience,
        education: detailedProfile.education || user.profile.education
      };

      if (linkedinProfile.profilePicture && !user.profile.profilePicture) {
        // Download and save profile picture
        user.profile.profilePicture = {
          filename: 'linkedin-profile-pic',
          contentType: 'image/jpeg'
        };
      }

      await user.save();
      return user;
    } catch (error) {
      console.error('LinkedIn profile sync error:', error);
      throw new Error('Failed to sync LinkedIn profile');
    }
  }

  // Get detailed LinkedIn profile (requires additional permissions)
  async getDetailedProfile(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/people/~:(id,first-name,last-name,headline,summary,positions,educations,skills)`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const profile = response.data;
      
      return {
        headline: profile.headline,
        summary: profile.summary,
        experience: this.formatExperience(profile.positions?.values || []),
        education: this.formatEducation(profile.educations?.values || []),
        skills: this.extractSkills(profile.skills?.values || [])
      };
    } catch (error) {
      console.error('LinkedIn detailed profile error:', error);
      return {};
    }
  }

  // Format LinkedIn experience data
  formatExperience(positions) {
    return positions.map(position => ({
      title: position.title,
      company: position.company?.name,
      startDate: this.formatDate(position.startDate),
      endDate: position.isCurrent ? 'Present' : this.formatDate(position.endDate),
      description: position.summary
    }));
  }

  // Format LinkedIn education data
  formatEducation(educations) {
    return educations.map(education => ({
      school: education.schoolName,
      degree: education.degree,
      field: education.fieldOfStudy,
      startDate: this.formatDate(education.startDate),
      endDate: this.formatDate(education.endDate)
    }));
  }

  // Extract skills from LinkedIn data
  extractSkills(skills) {
    return skills.map(skill => skill.skill?.name).filter(Boolean);
  }

  // Format LinkedIn date
  formatDate(dateObj) {
    if (!dateObj) return null;
    return `${dateObj.month || 1}/${dateObj.year}`;
  }

  // Search LinkedIn jobs (requires LinkedIn Jobs API access)
  async searchJobs(accessToken, keywords, location, limit = 25) {
    try {
      // Note: This requires LinkedIn Jobs API access which is limited
      const params = new URLSearchParams({
        keywords: keywords,
        location: location,
        count: limit
      });

      const response = await axios.get(`${this.baseUrl}/jobSearch?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      return response.data.elements.map(job => ({
        id: job.id,
        title: job.title,
        company: job.companyDetails?.company?.name,
        location: job.locationDescription,
        description: job.description?.text,
        applyUrl: job.applyMethod?.companyApplyUrl,
        postedDate: job.listedAt
      }));
    } catch (error) {
      console.error('LinkedIn job search error:', error);
      return [];
    }
  }

  // Apply to LinkedIn job
  async applyToJob(accessToken, jobId, applicationData) {
    try {
      // Note: This requires special LinkedIn partnership for job applications
      const response = await axios.post(`${this.baseUrl}/jobApplications`, {
        job: `urn:li:job:${jobId}`,
        person: `urn:li:person:${applicationData.personId}`,
        coverLetter: applicationData.coverLetter
      }, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('LinkedIn job application error:', error);
      throw new Error('Failed to apply to LinkedIn job');
    }
  }

  // Share job posting on LinkedIn
  async shareJobPosting(accessToken, jobId, message) {
    try {
      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      const shareContent = {
        author: `urn:li:person:${accessToken}`, // This would need the person's LinkedIn ID
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: message || `Check out this job opportunity: ${job.title} at ${job.company.name}`
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await axios.post(`${this.baseUrl}/ugcPosts`, shareContent, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return response.data;
    } catch (error) {
      console.error('LinkedIn share error:', error);
      throw new Error('Failed to share job on LinkedIn');
    }
  }

  // Get LinkedIn connections for networking
  async getConnections(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/people/~/connections`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      return response.data.values.map(connection => ({
        id: connection.id,
        firstName: connection.firstName,
        lastName: connection.lastName,
        headline: connection.headline,
        industry: connection.industry,
        location: connection.location?.name
      }));
    } catch (error) {
      console.error('LinkedIn connections error:', error);
      return [];
    }
  }

  // Import LinkedIn jobs to our platform
  async importLinkedInJobs(keywords = ['software engineer', 'developer']) {
    try {
      // This would require a service account or app-level access
      const jobs = [];
      
      for (const keyword of keywords) {
        const linkedinJobs = await this.searchPublicJobs(keyword);
        
        for (const linkedinJob of linkedinJobs) {
          const existingJob = await Job.findOne({
            externalId: linkedinJob.id,
            source: 'linkedin'
          });

          if (!existingJob) {
            const newJob = new Job({
              title: linkedinJob.title,
              description: linkedinJob.description,
              company: {
                name: linkedinJob.company,
                website: '',
                description: `Company: ${linkedinJob.company}`
              },
              location: linkedinJob.location,
              workMode: 'onsite',
              jobType: 'full-time',
              experienceLevel: 'mid',
              skills: this.extractSkillsFromDescription(linkedinJob.description),
              requirements: ['Experience required'],
              benefits: ['Professional growth'],
              source: 'linkedin',
              externalId: linkedinJob.id,
              externalUrl: linkedinJob.applyUrl,
              isActive: true,
              lastSynced: new Date()
            });

            await newJob.save();
            jobs.push(newJob);
          }
        }
      }

      return jobs;
    } catch (error) {
      console.error('LinkedIn job import error:', error);
      return [];
    }
  }

  // Extract skills from job description
  extractSkillsFromDescription(description) {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'MongoDB',
      'AWS', 'Docker', 'Kubernetes', 'Git', 'HTML', 'CSS', 'TypeScript'
    ];

    return commonSkills.filter(skill => 
      description?.toLowerCase().includes(skill.toLowerCase())
    ).slice(0, 5);
  }

  // Search public LinkedIn jobs (limited access)
  async searchPublicJobs(keyword) {
    try {
      // This is a simplified version - actual implementation would require
      // LinkedIn's Job Search API or web scraping with proper permissions
      return [];
    } catch (error) {
      console.error('Public job search error:', error);
      return [];
    }
  }
}

export default new LinkedInIntegrationService();