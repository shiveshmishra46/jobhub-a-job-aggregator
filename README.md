# JobHub - AI-Powered Job Aggregator Platform

A revolutionary job search platform that connects job seekers with their dream careers using artificial intelligence. Built with the MERN stack and powered by Google's Gemini AI for intelligent job matching and career guidance.

## Table of Contents

1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [Solution](#solution)
4. [Features](#features)
5. [Technology Stack](#technology-stack)
6. [Project Structure](#project-structure)
7. [Installation and Setup](#installation-and-setup)
8. [Configuration](#configuration)
9. [Database Setup](#database-setup)
10. [Deployment](#deployment)
11. [API Documentation](#api-documentation)
12. [Contributing](#contributing)
13. [Known Issues](#known-issues)
14. [Support](#support)
15. [License](#license)
16. [Acknowledgments](#acknowledgments)

## Overview

JobHub is a comprehensive job aggregator platform that revolutionizes the way people find jobs and companies hire talent. By leveraging artificial intelligence and real-time data from multiple job portals, we provide personalized job recommendations, intelligent resume analysis, and seamless application tracking.

The platform serves three main user types:
- Job Seekers (Students/Professionals): Find and apply for jobs with AI assistance
- Recruiters: Post jobs and manage applications efficiently
- Administrators: Monitor platform activity and manage users

## Problem Statement

The current job search landscape faces several critical challenges:

### For Job Seekers
- Scattered job listings across multiple platforms requiring separate searches
- Generic job recommendations that don't match individual skills and preferences
- Time-consuming application processes with repetitive form filling
- Lack of real-time communication with recruiters
- No intelligent career guidance or personalized advice
- Difficulty tracking application status across different platforms

### For Recruiters
- Limited reach when posting on single platforms
- Inefficient candidate screening and management processes
- Lack of intelligent candidate matching based on job requirements
- Poor communication tools for candidate engagement
- No centralized dashboard for managing multiple job postings

### For the Industry
- Information silos preventing efficient talent-opportunity matching
- Lack of AI-powered insights for career development
- Inefficient hiring processes leading to longer time-to-hire
- Limited data analytics for job market trends and insights

## Solution

JobHub addresses these challenges through an integrated, AI-powered platform that:

### Unified Job Aggregation
- Automatically scrapes and aggregates jobs from major portals (LinkedIn, Naukri, Indeed, Glassdoor, Internshala)
- Provides a single interface to search across all major job platforms
- Real-time synchronization ensures up-to-date job listings

### AI-Powered Intelligence
- Uses Google's Gemini AI for resume parsing and skill extraction
- Provides personalized job recommendations based on individual profiles
- Offers intelligent career guidance through an AI chat assistant
- Analyzes job market trends and provides insights

### Streamlined Experience
- One-click applications with saved profile information
- Real-time messaging between job seekers and recruiters
- Comprehensive application tracking and status updates
- Mobile-responsive design for job searching on the go

### Advanced Analytics
- Dashboard analytics for recruiters to track job performance
- Application success rate insights for job seekers
- Platform-wide statistics for administrators

## Features

### For Job Seekers

#### Smart Job Discovery
- AI-powered job recommendations based on uploaded resume
- Advanced filtering by location, job type, experience level, salary range
- Real-time job aggregation from multiple sources
- Paid/unpaid job classification with automatic detection
- Save jobs for later review and application

#### AI Career Assistant
- Upload resume for intelligent parsing and skill extraction
- Chat with AI for personalized career advice
- Get job recommendations based on skills and experience
- Receive guidance on career development and job search strategies

#### Application Management
- One-click applications with pre-filled information
- Real-time application status tracking
- Interview scheduling and management
- Application history and analytics

#### Communication Tools
- Direct messaging with recruiters
- Real-time notifications for application updates
- Interview scheduling and reminders

### For Recruiters

#### Job Management
- Create detailed job postings with rich descriptions
- Manage multiple job listings from a centralized dashboard
- Track job performance with views and application metrics
- Feature jobs for increased visibility

#### Candidate Management
- Review applications with candidate profiles and resumes
- Filter and search through applications efficiently
- Update application status with timeline tracking
- Schedule interviews and manage candidate pipeline

#### Communication and Analytics
- Direct messaging with candidates
- Dashboard analytics for hiring insights
- Application status management with feedback options
- Export candidate data for external processing

### For Administrators

#### Platform Monitoring
- Comprehensive dashboard with user and job statistics
- Monitor platform activity and user engagement
- Track job posting trends and application patterns

#### User Management
- Manage user accounts and permissions
- Monitor platform usage and performance
- Content moderation and quality control

### Technical Features

#### Real-time Capabilities
- Socket.io integration for instant messaging
- Live notifications for application updates
- Real-time job synchronization from external APIs

#### AI Integration
- Google Gemini API for resume parsing and analysis
- Intelligent job matching algorithms
- Natural language processing for career guidance

#### Security and Performance
- JWT-based authentication with role-based access control
- Rate limiting and security middleware
- File upload with virus scanning and validation
- Responsive design optimized for all devices

## Technology Stack

### Frontend Technologies
- React.js 18.3.1 - Modern UI library with hooks and context
- React Router DOM 6.26.2 - Client-side routing and navigation
- Tailwind CSS 3.4.1 - Utility-first CSS framework for styling
- Axios 1.7.7 - HTTP client for API communication
- Socket.io Client 4.8.0 - Real-time bidirectional communication
- React Hot Toast 2.4.1 - Beautiful notification system
- Lucide React 0.344.0 - Modern icon library
- Vite 5.4.2 - Fast build tool and development server

### Backend Technologies
- Node.js - JavaScript runtime environment
- Express.js 4.18.2 - Web application framework
- MongoDB with Mongoose 7.5.0 - NoSQL database with ODM
- Socket.io 4.8.1 - Real-time communication server
- JWT (jsonwebtoken 9.0.2) - Authentication and authorization
- bcryptjs 2.4.3 - Password hashing and security
- Multer 1.4.5 - File upload middleware
- GridFS Stream 1.1.1 - Large file storage system

### AI and Machine Learning
- Google Generative AI 0.24.1 - Gemini API integration
- Natural 6.5.0 - Natural language processing
- PDF Parse 1.1.1 - Resume text extraction
- TensorFlow.js Node 4.10.0 - Machine learning capabilities

### Web Scraping and Data
- Puppeteer 21.11.0 - Headless browser for web scraping
- Cheerio 1.1.2 - Server-side HTML parsing
- Axios 1.11.0 - HTTP requests for API calls

### Security and Utilities
- Helmet 7.2.0 - Security headers middleware
- Express Rate Limit 6.11.2 - API rate limiting
- Express Validator 7.2.1 - Input validation and sanitization
- Compression 1.8.1 - Response compression
- Morgan 1.10.1 - HTTP request logging
- CORS 2.8.5 - Cross-origin resource sharing

### Development Tools
- Nodemon 3.0.1 - Development server auto-restart
- ESLint 9.9.1 - Code linting and quality
- PostCSS 8.4.35 - CSS processing
- Autoprefixer 10.4.18 - CSS vendor prefixing

## Project Structure

```
job-aggregator/
├── README.md                          # Project documentation
├── package.json                       # Frontend dependencies and scripts
├── vite.config.js                     # Vite configuration
├── tailwind.config.js                 # Tailwind CSS configuration
├── postcss.config.js                  # PostCSS configuration
├── eslint.config.js                   # ESLint configuration
├── index.html                         # Main HTML template
│
├── src/                               # Frontend source code
│   ├── main.jsx                       # Application entry point
│   ├── App.jsx                        # Main application component
│   ├── index.css                      # Global styles and Tailwind imports
│   │
│   ├── components/                    # Reusable UI components
│   │   ├── auth/                      # Authentication components
│   │   │   ├── ProtectedRoute.jsx     # Route protection wrapper
│   │   │   └── GoogleAuthCallback.jsx # Google OAuth callback handler
│   │   ├── layout/                    # Layout components
│   │   │   ├── Header.jsx             # Navigation header
│   │   │   └── Footer.jsx             # Site footer
│   │   └── ui/                        # UI utility components
│   │       ├── LoadingSpinner.jsx     # Loading indicator
│   │       ├── GlassmorphismCard.jsx  # Glassmorphism card component
│   │       ├── AnimatedBackground.jsx # Animated background effects
│   │       └── NeuralNetworkButton.jsx # AI-themed button component
│   │
│   ├── context/                       # React context providers
│   │   ├── AuthContext.jsx            # Authentication state management
│   │   ├── SocketContext.jsx          # Socket.io connection management
│   │   ├── NotificationContext.jsx    # Notification system
│   │   └── JobContext.jsx             # Job-related state management
│   │
│   ├── pages/                         # Page components
│   │   ├── Home.jsx                   # Landing page with hero section
│   │   ├── Login.jsx                  # User login page
│   │   ├── Register.jsx               # User registration page
│   │   ├── Dashboard.jsx              # User dashboard (role-specific)
│   │   ├── Jobs.jsx                   # Job listings with AI features
│   │   ├── JobDetails.jsx             # Individual job details page
│   │   ├── Applications.jsx           # Application tracking page
│   │   ├── Profile.jsx                # User profile management
│   │   ├── Messages.jsx               # Real-time messaging interface
│   │   ├── RecruiterDashboard.jsx     # Recruiter management dashboard
│   │   ├── PostJob.jsx                # Job posting form
│   │   └── AdminDashboard.jsx         # Admin control panel
│   │
│   ├── services/                      # Frontend service utilities
│   │   └── notificationService.js     # Notification handling service
│   │
│   └── utils/                         # Utility functions
│       ├── dateUtils.js               # Date formatting and manipulation
│       └── validation.js              # Form validation utilities
│
├── server/                            # Backend application
│   ├── server.js                      # Main server entry point
│   ├── package.json                   # Backend dependencies
│   ├── .env                           # Environment variables
│   ├── .env.example                   # Environment template
│   │
│   ├── models/                        # MongoDB data models
│   │   ├── User.js                    # User account model
│   │   ├── Job.js                     # Job posting model
│   │   ├── Application.js             # Job application model
│   │   ├── Message.js                 # Chat message model
│   │   └── Conversation.js            # Conversation thread model
│   │
│   ├── routes/                        # API route handlers
│   │   ├── auth.js                    # Authentication endpoints
│   │   ├── jobs.js                    # Job-related endpoints
│   │   ├── applications.js            # Application management endpoints
│   │   ├── messages.js                # Messaging endpoints
│   │   ├── users.js                   # User management endpoints
│   │   ├── files.js                   # File upload endpoints
│   │   ├── admin.js                   # Admin-only endpoints
│   │   └── ai.js                      # AI service endpoints
│   │
│   ├── middleware/                    # Custom middleware
│   │   └── auth.js                    # Authentication middleware
│   │
│   ├── services/                      # Business logic services
│   │   ├── geminiService.js           # Google Gemini AI integration
│   │   ├── jobAggregatorService.js    # Multi-portal job scraping
│   │   ├── jobScrapingService.js      # Individual portal scrapers
│   │   ├── aiSkillMatching.js         # AI skill matching algorithms
│   │   ├── recommendationEngine.js    # Job recommendation system
│   │   └── linkedinIntegration.js     # LinkedIn API integration
│   │
│   ├── socket/                        # Socket.io handlers
│   │   └── socketHandlers.js          # Real-time event handling
│   │
│   └── config/                        # Configuration files
│       └── passport.js                # Passport.js OAuth configuration
```

## Installation and Setup

### Prerequisites

Before starting, ensure you have the following installed on your system:

- Node.js (version 16.0.0 or higher)
- npm (version 8.0.0 or higher) or yarn
- MongoDB (version 5.0 or higher) or MongoDB Atlas account
- Git for version control
- A code editor (VS Code recommended)
- Google Cloud account for Gemini API access

### Step 1: Clone the Repository

Open your terminal and run the following commands:

```bash
# Clone the repository
git clone https://github.com/your-username/jobhub-ai-platform.git

# Navigate to the project directory
cd jobhub-ai-platform

# Verify the project structure
ls -la
```

You should see the main project folders: `src/`, `server/`, `package.json`, etc.

### Step 2: Frontend Setup (Detailed)

#### 2.1 Navigate to Frontend Directory

```bash
# Make sure you're in the root directory
pwd
# Should show: /path/to/jobhub-ai-platform
```

#### 2.2 Install Frontend Dependencies

```bash
# Install all frontend dependencies
npm install

# This will install:
# - React and React DOM for UI
# - React Router for navigation
# - Tailwind CSS for styling
# - Axios for API calls
# - Socket.io client for real-time features
# - Lucide React for icons
# - React Hot Toast for notifications
```

#### 2.3 Verify Frontend Installation

```bash
# Check if node_modules was created
ls -la node_modules/

# Verify key packages are installed
npm list react react-dom react-router-dom axios socket.io-client
```

#### 2.4 Configure Frontend Environment

Create a `.env.local` file in the root directory:

```bash
# Create environment file
touch .env.local

# Add the following content to .env.local:
echo "VITE_API_URL=http://localhost:5000" >> .env.local
echo "VITE_SOCKET_URL=http://localhost:5000" >> .env.local
```

#### 2.5 Test Frontend Setup

```bash
# Start the development server
npm run dev

# You should see output like:
# VITE v5.4.2  ready in 500 ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

Open your browser and navigate to `http://localhost:5173`. You should see the JobHub landing page.

### Step 3: Backend Setup (Detailed)

#### 3.1 Navigate to Backend Directory

Open a new terminal window and run:

```bash
# Navigate to the server directory
cd server

# Verify you're in the correct directory
pwd
# Should show: /path/to/jobhub-ai-platform/server

# Check server files
ls -la
```

#### 3.2 Install Backend Dependencies

```bash
# Install all backend dependencies
npm install

# This will install:
# - Express.js for the web server
# - Mongoose for MongoDB integration
# - Socket.io for real-time communication
# - JWT for authentication
# - Bcryptjs for password hashing
# - Multer and GridFS for file uploads
# - Google Generative AI for Gemini integration
# - Puppeteer for web scraping
# - And many more security and utility packages
```

#### 3.3 Verify Backend Installation

```bash
# Check if node_modules was created
ls -la node_modules/

# Verify key packages
npm list express mongoose socket.io jsonwebtoken @google/generative-ai
```

#### 3.4 Configure Backend Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your specific configuration
nano .env
# or use your preferred editor: code .env
```

Fill in the `.env` file with your specific values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/jobhub-ai

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-characters

# Client Configuration
CLIENT_URL=http://localhost:5173

# File Upload Configuration
MAX_FILE_SIZE=10485760

# Google Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-from-google-cloud

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# External API Keys (Optional)
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
INDEED_API_KEY=your-indeed-api-key
NAUKRI_API_KEY=your-naukri-api-key

# Google OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### 3.5 Test Backend Setup

```bash
# Start the backend server
npm run dev

# You should see output like:
# [nodemon] starting `node server.js`
# Server running on port 5000
# MongoDB Connected: localhost:27017
```

### Step 4: Configuration Details

#### 4.1 Google Gemini AI Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key and add it to your `.env` file as `GEMINI_API_KEY`

#### 4.2 MongoDB Configuration Options

##### Option A: Local MongoDB Installation

```bash
# Install MongoDB on macOS
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Verify MongoDB is running
mongosh
# Should connect to MongoDB shell
```

##### Option B: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Replace `MONGODB_URI` in `.env` with your Atlas connection string

#### 4.3 Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
   - `http://localhost:5173/auth/callback`
6. Copy Client ID and Secret to your `.env` file

### Step 5: Database Setup

#### 5.1 MongoDB Database Creation

```bash
# Connect to MongoDB
mongosh

# Create the database
use jobhub-ai

# Create initial collections (optional - will be created automatically)
db.createCollection("users")
db.createCollection("jobs")
db.createCollection("applications")
db.createCollection("messages")
db.createCollection("conversations")

# Exit MongoDB shell
exit
```

#### 5.2 Database Indexes (Automatic)

The application automatically creates the following indexes when it starts:

- User email index for fast authentication
- Job title and description text indexes for search
- Application status indexes for filtering
- Message conversation indexes for chat performance

#### 5.3 Initial Data Setup

The application will automatically create:
- Database collections on first run
- GridFS buckets for file storage
- Default admin user (if configured)

### Step 6: Running the Complete Application

#### 6.1 Start Backend Server

In the server directory:

```bash
cd server
npm run dev
```

Wait for the following messages:
- "Server running on port 5000"
- "MongoDB Connected: [your-mongodb-host]"

#### 6.2 Start Frontend Development Server

In a new terminal, from the root directory:

```bash
npm run dev
```

Wait for:
- "VITE ready in [time]"
- "Local: http://localhost:5173/"

#### 6.3 Verify Complete Setup

1. Open `http://localhost:5173` in your browser
2. You should see the JobHub landing page
3. Try registering a new account
4. Navigate to the Jobs page
5. Upload a resume to test AI features
6. Verify real-time messaging works

## Configuration

### Environment Variables Reference

#### Frontend Environment Variables (.env.local)

```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# Feature Flags
VITE_ENABLE_GOOGLE_AUTH=true
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_JOB_SCRAPING=true
```

#### Backend Environment Variables (.env)

```env
# Server Settings
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/jobhub-ai

# Security
JWT_SECRET=your-jwt-secret-minimum-32-characters-long
BCRYPT_ROUNDS=12

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# External APIs
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### Vite Configuration

The `vite.config.js` file includes:
- React plugin for JSX support
- Proxy configuration for API calls
- Optimization settings for production builds

### Tailwind Configuration

The `tailwind.config.js` includes:
- Custom color schemes
- Extended spacing and typography
- Custom animations and transitions

## Database Setup

### MongoDB Schema Design

#### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (admin/recruiter/student),
  profile: {
    phone: String,
    location: String,
    bio: String,
    skills: [String],
    experience: String,
    education: String,
    resume: {
      fileId: ObjectId,
      filename: String,
      contentType: String
    }
  },
  preferences: {
    jobTypes: [String],
    locations: [String],
    workMode: String,
    notifications: Object
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Jobs Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  company: {
    name: String,
    logo: String,
    website: String
  },
  location: String,
  workMode: String (remote/onsite/hybrid),
  jobType: String (full-time/part-time/contract/internship),
  experienceLevel: String,
  salary: {
    min: Number,
    max: Number,
    currency: String,
    period: String
  },
  skills: [String],
  requirements: [String],
  benefits: [String],
  source: String (internal/linkedin/indeed/etc),
  externalUrl: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Applications Collection
```javascript
{
  _id: ObjectId,
  job: ObjectId (ref: Job),
  candidate: ObjectId (ref: User),
  recruiter: ObjectId (ref: User),
  status: String (pending/reviewed/shortlisted/rejected/hired),
  coverLetter: String,
  resume: {
    fileId: ObjectId,
    filename: String
  },
  timeline: [{
    status: String,
    date: Date,
    notes: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Database Indexes

The application creates the following indexes automatically:

```javascript
// User indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ "profile.skills": 1 })

// Job indexes
db.jobs.createIndex({ title: "text", description: "text" })
db.jobs.createIndex({ location: 1, workMode: 1, jobType: 1 })
db.jobs.createIndex({ skills: 1 })
db.jobs.createIndex({ createdAt: -1 })
db.jobs.createIndex({ isActive: 1 })

// Application indexes
db.applications.createIndex({ job: 1, candidate: 1 }, { unique: true })
db.applications.createIndex({ candidate: 1, status: 1 })
db.applications.createIndex({ recruiter: 1, status: 1 })

// Message indexes
db.messages.createIndex({ conversation: 1, createdAt: -1 })
db.messages.createIndex({ sender: 1, receiver: 1 })
```

## Deployment

### Frontend Deployment (Netlify)

#### Step 1: Build the Frontend

```bash
# In the root directory
npm run build

# This creates a 'dist' folder with optimized files
ls -la dist/
```

#### Step 2: Deploy to Netlify

1. Go to [Netlify](https://www.netlify.com/)
2. Sign up or log in
3. Click "New site from Git"
4. Connect your GitHub repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variables in Netlify dashboard:
   - `VITE_API_URL`: Your backend URL
   - `VITE_SOCKET_URL`: Your backend URL

#### Step 3: Configure Custom Domain (Optional)

1. In Netlify dashboard, go to Domain settings
2. Add your custom domain
3. Configure DNS settings as instructed

### Frontend Deployment (Vercel)

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Deploy

```bash
# In the root directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name: jobhub-ai-platform
# - Directory: ./
```

#### Step 3: Configure Environment Variables

```bash
# Add environment variables
vercel env add VITE_API_URL
# Enter: your-backend-url

vercel env add VITE_SOCKET_URL
# Enter: your-backend-url
```

### Backend Deployment (Railway/Render)

#### Option A: Railway Deployment

1. Go to [Railway](https://railway.app/)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Configure environment variables in Railway dashboard
6. Set start command: `cd server && npm start`

#### Option B: Render Deployment

1. Go to [Render](https://render.com/)
2. Sign up and connect GitHub
3. Click "New" → "Web Service"
4. Select your repository
5. Configure:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add environment variables in Render dashboard

### Database Deployment (MongoDB Atlas)

#### Step 1: Create Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for free account
3. Create a new cluster (free tier available)

#### Step 2: Configure Database

1. Create database user:
   - Username: `jobhub-user`
   - Password: Generate secure password
2. Configure network access:
   - Add IP address: `0.0.0.0/0` (for development)
   - For production: Add specific server IPs

#### Step 3: Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password
5. Update `MONGODB_URI` in your environment variables

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

Request Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "student"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

#### POST /api/auth/login
Authenticate user and get access token.

Request Body:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

#### GET /api/auth/me
Get current authenticated user information.

Headers:
```
Authorization: Bearer jwt-token-here
```

Response:
```json
{
  "_id": "user-id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "student",
  "profile": {
    "skills": ["JavaScript", "React", "Node.js"],
    "location": "New York, NY"
  }
}
```

#### PUT /api/auth/profile
Update user profile information.

Headers:
```
Authorization: Bearer jwt-token-here
```

Request Body:
```json
{
  "name": "John Smith",
  "profile": {
    "phone": "+1234567890",
    "location": "San Francisco, CA",
    "bio": "Experienced software developer",
    "skills": ["JavaScript", "React", "Node.js", "Python"]
  }
}
```

### Job Endpoints

#### GET /api/jobs/search
Search and filter jobs from multiple sources.

Query Parameters:
- `keywords` (string): Search keywords
- `location` (string): Job location
- `jobType` (string): full-time, part-time, contract, internship, freelance
- `workMode` (string): remote, onsite, hybrid
- `experienceLevel` (string): entry, junior, mid, senior, lead
- `paymentType` (string): paid, unpaid
- `salaryMin` (number): Minimum salary
- `salaryMax` (number): Maximum salary
- `sortBy` (string): newest, relevance, salary
- `page` (number): Page number for pagination
- `limit` (number): Number of jobs per page

Example Request:
```
GET /api/jobs/search?keywords=software engineer&location=remote&jobType=full-time&page=1&limit=20
```

Response:
```json
{
  "jobs": [
    {
      "id": "job-id",
      "title": "Senior Software Engineer",
      "company": "TechCorp Inc",
      "location": "Remote",
      "salary": {
        "min": 80000,
        "max": 120000,
        "currency": "USD",
        "period": "yearly"
      },
      "skills": ["JavaScript", "React", "Node.js"],
      "workMode": "remote",
      "jobType": "full-time",
      "experienceLevel": "senior",
      "paymentType": "paid",
      "applyUrl": "https://company.com/apply/job-id",
      "source": "linkedin",
      "postedDate": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### POST /api/jobs/ai-recommendations
Get AI-powered job recommendations based on resume.

Headers:
```
Authorization: Bearer jwt-token-here
```

Request Body:
```json
{
  "resumeData": {
    "name": "John Doe",
    "skills": ["JavaScript", "React", "Node.js"],
    "experience": "3 years",
    "education": "Computer Science Degree"
  }
}
```

Response:
```json
{
  "recommendations": [
    {
      "id": "job-id",
      "title": "React Developer",
      "company": "StartupXYZ",
      "matchScore": 0.95,
      "reasons": [
        "Strong React skills match",
        "Experience level aligns",
        "Location preference match"
      ]
    }
  ]
}
```

#### POST /api/jobs/ai-chat
Chat with AI about jobs and career advice.

Headers:
```
Authorization: Bearer jwt-token-here
```

Request Body:
```json
{
  "message": "What are the best jobs for a React developer?",
  "resumeData": {
    "skills": ["JavaScript", "React", "Node.js"]
  },
  "chatHistory": [
    {
      "role": "user",
      "content": "Previous message"
    }
  ]
}
```

Response:
```json
{
  "response": "Based on your React skills, I recommend looking at Frontend Developer, Full Stack Developer, and React Native Developer positions. Here are some specific opportunities...",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

#### POST /api/jobs/parse-resume
Parse resume content using AI.

Headers:
```
Authorization: Bearer jwt-token-here
```

Request Body:
```json
{
  "resumeText": "John Doe\nSoftware Engineer\n3 years experience..."
}
```

Response:
```json
{
  "data": {
    "name": "John Doe",
    "skills": ["JavaScript", "React", "Node.js"],
    "experience": "3 years",
    "education": "Computer Science Degree",
    "summary": "Experienced software engineer..."
  }
}
```

### Application Endpoints

#### POST /api/applications
Apply for a job position.

Headers:
```
Authorization: Bearer jwt-token-here
```

Request Body:
```json
{
  "jobId": "job-id",
  "coverLetter": "I am interested in this position because..."
}
```

Response:
```json
{
  "message": "Application submitted successfully",
  "application": {
    "_id": "application-id",
    "job": "job-id",
    "candidate": "user-id",
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### GET /api/applications/my-applications
Get user's job applications.

Headers:
```
Authorization: Bearer jwt-token-here
```

Query Parameters:
- `status` (string): Filter by application status
- `page` (number): Page number
- `limit` (number): Applications per page

Response:
```json
{
  "applications": [
    {
      "_id": "application-id",
      "job": {
        "title": "Software Engineer",
        "company": "TechCorp"
      },
      "status": "pending",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 3,
    "total": 25
  }
}
```

#### GET /api/applications/received
Get applications for recruiter's jobs.

Headers:
```
Authorization: Bearer jwt-token-here
```

Query Parameters:
- `status` (string): Filter by status
- `jobId` (string): Filter by specific job
- `page` (number): Page number
- `limit` (number): Applications per page

#### PUT /api/applications/:id/status
Update application status (recruiters only).

Headers:
```
Authorization: Bearer jwt-token-here
```

Request Body:
```json
{
  "status": "shortlisted",
  "notes": "Great candidate, moving to next round"
}
```

### Message Endpoints

#### POST /api/messages
Send a message to another user.

Headers:
```
Authorization: Bearer jwt-token-here
```

Request Body:
```json
{
  "receiverId": "user-id",
  "content": "Hello, I'm interested in the position..."
}
```

Response:
```json
{
  "message": "Message sent successfully",
  "data": {
    "_id": "message-id",
    "sender": "sender-id",
    "receiver": "receiver-id",
    "content": "Hello, I'm interested...",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### GET /api/messages/conversations
Get user's conversation list.

Headers:
```
Authorization: Bearer jwt-token-here
```

Response:
```json
[
  {
    "conversationId": "conversation-id",
    "participant": {
      "_id": "user-id",
      "name": "Jane Smith",
      "role": "recruiter"
    },
    "lastMessage": {
      "content": "Thanks for your application",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    "unreadCount": 2
  }
]
```

#### GET /api/messages/conversation/:participantId
Get messages in a conversation.

Headers:
```
Authorization: Bearer jwt-token-here
```

Response:
```json
{
  "messages": [
    {
      "_id": "message-id",
      "sender": {
        "_id": "sender-id",
        "name": "John Doe"
      },
      "content": "Hello, I'm interested in the position",
      "createdAt": "2024-01-15T10:00:00Z",
      "read": true
    }
  ]
}
```

### File Upload Endpoints

#### POST /api/files/upload-resume
Upload and parse resume file.

Headers:
```
Authorization: Bearer jwt-token-here
Content-Type: multipart/form-data
```

Request Body:
```
resume: [PDF/DOC file]
```

Response:
```json
{
  "message": "Resume uploaded and processed successfully",
  "text": "Extracted resume text content...",
  "file": {
    "id": "file-id",
    "filename": "resume.pdf",
    "contentType": "application/pdf",
    "size": 1024000
  }
}
```

#### GET /api/files/:id
Download or view uploaded file.

Response: File content with appropriate headers

### AI Service Endpoints

#### GET /api/ai/recommendations/:userId
Get AI-powered job recommendations.

Headers:
```
Authorization: Bearer jwt-token-here
```

Query Parameters:
- `limit` (number): Number of recommendations

#### POST /api/ai/interaction
Record user interaction for ML learning.

Headers:
```
Authorization: Bearer jwt-token-here
```

Request Body:
```json
{
  "jobId": "job-id",
  "interactionType": "view",
  "weight": 1
}
```

### Admin Endpoints

#### GET /api/admin/stats
Get platform statistics (admin only).

Headers:
```
Authorization: Bearer jwt-token-here
```

Response:
```json
{
  "totalUsers": 1500,
  "totalJobs": 5000,
  "totalApplications": 12000,
  "activeUsers": 800,
  "recentActivity": []
}
```

## Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/jobhub-ai-platform.git
   ```
3. Create a new branch for your feature:
   ```bash
   git checkout -b feature/amazing-new-feature
   ```

### Development Guidelines

1. Follow the existing code style and conventions
2. Write clear, descriptive commit messages
3. Add tests for new functionality
4. Update documentation as needed
5. Ensure all tests pass before submitting

### Code Style

- Use ESLint configuration provided in the project
- Follow React best practices and hooks guidelines
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Submitting Changes

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Add amazing new feature"
   ```
2. Push to your fork:
   ```bash
   git push origin feature/amazing-new-feature
   ```
3. Create a Pull Request on GitHub
4. Describe your changes and why they're needed
5. Wait for code review and feedback

### Areas for Contribution

- UI/UX improvements and new components
- Additional job portal integrations
- Enhanced AI features and algorithms
- Mobile app development (React Native)
- Performance optimizations
- Security enhancements
- Documentation improvements
- Bug fixes and testing

## Known Issues

### Current Limitations

- File upload size is limited to 10MB per file
- Real-time features require stable internet connection
- Mobile responsiveness needs testing on various devices
- Some job portals may block scraping attempts
- AI recommendations require sufficient training data

### Browser Compatibility

- Chrome 90+ (fully supported)
- Firefox 88+ (fully supported)
- Safari 14+ (mostly supported, some features limited)
- Edge 90+ (fully supported)
- Internet Explorer (not supported)

### Performance Considerations

- Large resume files may take longer to process
- Job scraping can be slow during peak hours
- Real-time messaging requires WebSocket support
- AI recommendations improve with more user data

### Security Notes

- Always use HTTPS in production
- Regularly update dependencies for security patches
- Monitor for unusual API usage patterns
- Implement proper rate limiting for public endpoints

## Support

### Getting Help

If you need assistance with JobHub, here are your options:

#### Documentation
- Check this README for setup and configuration help
- Review the API documentation for integration details
- Look at code comments for implementation guidance

#### Community Support
- Create an issue on GitHub for bugs or feature requests
- Join our Discord community for real-time help
- Check existing issues for similar problems and solutions

#### Professional Support
- Email: support@jobhub.com
- Business inquiries: business@jobhub.com
- Security issues: security@jobhub.com

#### Response Times
- GitHub issues: 24-48 hours
- Email support: 1-2 business days
- Security issues: Within 24 hours

### Reporting Bugs

When reporting bugs, please include:

1. Steps to reproduce the issue
2. Expected vs actual behavior
3. Browser and operating system information
4. Console error messages (if any)
5. Screenshots or screen recordings (if helpful)

### Feature Requests

For new feature requests:

1. Check existing issues to avoid duplicates
2. Describe the problem you're trying to solve
3. Explain your proposed solution
4. Consider the impact on existing users
5. Be open to alternative approaches

## License

This project is licensed under the MIT License. This means you can:

- Use the software for any purpose
- Change the software to suit your needs
- Share the software with others
- Share your changes

### MIT License Terms

```
Copyright (c) 2024 JobHub Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Acknowledgments

### Open Source Libraries

We're grateful to the amazing open source community and the following projects:

#### Frontend Libraries
- React.js team for creating an incredible UI library that makes building interactive interfaces a joy
- React Router team for seamless client-side routing capabilities
- Tailwind CSS team for the utility-first CSS framework that speeds up development
- Lucide team for the beautiful and consistent icon library
- Vite team for the lightning-fast build tool and development experience

#### Backend Libraries
- Express.js community for the robust and flexible web application framework
- Mongoose team for the elegant MongoDB object modeling library
- Socket.io team for making real-time communication simple and reliable
- Passport.js team for comprehensive authentication strategies

#### AI and Machine Learning
- Google AI team for the powerful Gemini API that enables intelligent features
- TensorFlow.js team for bringing machine learning to JavaScript
- Natural Language Toolkit contributors for text processing capabilities

#### Security and Utilities
- JWT team for secure token-based authentication
- bcrypt contributors for reliable password hashing
- Helmet.js team for security middleware
- All the security researchers who help keep our dependencies safe

### Special Thanks

- The MongoDB team for providing a flexible and scalable database solution
- The Node.js community for creating an amazing JavaScript runtime
- All beta testers who provided valuable feedback during development
- The job seekers and recruiters who inspired this platform
- Open source contributors who make projects like this possible

### Inspiration

This project was inspired by the need to democratize access to job opportunities and make the hiring process more efficient and fair for everyone involved. We believe that technology, especially AI, can help bridge the gap between talented individuals and great opportunities.

### Community

Join our growing community of developers, job seekers, and recruiters who are passionate about improving the job search experience:

- GitHub: Star the repository and contribute to development
- Discord: Join real-time discussions and get help
- LinkedIn: Follow us for updates and job market insights
- Twitter: Get the latest news and feature announcements

---

Built with passion and dedication by the JobHub team. We believe in connecting talent with opportunities and making the job search process more human, intelligent, and effective.

Happy job hunting and hiring! 🚀# jobhub-a-job-aggregator
