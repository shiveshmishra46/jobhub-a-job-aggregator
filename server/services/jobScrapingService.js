import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import Job from '../models/Job.js';

class JobScrapingService {
  constructor() {
    this.browser = null;
    this.scrapers = {
      naukri: this.scrapeNaukri.bind(this),
      indeed: this.scrapeIndeed.bind(this),
      linkedin: this.scrapeLinkedIn.bind(this),
      internshala: this.scrapeInternshala.bind(this)
    };
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Main scraping orchestrator
  async scrapeAllPortals(keywords = ['software engineer', 'developer', 'data scientist']) {
    try {
      console.log('Starting job scraping from all portals...');
      const results = [];

      for (const keyword of keywords) {
        for (const [portal, scraper] of Object.entries(this.scrapers)) {
          try {
            console.log(`Scraping ${portal} for "${keyword}"`);
            const jobs = await scraper(keyword);
            results.push(...jobs);
            
            // Add delay between requests to be respectful
            await this.delay(2000);
          } catch (error) {
            console.error(`Error scraping ${portal}:`, error.message);
          }
        }
      }

      // Save unique jobs to database
      const savedJobs = await this.saveUniqueJobs(results);
      console.log(`Scraping completed. Saved ${savedJobs.length} new jobs.`);
      
      return savedJobs;
    } catch (error) {
      console.error('Error in scraping orchestrator:', error);
      return [];
    }
  }

  // Naukri.com scraper
  async scrapeNaukri(keyword) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      const url = `https://www.naukri.com/${keyword.replace(/\s+/g, '-')}-jobs`;
      await page.goto(url, { waitUntil: 'networkidle2' });

      const jobs = await page.evaluate(() => {
        const jobElements = document.querySelectorAll('.srp-jobtuple-wrapper');
        return Array.from(jobElements).slice(0, 10).map(element => {
          const titleElement = element.querySelector('.title');
          const companyElement = element.querySelector('.comp-name');
          const locationElement = element.querySelector('.locationsContainer');
          const salaryElement = element.querySelector('.salary');
          const experienceElement = element.querySelector('.exp');

          return {
            title: titleElement?.textContent?.trim() || '',
            company: companyElement?.textContent?.trim() || '',
            location: locationElement?.textContent?.trim() || '',
            salary: salaryElement?.textContent?.trim() || '',
            experience: experienceElement?.textContent?.trim() || '',
            source: 'naukri',
            externalUrl: titleElement?.href || ''
          };
        }).filter(job => job.title && job.company);
      });

      await page.close();
      return jobs;
    } catch (error) {
      console.error('Naukri scraping error:', error);
      return [];
    }
  }

  // Indeed.com scraper
  async scrapeIndeed(keyword) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=`;
      await page.goto(url, { waitUntil: 'networkidle2' });

      const jobs = await page.evaluate(() => {
        const jobElements = document.querySelectorAll('[data-jk]');
        return Array.from(jobElements).slice(0, 10).map(element => {
          const titleElement = element.querySelector('h2 a span');
          const companyElement = element.querySelector('[data-testid="company-name"]');
          const locationElement = element.querySelector('[data-testid="job-location"]');
          const salaryElement = element.querySelector('.salary-snippet');

          return {
            title: titleElement?.textContent?.trim() || '',
            company: companyElement?.textContent?.trim() || '',
            location: locationElement?.textContent?.trim() || '',
            salary: salaryElement?.textContent?.trim() || '',
            source: 'indeed',
            externalUrl: `https://www.indeed.com/viewjob?jk=${element.getAttribute('data-jk')}`
          };
        }).filter(job => job.title && job.company);
      });

      await page.close();
      return jobs;
    } catch (error) {
      console.error('Indeed scraping error:', error);
      return [];
    }
  }

  // LinkedIn scraper (simplified - requires API in production)
  async scrapeLinkedIn(keyword) {
    try {
      // Note: LinkedIn has strict anti-scraping measures
      // In production, use LinkedIn API instead
      const response = await axios.get(`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const jobs = [];

      $('.job-search-card').each((i, element) => {
        if (i >= 10) return false; // Limit to 10 jobs

        const title = $(element).find('.base-search-card__title').text().trim();
        const company = $(element).find('.base-search-card__subtitle').text().trim();
        const location = $(element).find('.job-search-card__location').text().trim();
        const link = $(element).find('.base-card__full-link').attr('href');

        if (title && company) {
          jobs.push({
            title,
            company,
            location,
            source: 'linkedin',
            externalUrl: link
          });
        }
      });

      return jobs;
    } catch (error) {
      console.error('LinkedIn scraping error:', error);
      return [];
    }
  }

  // Internshala scraper
  async scrapeInternshala(keyword) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      const url = `https://internshala.com/jobs/${keyword.replace(/\s+/g, '-')}-jobs/`;
      await page.goto(url, { waitUntil: 'networkidle2' });

      const jobs = await page.evaluate(() => {
        const jobElements = document.querySelectorAll('.internship_meta');
        return Array.from(jobElements).slice(0, 10).map(element => {
          const titleElement = element.querySelector('.job-internship-name');
          const companyElement = element.querySelector('.company-name');
          const locationElement = element.querySelector('.locations');
          const salaryElement = element.querySelector('.stipend');

          return {
            title: titleElement?.textContent?.trim() || '',
            company: companyElement?.textContent?.trim() || '',
            location: locationElement?.textContent?.trim() || '',
            salary: salaryElement?.textContent?.trim() || '',
            source: 'internshala',
            externalUrl: titleElement?.href || ''
          };
        }).filter(job => job.title && job.company);
      });

      await page.close();
      return jobs;
    } catch (error) {
      console.error('Internshala scraping error:', error);
      return [];
    }
  }

  // Save unique jobs to database
  async saveUniqueJobs(scrapedJobs) {
    const savedJobs = [];

    for (const jobData of scrapedJobs) {
      try {
        // Check if job already exists
        const existingJob = await Job.findOne({
          title: jobData.title,
          'company.name': jobData.company,
          source: jobData.source
        });

        if (!existingJob) {
          // Parse and structure the job data
          const structuredJob = this.structureJobData(jobData);
          const newJob = new Job(structuredJob);
          await newJob.save();
          savedJobs.push(newJob);
        }
      } catch (error) {
        console.error('Error saving job:', error);
      }
    }

    return savedJobs;
  }

  // Structure scraped data into our job schema
  structureJobData(scrapedJob) {
    return {
      title: scrapedJob.title,
      description: `${scrapedJob.title} position at ${scrapedJob.company}. External job posting from ${scrapedJob.source}.`,
      company: {
        name: scrapedJob.company,
        website: '',
        description: `Company: ${scrapedJob.company}`
      },
      location: scrapedJob.location || 'Not specified',
      workMode: this.inferWorkMode(scrapedJob.title, scrapedJob.location),
      jobType: this.inferJobType(scrapedJob.title),
      experienceLevel: this.inferExperienceLevel(scrapedJob.title),
      salary: this.parseSalary(scrapedJob.salary),
      skills: this.extractSkills(scrapedJob.title),
      requirements: [`Experience in ${scrapedJob.title.toLowerCase()}`],
      benefits: ['Competitive salary', 'Professional growth'],
      source: scrapedJob.source,
      externalUrl: scrapedJob.externalUrl,
      postedBy: null, // External jobs don't have internal posters
      isActive: true,
      lastSynced: new Date()
    };
  }

  // Helper methods for data inference
  inferWorkMode(title, location) {
    if (location?.toLowerCase().includes('remote') || title?.toLowerCase().includes('remote')) {
      return 'remote';
    }
    return 'onsite';
  }

  inferJobType(title) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('intern')) return 'internship';
    if (titleLower.includes('freelance') || titleLower.includes('contract')) return 'contract';
    if (titleLower.includes('part-time')) return 'part-time';
    return 'full-time';
  }

  inferExperienceLevel(title) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('senior') || titleLower.includes('lead')) return 'senior';
    if (titleLower.includes('junior') || titleLower.includes('intern')) return 'junior';
    if (titleLower.includes('entry')) return 'entry';
    return 'mid';
  }

  parseSalary(salaryText) {
    if (!salaryText) return null;
    
    const numbers = salaryText.match(/\d+/g);
    if (numbers && numbers.length >= 1) {
      return {
        min: parseInt(numbers[0]) * 1000, // Assume in thousands
        max: numbers.length > 1 ? parseInt(numbers[1]) * 1000 : null,
        currency: 'USD',
        period: 'yearly'
      };
    }
    return null;
  }

  extractSkills(title) {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'MongoDB',
      'AWS', 'Docker', 'Kubernetes', 'Git', 'HTML', 'CSS', 'TypeScript',
      'Angular', 'Vue.js', 'Express.js', 'PostgreSQL', 'Redis', 'GraphQL'
    ];

    return commonSkills.filter(skill => 
      title.toLowerCase().includes(skill.toLowerCase())
    ).slice(0, 5);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Schedule regular scraping
  startScheduledScraping(intervalHours = 6) {
    console.log(`Starting scheduled job scraping every ${intervalHours} hours`);
    
    setInterval(async () => {
      try {
        await this.scrapeAllPortals();
      } catch (error) {
        console.error('Scheduled scraping error:', error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }
}

export default new JobScrapingService();