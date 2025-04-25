import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  taskId?: string;
  projectId?: string;
  entityId?: string;
  entityType?: 'task' | 'project' | 'client';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string, userEmail: string, rememberMe?: boolean) => void;
  logout: () => void;
  isAuthenticated: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
  userEmail: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load auth state on initial mount only
  useEffect(() => {
    const loadAuthState = () => {
      try {
        // Check for persistent storage (localStorage) first
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        const storedEmail = localStorage.getItem('userEmail');
        const persistMode = localStorage.getItem('persistMode');

        if (storedUser && storedToken && persistMode === 'true') {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          if (storedEmail) setUserEmail(storedEmail);
        } else {
          // If not found in localStorage or not in persist mode, check sessionStorage
          const sessionUser = sessionStorage.getItem('user');
          const sessionToken = sessionStorage.getItem('token');
          const sessionEmail = sessionStorage.getItem('userEmail');

          if (sessionUser && sessionToken) {
            setUser(JSON.parse(sessionUser));
            setToken(sessionToken);
            if (sessionEmail) setUserEmail(sessionEmail);
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadAuthState();
  }, []);

  // Add notification to user
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!user) return;

    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false
    };

    const updatedUser = {
      ...user,
      notifications: [
        ...(user.notifications || []),
        newNotification
      ]
    };

    setUser(updatedUser);

    // Update storage
    if (localStorage.getItem('persistMode') === 'true') {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } else {
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // Mark notification as read
  const markNotificationAsRead = (notificationId: string) => {
    if (!user || !user.notifications) return;

    const updatedNotifications = user.notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true } 
        : notification
    );

    const updatedUser = {
      ...user,
      notifications: updatedNotifications
    };

    setUser(updatedUser);

    // Update storage
    if (localStorage.getItem('persistMode') === 'true') {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } else {
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // Clear all notifications
  const clearNotifications = () => {
    if (!user) return;

    const updatedUser = {
      ...user,
      notifications: []
    };

    setUser(updatedUser);

    // Update storage
    if (localStorage.getItem('persistMode') === 'true') {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } else {
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const login = (userData: User, newToken: string, userEmail: string, rememberMe = false) => {
    // Ensure userData has notifications array
    const userWithNotifications = {
      ...userData,
      notifications: userData.notifications || []
    };
    
    // Check if there are any stored notifications for this user
    try {
      const allUsersNotifications = JSON.parse(localStorage.getItem('all_users_notifications') || '{}');
      if (allUsersNotifications[userData.id] && allUsersNotifications[userData.id].length > 0) {
        // Add these notifications to the user's notifications
        userWithNotifications.notifications = [
          ...userWithNotifications.notifications,
          ...allUsersNotifications[userData.id]
        ];
        
        // Clear these notifications from the all_users_notifications storage
        delete allUsersNotifications[userData.id];
        localStorage.setItem('all_users_notifications', JSON.stringify(allUsersNotifications));
      }
    } catch (error) {
      console.error('Error loading notifications for user:', error);
    }
    
    setUser(userWithNotifications);
    setToken(newToken);
    setUserEmail(userEmail);

    try {
      // If rememberMe is true, store in localStorage (persistent)
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(userWithNotifications));
        localStorage.setItem('token', newToken);
        localStorage.setItem('userEmail', userEmail);
        localStorage.setItem('persistMode', 'true');
        // Clear any session storage to avoid duplication
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userEmail');
      } else {
        // Otherwise, store in sessionStorage (cleared when browser is closed)
        sessionStorage.setItem('user', JSON.stringify(userWithNotifications));
        sessionStorage.setItem('token', newToken);
        sessionStorage.setItem('userEmail', userEmail);
        // Clear any local storage to avoid duplication
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('persistMode');
      }
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUserEmail(null);
    
    try {
      // Clear both storage types to ensure complete logout
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('persistMode');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userEmail');
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        logout, 
        isAuthenticated: !!user && !!token,
        addNotification,
        markNotificationAsRead,
        clearNotifications,
        userEmail
      }}
    >
      {isInitialized ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};