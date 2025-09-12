import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

class JobAggregatorService {
  constructor() {
    this.browser = null;
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

  // Aggregate jobs from multiple sources
  async aggregateJobs(searchParams = {}) {
    const { keywords = 'software engineer', location = '', jobType = '', limit = 50 } = searchParams;
    
    try {
      const results = await Promise.allSettled([
        this.scrapeIndeed(keywords, location, jobType),
        this.scrapeNaukri(keywords, location, jobType),
        this.scrapeInternshala(keywords, location, jobType),
        this.scrapeGlassdoor(keywords, location, jobType)
      ]);

      const allJobs = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allJobs.push(...result.value);
        } else {
          console.error(`Scraper ${index} failed:`, result.reason);
        }
      });

      // Remove duplicates and limit results
      const uniqueJobs = this.removeDuplicates(allJobs);
      return uniqueJobs.slice(0, limit);
    } catch (error) {
      console.error('Job aggregation error:', error);
      return [];
    }
  }

  // Indeed scraper
  async scrapeIndeed(keywords, location, jobType) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      const jobs = await page.evaluate(() => {
        const jobElements = document.querySelectorAll('[data-jk]');
        return Array.from(jobElements).slice(0, 20).map(element => {
          const titleElement = element.querySelector('h2 a span[title]');
          const companyElement = element.querySelector('[data-testid="company-name"]');
          const locationElement = element.querySelector('[data-testid="job-location"]');
          const salaryElement = element.querySelector('.salary-snippet-container');
          const summaryElement = element.querySelector('.job-snippet');
          const linkElement = element.querySelector('h2 a');

          return {
            id: element.getAttribute('data-jk'),
            title: titleElement?.getAttribute('title') || titleElement?.textContent?.trim() || '',
            company: companyElement?.textContent?.trim() || '',
            location: locationElement?.textContent?.trim() || '',
            salary: salaryElement?.textContent?.trim() || '',
            summary: summaryElement?.textContent?.trim() || '',
            applyUrl: linkElement ? `https://www.indeed.com${linkElement.getAttribute('href')}` : '',
            source: 'indeed',
            postedDate: new Date().toISOString(),
            jobType: 'full-time',
            workMode: 'onsite'
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

  // Naukri scraper
  async scrapeNaukri(keywords, location, jobType) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchUrl = `https://www.naukri.com/${keywords.replace(/\s+/g, '-')}-jobs${location ? `-in-${location.replace(/\s+/g, '-')}` : ''}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      const jobs = await page.evaluate(() => {
        const jobElements = document.querySelectorAll('.srp-jobtuple-wrapper');
        return Array.from(jobElements).slice(0, 20).map(element => {
          const titleElement = element.querySelector('.title');
          const companyElement = element.querySelector('.comp-name');
          const locationElement = element.querySelector('.locationsContainer');
          const salaryElement = element.querySelector('.salary');
          const experienceElement = element.querySelector('.exp');
          const skillsElement = element.querySelector('.skill-tags');

          return {
            id: `naukri_${Date.now()}_${Math.random()}`,
            title: titleElement?.textContent?.trim() || '',
            company: companyElement?.textContent?.trim() || '',
            location: locationElement?.textContent?.trim() || '',
            salary: salaryElement?.textContent?.trim() || '',
            experience: experienceElement?.textContent?.trim() || '',
            skills: skillsElement?.textContent?.split(',').map(s => s.trim()) || [],
            applyUrl: titleElement?.href || '',
            source: 'naukri',
            postedDate: new Date().toISOString(),
            jobType: 'full-time',
            workMode: 'onsite'
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

  // Internshala scraper
  async scrapeInternshala(keywords, location, jobType) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchUrl = `https://internshala.com/jobs/${keywords.replace(/\s+/g, '-')}-jobs/`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      const jobs = await page.evaluate(() => {
        const jobElements = document.querySelectorAll('.internship_meta');
        return Array.from(jobElements).slice(0, 20).map(element => {
          const titleElement = element.querySelector('.job-internship-name');
          const companyElement = element.querySelector('.company-name');
          const locationElement = element.querySelector('.locations');
          const salaryElement = element.querySelector('.stipend');
          const linkElement = element.querySelector('a');

          return {
            id: `internshala_${Date.now()}_${Math.random()}`,
            title: titleElement?.textContent?.trim() || '',
            company: companyElement?.textContent?.trim() || '',
            location: locationElement?.textContent?.trim() || '',
            salary: salaryElement?.textContent?.trim() || '',
            applyUrl: linkElement ? `https://internshala.com${linkElement.getAttribute('href')}` : '',
            source: 'internshala',
            postedDate: new Date().toISOString(),
            jobType: 'internship',
            workMode: 'onsite'
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

  // Glassdoor scraper
  async scrapeGlassdoor(keywords, location, jobType) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchUrl = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(keywords)}&locT=&locId=&jobType=${jobType}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      const jobs = await page.evaluate(() => {
        const jobElements = document.querySelectorAll('[data-test="job-listing"]');
        return Array.from(jobElements).slice(0, 20).map(element => {
          const titleElement = element.querySelector('[data-test="job-title"]');
          const companyElement = element.querySelector('[data-test="employer-name"]');
          const locationElement = element.querySelector('[data-test="job-location"]');
          const salaryElement = element.querySelector('[data-test="detailSalary"]');
          const linkElement = element.querySelector('a');

          return {
            id: `glassdoor_${Date.now()}_${Math.random()}`,
            title: titleElement?.textContent?.trim() || '',
            company: companyElement?.textContent?.trim() || '',
            location: locationElement?.textContent?.trim() || '',
            salary: salaryElement?.textContent?.trim() || '',
            applyUrl: linkElement ? `https://www.glassdoor.com${linkElement.getAttribute('href')}` : '',
            source: 'glassdoor',
            postedDate: new Date().toISOString(),
            jobType: 'full-time',
            workMode: 'onsite'
          };
        }).filter(job => job.title && job.company);
      });

      await page.close();
      return jobs;
    } catch (error) {
      console.error('Glassdoor scraping error:', error);
      return [];
    }
  }

  // Remove duplicate jobs
  removeDuplicates(jobs) {
    const seen = new Set();
    return jobs.filter(job => {
      const key = `${job.title.toLowerCase()}_${job.company.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Detect if job is paid or unpaid
  detectJobPayment(job) {
    const salaryText = job.salary?.toLowerCase() || '';
    const titleText = job.title?.toLowerCase() || '';
    const summaryText = job.summary?.toLowerCase() || '';
    
    const unpaidKeywords = ['unpaid', 'volunteer', 'no salary', 'stipend only', 'academic credit'];
    const paidKeywords = ['salary', 'paid', 'compensation', '$', '₹', 'lpa', 'per month'];
    
    const hasUnpaidKeywords = unpaidKeywords.some(keyword => 
      salaryText.includes(keyword) || titleText.includes(keyword) || summaryText.includes(keyword)
    );
    
    const hasPaidKeywords = paidKeywords.some(keyword => 
      salaryText.includes(keyword) || titleText.includes(keyword) || summaryText.includes(keyword)
    );
    
    if (hasUnpaidKeywords) return 'unpaid';
    if (hasPaidKeywords || job.salary) return 'paid';
    return 'unknown';
  }

  // Extract skills from job description
  extractSkills(jobText) {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'MongoDB',
      'AWS', 'Docker', 'Kubernetes', 'Git', 'HTML', 'CSS', 'TypeScript',
      'Angular', 'Vue.js', 'Express.js', 'PostgreSQL', 'Redis', 'GraphQL',
      'Machine Learning', 'Data Science', 'AI', 'DevOps', 'Agile', 'Scrum'
    ];

    const text = jobText.toLowerCase();
    return commonSkills.filter(skill => 
      text.includes(skill.toLowerCase())
    );
  }

  // Format job data for consistent structure
  formatJobData(rawJob) {
    return {
      id: rawJob.id,
      title: rawJob.title,
      company: rawJob.company,
      location: rawJob.location,
      salary: this.parseSalary(rawJob.salary),
      skills: this.extractSkills(`${rawJob.title} ${rawJob.summary || ''}`),
      summary: rawJob.summary || `${rawJob.title} position at ${rawJob.company}`,
      applyUrl: rawJob.applyUrl,
      source: rawJob.source,
      postedDate: rawJob.postedDate,
      jobType: rawJob.jobType || 'full-time',
      workMode: this.detectWorkMode(rawJob),
      experienceLevel: this.detectExperienceLevel(rawJob.title),
      paymentType: this.detectJobPayment(rawJob),
      isActive: true
    };
  }

  // Parse salary information
  parseSalary(salaryText) {
    if (!salaryText) return null;
    
    const numbers = salaryText.match(/[\d,]+/g);
    if (numbers && numbers.length > 0) {
      const min = parseInt(numbers[0].replace(/,/g, ''));
      const max = numbers.length > 1 ? parseInt(numbers[1].replace(/,/g, '')) : null;
      
      return {
        min: min,
        max: max,
        currency: salaryText.includes('₹') ? 'INR' : 'USD',
        period: salaryText.includes('month') ? 'monthly' : 'yearly'
      };
    }
    
    return null;
  }

  // Detect work mode from job data
  detectWorkMode(job) {
    const text = `${job.title} ${job.location} ${job.summary || ''}`.toLowerCase();
    
    if (text.includes('remote') || text.includes('work from home')) {
      return 'remote';
    }
    if (text.includes('hybrid')) {
      return 'hybrid';
    }
    return 'onsite';
  }

  // Detect experience level
  detectExperienceLevel(title) {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('principal')) {
      return 'senior';
    }
    if (titleLower.includes('junior') || titleLower.includes('associate')) {
      return 'junior';
    }
    if (titleLower.includes('intern') || titleLower.includes('entry') || titleLower.includes('fresher')) {
      return 'entry';
    }
    return 'mid';
  }

  // Filter jobs based on criteria
  filterJobs(jobs, filters) {
    return jobs.filter(job => {
      if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
      
      if (filters.jobType && job.jobType !== filters.jobType) {
        return false;
      }
      
      if (filters.workMode && job.workMode !== filters.workMode) {
        return false;
      }
      
      if (filters.experienceLevel && job.experienceLevel !== filters.experienceLevel) {
        return false;
      }
      
      if (filters.paymentType && job.paymentType !== filters.paymentType) {
        return false;
      }
      
      if (filters.skills && filters.skills.length > 0) {
        const hasMatchingSkill = filters.skills.some(skill =>
          job.skills.some(jobSkill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        if (!hasMatchingSkill) return false;
      }
      
      if (filters.salaryMin && job.salary?.min && job.salary.min < parseInt(filters.salaryMin)) {
        return false;
      }
      
      if (filters.salaryMax && job.salary?.max && job.salary.max > parseInt(filters.salaryMax)) {
        return false;
      }
      
      return true;
    });
  }

  // Sort jobs
  sortJobs(jobs, sortBy) {
    switch (sortBy) {
      case 'newest':
        return jobs.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
      case 'salary':
        return jobs.sort((a, b) => (b.salary?.min || 0) - (a.salary?.min || 0));
      case 'relevance':
      default:
        return jobs; // Already sorted by relevance from scraping
    }
  }

  // Remove duplicate jobs
  removeDuplicates(jobs) {
    const seen = new Map();
    return jobs.filter(job => {
      const key = `${job.title.toLowerCase().trim()}_${job.company.toLowerCase().trim()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key, true);
      return true;
    });
  }
}

export default new JobAggregatorService();