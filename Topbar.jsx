import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/axiosClient';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, selectedBranch } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const branchId = selectedBranch ? selectedBranch._id || selectedBranch : null;

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const params = branchId ? { branchId } : {};
      const res = await api.get('/notifications/unread-count', params);
      if (res.success) {
        setUnreadCount(res.data.count);
      }
    } catch (e) {
      // Ignore background notification fetch errors
    }
  }, [user, branchId]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const params = branchId ? { branchId } : {};
      const res = await api.get('/notifications', params);
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (e) {
      // Ignore
    }
  }, [user, branchId]);

  useEffect(() => {
    if (user && user.role !== 'cashier') {
      fetchUnreadCount();
      // Poll every 30s
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      await fetchUnreadCount();
      await fetchNotifications();
    } catch (e) {
      //
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all', { branchId });
      await fetchUnreadCount();
      await fetchNotifications();
    } catch (e) {
      //
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        fetchUnreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
