import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Filter,
  Star,
  Clock,
  Building,
  DollarSign,
  Users,
  ChevronDown,
  X,
  Heart,
  Share2,
  ExternalLink,
  Upload,
  Bot,
  MessageCircle,
  Send,
  Paperclip,
  Sparkles,
  TrendingUp,
  Award,
  Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import axios from 'axios';

const Jobs = () => {
  const { isAuthenticated, user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    jobType: '',
    workMode: '',
    experienceLevel: '',
    paymentType: '',
    salaryMin: '',
    salaryMax: '',
    sortBy: 'relevance'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        keywords: search || 'software engineer',
        page,
        limit: 20,
        ...filters
      };

      const response = await axios.get('/api/jobs/search', { params });
      
      if (page === 1) {
        setJobs(response.data.jobs);
      } else {
        setJobs(prev => [...prev, ...response.data.jobs]);
      }
      
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchJobs(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      jobType: '',
      workMode: '',
      experienceLevel: '',
      paymentType: '',
      salaryMin: '',
      salaryMax: '',
      sortBy: 'relevance'
    });
    setSearch('');
    fetchJobs(1);
  };

  const loadMore = () => {
    if (pagination.hasNext) {
      fetchJobs(pagination.current + 1);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.includes('document')) {
      toast.error('Please upload a PDF or DOC file');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('resume', file);

      // Upload and parse resume
      const uploadResponse = await axios.post('/api/files/upload-resume', formData);
      const parseResponse = await axios.post('/api/jobs/parse-resume', {
        resumeText: uploadResponse.data.text
      });

      setResumeData(parseResponse.data.data);
      toast.success('Resume uploaded and analyzed!');

      // Get AI recommendations
      const recResponse = await axios.post('/api/jobs/ai-recommendations', {
        resumeData: parseResponse.data.data
      });

      setAiRecommendations(recResponse.data.recommendations);
      toast.success(`Found ${recResponse.data.recommendations.length} AI-recommended jobs!`);

    } catch (error) {
      console.error('Resume upload error:', error);
      toast.error('Failed to process resume');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await axios.post('/api/jobs/ai-chat', {
        message: chatInput,
        resumeData,
        chatHistory: chatMessages
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get AI response');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSaveJob = (jobId) => {
    if (!isAuthenticated) {
      toast.error('Please login to save jobs');
      return;
    }
    
    setJobs(prev => 
      prev.map(job => 
        job.id === jobId 
          ? { ...job, isSaved: !job.isSaved }
          : job
      )
    );
    
    const job = jobs.find(j => j.id === jobId);
    toast.success(job?.isSaved ? 'Job removed from saved' : 'Job saved!');
  };

  const handleShareJob = (job) => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Check out this job at ${job.company}`,
        url: job.applyUrl
      });
    } else {
      navigator.clipboard.writeText(job.applyUrl);
      toast.success('Job link copied to clipboard!');
    }
  };

  const JobCard = ({ job, isRecommended = false }) => (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 border ${
      isRecommended ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white' : 'border-gray-200'
    }`}>
      {isRecommended && (
        <div className="flex items-center mb-3">
          <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
          <span className="text-sm font-medium text-blue-600">AI Recommended</span>
          <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {Math.round(job.matchScore * 100)}% match
          </span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
              {job.title}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full ${
              job.paymentType === 'paid' ? 'bg-green-100 text-green-800' :
              job.paymentType === 'unpaid' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {job.paymentType || 'Unknown'}
            </span>
          </div>
          
          <div className="flex items-center text-gray-600 mb-2">
            <Building className="h-4 w-4 mr-2" />
            <span className="font-medium">{job.company}</span>
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {job.source}
            </span>
          </div>
          
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{job.location}</span>
            <span className="mx-2">•</span>
            <span className="capitalize">{job.workMode}</span>
            <span className="mx-2">•</span>
            <span className="capitalize">{job.jobType}</span>
          </div>

          {job.salary && job.salary.min && (
            <div className="flex items-center text-green-600 text-sm mb-3">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>
                {job.salary.currency === 'INR' ? '₹' : '$'}{job.salary.min.toLocaleString()} 
                {job.salary.max ? ` - ${job.salary.currency === 'INR' ? '₹' : '$'}${job.salary.max.toLocaleString()}` : '+'} 
                {job.salary.period}
              </span>
            </div>
          )}

          {job.summary && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {job.summary}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleSaveJob(job.id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Save job"
          >
            <Heart className={`h-5 w-5 ${job.isSaved ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
          <button
            onClick={() => handleShareJob(job)}
            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
            title="Share job"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {job.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="text-gray-500 text-xs">
              +{job.skills.length - 4} more
            </span>
          )}
        </div>
      )}

      {isRecommended && job.reasons && (
        <div className="bg-blue-50 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Why this job matches:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            {job.reasons.map((reason, index) => (
              <li key={index} className="flex items-start">
                <Target className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          <span>{new Date(job.postedDate).toLocaleDateString()}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center"
          >
            Apply Now
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Your Perfect Job
          </h1>
          <p className="text-gray-600">
            Discover real opportunities from top job portals worldwide
          </p>
        </div>

        {/* AI Resume Upload Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2 flex items-center">
                <Bot className="h-6 w-6 mr-2" />
                AI-Powered Job Matching
              </h2>
              <p className="text-blue-100 mb-4">
                Upload your resume to get personalized job recommendations powered by AI
              </p>
              
              {resumeData && (
                <div className="bg-white/10 rounded-lg p-3 mb-4">
                  <p className="text-sm">
                    <strong>Analyzed:</strong> {resumeData.name || 'Your Resume'} • 
                    {resumeData.skills?.length || 0} skills • 
                    {resumeData.totalExperience || 0} years experience
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Upload Resume
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={() => setShowAiChat(!showAiChat)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                AI Chat
              </button>
            </div>
          </div>
        </div>

        {/* AI Chat Interface */}
        {showAiChat && (
          <div className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center">
                  <Bot className="h-5 w-5 mr-2" />
                  AI Career Assistant
                </h3>
                <button
                  onClick={() => setShowAiChat(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Ask me anything about jobs, career advice, or resume tips!</p>
                  <p className="text-sm mt-2">
                    {resumeData ? 'I have your resume data for personalized advice.' : 'Upload your resume for better recommendations.'}
                  </p>
                </div>
              )}
              
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                    <LoadingSpinner size="sm" />
                  </div>
                </div>
              )}
            </div>
            
            <form onSubmit={handleChatSubmit} className="border-t p-4">
              <div className="flex items-center space-x-2">
                <label className="cursor-pointer p-2 text-gray-400 hover:text-gray-600">
                  <Paperclip className="h-5 w-5" />
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about jobs, career advice, or resume tips..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* AI Recommendations Section */}
        {aiRecommendations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <Award className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">AI Recommended Jobs</h2>
              <span className="ml-3 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                {aiRecommendations.length} matches
              </span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {aiRecommendations.map((job) => (
                <JobCard key={job.id} job={job} isRecommended={true} />
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search jobs, companies, or skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Search'}
            </button>
          </form>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="Enter location"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                  <select
                    value={filters.jobType}
                    onChange={(e) => handleFilterChange('jobType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode</label>
                  <select
                    value={filters.workMode}
                    onChange={(e) => handleFilterChange('workMode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Modes</option>
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                  <select
                    value={filters.paymentType}
                    onChange={(e) => handleFilterChange('paymentType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                  <select
                    value={filters.experienceLevel}
                    onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Levels</option>
                    <option value="entry">Entry Level</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="newest">Newest First</option>
                    <option value="salary">Highest Salary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Salary</label>
                  <input
                    type="number"
                    placeholder="e.g., 50000"
                    value={filters.salaryMin}
                    onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Salary</label>
                  <input
                    type="number"
                    placeholder="e.g., 100000"
                    value={filters.salaryMax}
                    onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={applyFilters}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Job Results */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            {search ? `Search Results for "${search}"` : 'All Jobs'}
            <span className="text-gray-500 font-normal ml-2">
              ({pagination.total} jobs found)
            </span>
          </h2>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : jobs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {/* Load More Button */}
            {pagination.hasNext && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center mx-auto"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Loading More...
                    </>
                  ) : (
                    'Load More Jobs'
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <button
              onClick={() => fetchJobs(1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Jobs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;