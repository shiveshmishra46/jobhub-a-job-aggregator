// Client-side validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateJobForm = (formData) => {
  const errors = {};
  
  if (!formData.title?.trim()) {
    errors.title = 'Job title is required';
  }
  
  if (!formData.description?.trim()) {
    errors.description = 'Job description is required';
  }
  
  if (!formData.company?.name?.trim()) {
    errors.companyName = 'Company name is required';
  }
  
  if (!formData.location?.trim()) {
    errors.location = 'Location is required';
  }
  
  if (!formData.skills || formData.skills.length === 0) {
    errors.skills = 'At least one skill is required';
  }
  
  if (formData.salary?.min && formData.salary?.max) {
    if (parseInt(formData.salary.min) > parseInt(formData.salary.max)) {
      errors.salary = 'Minimum salary cannot be greater than maximum salary';
    }
  }
  
  if (formData.company?.website && !validateURL(formData.company.website)) {
    errors.companyWebsite = 'Please enter a valid website URL';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateProfileForm = (formData, role) => {
  const errors = {};
  
  if (!formData.name?.trim()) {
    errors.name = 'Full name is required';
  }
  
  if (formData.profile?.phone && !validatePhone(formData.profile.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }
  
  if (formData.profile?.linkedinUrl && !validateURL(formData.profile.linkedinUrl)) {
    errors.linkedinUrl = 'Please enter a valid LinkedIn URL';
  }
  
  if (formData.profile?.githubUrl && !validateURL(formData.profile.githubUrl)) {
    errors.githubUrl = 'Please enter a valid GitHub URL';
  }
  
  if (formData.profile?.portfolioUrl && !validateURL(formData.profile.portfolioUrl)) {
    errors.portfolioUrl = 'Please enter a valid portfolio URL';
  }
  
  if (role === 'recruiter') {
    if (formData.company?.website && !validateURL(formData.company.website)) {
      errors.companyWebsite = 'Please enter a valid company website URL';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateApplicationForm = (formData) => {
  const errors = {};
  
  if (!formData.jobId) {
    errors.jobId = 'Job ID is required';
  }
  
  // Cover letter is optional but if provided, should have minimum length
  if (formData.coverLetter && formData.coverLetter.trim().length < 50) {
    errors.coverLetter = 'Cover letter should be at least 50 characters long';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateMessageForm = (formData) => {
  const errors = {};
  
  if (!formData.receiverId) {
    errors.receiverId = 'Receiver is required';
  }
  
  if (!formData.content?.trim()) {
    errors.content = 'Message content is required';
  }
  
  if (formData.content && formData.content.length > 1000) {
    errors.content = 'Message cannot exceed 1000 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

export const validateFileUpload = (file, allowedTypes, maxSize = 10 * 1024 * 1024) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file selected');
    return { isValid: false, errors };
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  if (file.size > maxSize) {
    errors.push(`File size too large. Maximum size: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSearchParams = (params) => {
  const errors = {};
  
  if (params.salaryMin && params.salaryMax) {
    if (parseInt(params.salaryMin) > parseInt(params.salaryMax)) {
      errors.salary = 'Minimum salary cannot be greater than maximum salary';
    }
  }
  
  if (params.salaryMin && parseInt(params.salaryMin) < 0) {
    errors.salaryMin = 'Salary cannot be negative';
  }
  
  if (params.salaryMax && parseInt(params.salaryMax) < 0) {
    errors.salaryMax = 'Salary cannot be negative';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Real-time validation for forms
export const createValidator = (validationRules) => {
  return (formData) => {
    const errors = {};
    
    Object.keys(validationRules).forEach(field => {
      const rules = validationRules[field];
      const value = formData[field];
      
      rules.forEach(rule => {
        if (rule.required && (!value || value.toString().trim() === '')) {
          errors[field] = rule.message || `${field} is required`;
        } else if (value && rule.pattern && !rule.pattern.test(value)) {
          errors[field] = rule.message || `${field} format is invalid`;
        } else if (value && rule.minLength && value.length < rule.minLength) {
          errors[field] = rule.message || `${field} must be at least ${rule.minLength} characters`;
        } else if (value && rule.maxLength && value.length > rule.maxLength) {
          errors[field] = rule.message || `${field} cannot exceed ${rule.maxLength} characters`;
        } else if (value && rule.min && parseFloat(value) < rule.min) {
          errors[field] = rule.message || `${field} must be at least ${rule.min}`;
        } else if (value && rule.max && parseFloat(value) > rule.max) {
          errors[field] = rule.message || `${field} cannot exceed ${rule.max}`;
        }
      });
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
};