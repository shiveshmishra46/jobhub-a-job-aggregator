// Notification service for handling various types of notifications
import axios from 'axios';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.subscribers = new Map();
  }

  // Subscribe to notifications
  subscribe(userId, callback) {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, []);
    }
    this.subscribers.get(userId).push(callback);
  }

  // Unsubscribe from notifications
  unsubscribe(userId, callback) {
    if (this.subscribers.has(userId)) {
      const callbacks = this.subscribers.get(userId);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Create a new notification
  async createNotification(notification) {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    this.notifications.unshift(newNotification);

    // Notify subscribers
    if (this.subscribers.has(notification.userId)) {
      const callbacks = this.subscribers.get(notification.userId);
      callbacks.forEach(callback => callback(newNotification));
    }

    // Send to server if needed
    try {
      await axios.post('/api/notifications', newNotification);
    } catch (error) {
      console.error('Failed to save notification to server:', error);
    }

    return newNotification;
  }

  // Job-related notifications
  async notifyNewJobMatch(userId, job) {
    return this.createNotification({
      userId,
      type: 'job_match',
      title: 'New Job Match!',
      message: `We found a job that matches your skills: ${job.title} at ${job.company.name}`,
      data: { jobId: job._id, job },
      priority: 'high',
      actionUrl: `/jobs/${job._id}`
    });
  }

  async notifyApplicationUpdate(userId, application, status) {
    const statusMessages = {
      reviewed: 'Your application has been reviewed',
      shortlisted: 'Congratulations! You have been shortlisted',
      'interview-scheduled': 'Interview has been scheduled',
      rejected: 'Application status updated',
      hired: 'Congratulations! You have been hired'
    };

    const priority = ['shortlisted', 'interview-scheduled', 'hired'].includes(status) ? 'high' : 'medium';

    return this.createNotification({
      userId,
      type: 'application_update',
      title: 'Application Update',
      message: `${statusMessages[status]} for ${application.job.title} at ${application.job.company.name}`,
      data: { applicationId: application._id, status, job: application.job },
      priority,
      actionUrl: '/applications'
    });
  }

  async notifyNewApplication(recruiterId, application) {
    return this.createNotification({
      userId: recruiterId,
      type: 'new_application',
      title: 'New Application Received',
      message: `${application.candidate.name} applied for ${application.job.title}`,
      data: { applicationId: application._id, candidate: application.candidate, job: application.job },
      priority: 'medium',
      actionUrl: '/recruiter'
    });
  }

  async notifyNewMessage(userId, message) {
    return this.createNotification({
      userId,
      type: 'new_message',
      title: 'New Message',
      message: `New message from ${message.sender.name}`,
      data: { messageId: message._id, sender: message.sender },
      priority: 'medium',
      actionUrl: '/messages'
    });
  }

  // System notifications
  async notifySystemMaintenance(userId) {
    return this.createNotification({
      userId,
      type: 'system',
      title: 'Scheduled Maintenance',
      message: 'The platform will undergo maintenance tonight from 2 AM to 4 AM EST',
      priority: 'low',
      data: { maintenanceWindow: '2 AM - 4 AM EST' }
    });
  }

  async notifyProfileIncomplete(userId, missingFields) {
    return this.createNotification({
      userId,
      type: 'profile_reminder',
      title: 'Complete Your Profile',
      message: `Complete your profile to get better job recommendations. Missing: ${missingFields.join(', ')}`,
      data: { missingFields },
      priority: 'low',
      actionUrl: '/profile'
    });
  }

  // Recommendation notifications
  async notifyWeeklyRecommendations(userId, jobCount) {
    return this.createNotification({
      userId,
      type: 'weekly_recommendations',
      title: 'Weekly Job Recommendations',
      message: `We found ${jobCount} new jobs that match your profile this week`,
      data: { jobCount },
      priority: 'medium',
      actionUrl: '/jobs?recommended=true'
    });
  }

  // Get notifications for a user
  getUserNotifications(userId, limit = 50) {
    return this.notifications
      .filter(notification => notification.userId === userId)
      .slice(0, limit);
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const notification = this.notifications.find(
      n => n.id === notificationId && n.userId === userId
    );
    
    if (notification) {
      notification.read = true;
      
      // Update on server
      try {
        await axios.put(`/api/notifications/${notificationId}/read`);
      } catch (error) {
        console.error('Failed to mark notification as read on server:', error);
      }
    }
    
    return notification;
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    const userNotifications = this.notifications.filter(n => n.userId === userId);
    userNotifications.forEach(notification => {
      notification.read = true;
    });

    try {
      await axios.put(`/api/notifications/mark-all-read`);
    } catch (error) {
      console.error('Failed to mark all notifications as read on server:', error);
    }

    return userNotifications.length;
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    const index = this.notifications.findIndex(
      n => n.id === notificationId && n.userId === userId
    );
    
    if (index > -1) {
      const deleted = this.notifications.splice(index, 1)[0];
      
      try {
        await axios.delete(`/api/notifications/${notificationId}`);
      } catch (error) {
        console.error('Failed to delete notification on server:', error);
      }
      
      return deleted;
    }
    
    return null;
  }

  // Get unread count
  getUnreadCount(userId) {
    return this.notifications.filter(
      n => n.userId === userId && !n.read
    ).length;
  }

  // Clear old notifications (older than 30 days)
  clearOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.notifications = this.notifications.filter(
      notification => new Date(notification.timestamp) > thirtyDaysAgo
    );
  }

  // Email notifications (would integrate with email service)
  async sendEmailNotification(userId, notification) {
    try {
      // This would integrate with an email service like SendGrid, Mailgun, etc.
      await axios.post('/api/notifications/email', {
        userId,
        notification
      });
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  // Push notifications (would integrate with push service)
  async sendPushNotification(userId, notification) {
    try {
      // This would integrate with a push notification service
      await axios.post('/api/notifications/push', {
        userId,
        notification
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  // Batch notifications
  async sendBatchNotifications(notifications) {
    const promises = notifications.map(notification => 
      this.createNotification(notification)
    );
    
    return Promise.allSettled(promises);
  }

  // Schedule notification
  scheduleNotification(notification, delay) {
    setTimeout(() => {
      this.createNotification(notification);
    }, delay);
  }

  // Notification preferences
  updateNotificationPreferences(userId, preferences) {
    // Store user preferences for notification types
    localStorage.setItem(`notification_preferences_${userId}`, JSON.stringify(preferences));
  }

  getNotificationPreferences(userId) {
    const stored = localStorage.getItem(`notification_preferences_${userId}`);
    return stored ? JSON.parse(stored) : {
      email: true,
      push: true,
      jobMatches: true,
      applicationUpdates: true,
      messages: true,
      systemUpdates: false,
      weeklyDigest: true
    };
  }
}

// Export singleton instance
export default new NotificationService();