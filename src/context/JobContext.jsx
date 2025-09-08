import React, { createContext, useContext, useReducer } from 'react';
import axios from 'axios';

const JobContext = createContext();

const jobReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_JOBS':
      return {
        ...state,
        jobs: action.payload.jobs,
        recommendedJobs: action.payload.recommendedJobs || [],
        pagination: action.payload.pagination,
        loading: false
      };
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };
    case 'SET_SEARCH':
      return {
        ...state,
        search: action.payload
      };
    case 'ADD_JOB':
      return {
        ...state,
        jobs: [action.payload, ...state.jobs]
      };
    case 'UPDATE_JOB':
      return {
        ...state,
        jobs: state.jobs.map(job => 
          job._id === action.payload._id ? action.payload : job
        )
      };
    case 'DELETE_JOB':
      return {
        ...state,
        jobs: state.jobs.filter(job => job._id !== action.payload)
      };
    case 'SET_SAVED_JOBS':
      return {
        ...state,
        savedJobs: action.payload
      };
    case 'TOGGLE_SAVED_JOB':
      const jobId = action.payload;
      const isSaved = state.savedJobs.some(job => job._id === jobId);
      
      return {
        ...state,
        savedJobs: isSaved 
          ? state.savedJobs.filter(job => job._id !== jobId)
          : [...state.savedJobs, state.jobs.find(job => job._id === jobId)],
        jobs: state.jobs.map(job => 
          job._id === jobId ? { ...job, isSaved: !isSaved } : job
        )
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

const initialState = {
  jobs: [],
  recommendedJobs: [],
  savedJobs: [],
  filters: {
    location: '',
    jobType: '',
    workMode: '',
    experienceLevel: '',
    skills: [],
    salaryMin: '',
    salaryMax: ''
  },
  search: '',
  pagination: {
    current: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  },
  loading: false,
  error: null
};

export const JobProvider = ({ children }) => {
  const [state, dispatch] = useReducer(jobReducer, initialState);

  const fetchJobs = async (page = 1, filters = {}, search = '') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...filters
      });
      
      if (search) {
        params.append('search', search);
      }

      const response = await axios.get(`/api/jobs?${params}`);
      
      dispatch({
        type: 'SET_JOBS',
        payload: response.data
      });
    } catch (error) {
      console.error('Fetch jobs error:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.message || 'Failed to fetch jobs'
      });
    }
  };

  const fetchJobById = async (jobId) => {
    try {
      const response = await axios.get(`/api/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Fetch job details error:', error);
      throw error;
    }
  };

  const createJob = async (jobData) => {
    try {
      const response = await axios.post('/api/jobs', jobData);
      dispatch({ type: 'ADD_JOB', payload: response.data.job });
      return { success: true, job: response.data.job };
    } catch (error) {
      console.error('Create job error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to create job' 
      };
    }
  };

  const updateJob = async (jobId, jobData) => {
    try {
      const response = await axios.put(`/api/jobs/${jobId}`, jobData);
      dispatch({ type: 'UPDATE_JOB', payload: response.data.job });
      return { success: true, job: response.data.job };
    } catch (error) {
      console.error('Update job error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update job' 
      };
    }
  };

  const deleteJob = async (jobId) => {
    try {
      await axios.delete(`/api/jobs/${jobId}`);
      dispatch({ type: 'DELETE_JOB', payload: jobId });
      return { success: true };
    } catch (error) {
      console.error('Delete job error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to delete job' 
      };
    }
  };

  const toggleSavedJob = async (jobId) => {
    try {
      const response = await axios.post(`/api/jobs/${jobId}/save`);
      dispatch({ type: 'TOGGLE_SAVED_JOB', payload: jobId });
      return { success: true, saved: response.data.saved };
    } catch (error) {
      console.error('Toggle saved job error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to save job' 
      };
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const response = await axios.get('/api/jobs/user/saved');
      dispatch({ type: 'SET_SAVED_JOBS', payload: response.data });
    } catch (error) {
      console.error('Fetch saved jobs error:', error);
    }
  };

  const setFilters = (filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const setSearch = (search) => {
    dispatch({ type: 'SET_SEARCH', payload: search });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    fetchJobs,
    fetchJobById,
    createJob,
    updateJob,
    deleteJob,
    toggleSavedJob,
    fetchSavedJobs,
    setFilters,
    setSearch,
    clearError
  };

  return (
    <JobContext.Provider value={value}>
      {children}
    </JobContext.Provider>
  );
};

export const useJob = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJob must be used within a JobProvider');
  }
  return context;
};