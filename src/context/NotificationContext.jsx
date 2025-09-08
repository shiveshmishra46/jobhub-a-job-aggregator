import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif => 
          notif._id === action.payload ? { ...notif, read: true } : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    case 'SET_UNREAD_COUNT':
      return {
        ...state,
        unreadCount: action.payload
      };
    default:
      return state;
  }
};

const initialState = {
  notifications: [],
  unreadCount: 0
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { socket, isConnected } = useSocket();
  const { isAuthenticated, user } = useAuth();

  // Socket event listeners
  useEffect(() => {
    if (socket && isConnected && isAuthenticated) {
      // New message notification
      socket.on('newMessage', (message) => {
        if (message.sender._id !== user._id) {
          const notification = {
            _id: `msg_${message._id}`,
            type: 'message',
            message: `New message from ${message.sender.name}`,
            read: false,
            createdAt: new Date(),
            data: message
          };
          
          dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
          toast.success(`New message from ${message.sender.name}`);
        }
      });

      // New application notification
      socket.on('newApplication', (data) => {
        if (user.role === 'recruiter') {
          const notification = {
            _id: `app_${data.application._id}`,
            type: 'application',
            message: data.message,
            read: false,
            createdAt: new Date(),
            data: data.application
          };
          
          dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
          toast.success(data.message);
        }
      });

      // Application status update
      socket.on('applicationUpdate', (data) => {
        if (user.role === 'student') {
          const notification = {
            _id: `status_${data.applicationId}`,
            type: 'application_update',
            message: data.message,
            read: false,
            createdAt: new Date(),
            data: data
          };
          
          dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
          toast.success(data.message);
        }
      });

      return () => {
        socket.off('newMessage');
        socket.off('newApplication');
        socket.off('applicationUpdate');
      };
    }
  }, [socket, isConnected, isAuthenticated, user]);

  const markAsRead = (notificationId) => {
    dispatch({ type: 'MARK_AS_READ', payload: notificationId });
  };

  const addNotification = (notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const value = {
    ...state,
    markAsRead,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};