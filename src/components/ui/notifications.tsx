import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Notification } from '@/lib/types';

export const NotificationCenter: React.FC = () => {
  const { user, markNotificationAsRead, clearNotifications } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = user?.notifications?.filter(n => !n.read).length || 0;
  
  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };
  
  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };
  
  const handleClearAll = () => {
    clearNotifications();
    setIsOpen(false);
  };
  
  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification.id);
    
    // Navigate to the relevant entity if needed
    if (notification.entityType && notification.entityId) {
      // Handle navigation based on entity type
      // This would be implemented with router navigation
    }
  };
  
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'только что';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} мин. назад`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч. назад`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} д. назад`;
    
    return date.toLocaleDateString('ru-RU');
  };
  
  return (
    <div className="relative" ref={notificationRef}>
      <button 
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
        onClick={toggleNotifications}
        aria-label="Уведомления"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="fixed top-16 right-4 md:absolute md:top-full md:right-0 md:mt-2 z-50 w-80 overflow-hidden bg-white rounded-md shadow-lg border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Уведомления</h3>
            {user?.notifications && user.notifications.length > 0 && (
              <button 
                className="text-xs text-gray-500 hover:text-gray-700"
                onClick={handleClearAll}
              >
                Очистить все
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {!user?.notifications || user.notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Нет уведомлений
              </div>
            ) : (
              <ul>
                {user.notifications.map((notification) => (
                  <li 
                    key={notification.id}
                    className={cn(
                      "p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer",
                      !notification.read && "bg-blue-50"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between">
                      <p className="font-medium">{notification.title}</p>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    {!notification.read && (
                      <button 
                        className="text-xs text-blue-500 mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        Отметить как прочитанное
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
