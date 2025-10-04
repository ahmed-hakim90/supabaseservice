import { useState, useEffect } from 'react';

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkActivity: number;
  activeUsers: number;
  responseTime: number;
  uptime: number;
  lastUpdated: Date;
}

interface NotificationData {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  user?: string;
}

interface AlertData {
  id: number;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
}

export function useSystemData(refreshInterval: number = 30000) {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkActivity: 0,
    activeUsers: 0,
    responseTime: 0,
    uptime: 0,
    lastUpdated: new Date()
  });
  
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // دالة لتوليد بيانات تفاعلية للنظام
  const generateSystemMetrics = (): SystemMetrics => {
    const now = new Date();
    const baseTime = now.getTime();
    
    // توليد بيانات تفاعلية بناءً على الوقت
    const timeVariation = Math.sin(baseTime / 60000) * 0.3 + 0.7; // تغيير كل دقيقة
    
    return {
      cpuUsage: Math.max(10, Math.min(90, 45 + Math.sin(baseTime / 30000) * 25 + Math.random() * 10)),
      memoryUsage: Math.max(20, Math.min(85, 55 + Math.sin(baseTime / 45000) * 20 + Math.random() * 8)),
      diskUsage: Math.max(30, Math.min(95, 65 + Math.sin(baseTime / 120000) * 15 + Math.random() * 5)),
      networkActivity: Math.max(5, Math.min(100, 35 * timeVariation + Math.random() * 20)),
      activeUsers: Math.floor(12 + Math.sin(baseTime / 180000) * 8 + Math.random() * 6),
      responseTime: Math.max(50, 150 + Math.sin(baseTime / 20000) * 100 + Math.random() * 50),
      uptime: Math.floor((Date.now() - new Date('2024-01-01').getTime()) / 1000),
      lastUpdated: now
    };
  };

  // تحديث البيانات
  const fetchSystemData = async () => {
    try {
      setIsLoading(true);
      
      // توليد metrics جديدة
      setSystemMetrics(generateSystemMetrics());
      
      // جلب الإشعارات
      const notificationsResponse = await fetch('/api/notifications');
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData);
      }
      
      // جلب التنبيهات
      const alertsResponse = await fetch('/api/alerts');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData);
      }
      
    } catch (error) {
      console.error('Error fetching system data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // تحديث دوري للبيانات
  useEffect(() => {
    fetchSystemData();
    
    const interval = setInterval(fetchSystemData, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // دوال للتفاعل مع الإشعارات
  const markNotificationAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        return true;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    return false;
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        return true;
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
    return false;
  };

  const dismissNotification = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        return true;
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
    return false;
  };

  const resolveAlert = async (id: number) => {
    try {
      const response = await fetch(`/api/alerts/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setAlerts(prev => 
          prev.map(a => a.id === id ? { ...a, resolved: true } : a)
        );
        return true;
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
    return false;
  };

  // إحصائيات مفيدة
  const stats = {
    totalNotifications: notifications.length,
    unreadNotifications: notifications.filter(n => !n.read).length,
    criticalAlerts: alerts.filter(a => a.severity === 'critical' && !a.resolved).length,
    systemHealth: systemMetrics.cpuUsage < 70 && systemMetrics.memoryUsage < 80 ? 'healthy' : 'warning'
  };

  return {
    systemMetrics,
    notifications,
    alerts,
    isLoading,
    stats,
    actions: {
      markNotificationAsRead,
      markAllNotificationsAsRead,
      dismissNotification,
      resolveAlert,
      refreshData: fetchSystemData
    }
  };
}