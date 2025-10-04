import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/components/theme-provider';

interface UserPreferences {
  theme: {
    mode: 'light' | 'dark' | 'system';
    primaryColor: string;
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    systemAlerts: boolean;
    securityAlerts: boolean;
    maintenanceAlerts: boolean;
    soundEnabled: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
    loginNotifications: boolean;
  };
  performance: {
    autoRefresh: boolean;
    refreshInterval: number;
    cacheEnabled: boolean;
    animationsEnabled: boolean;
  };
  dashboard: {
    defaultTab: string;
    visibleWidgets: string[];
    layout: 'grid' | 'list';
  };
}

interface SystemConfig {
  systemName: string;
  maintenanceMode: boolean;
  maxUsers: number;
  sessionTimeout: number;
  backupRetention: number;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  enableAudit: boolean;
}

const defaultPreferences: UserPreferences = {
  theme: {
    mode: 'system',
    primaryColor: '#3b82f6',
    fontSize: 'medium',
    compactMode: false,
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    systemAlerts: true,
    securityAlerts: true,
    maintenanceAlerts: true,
    soundEnabled: false,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginNotifications: true,
  },
  performance: {
    autoRefresh: true,
    refreshInterval: 30,
    cacheEnabled: true,
    animationsEnabled: true,
  },
  dashboard: {
    defaultTab: 'dashboard',
    visibleWidgets: ['cpu', 'memory', 'disk', 'network', 'users'],
    layout: 'grid',
  },
};

const defaultSystemConfig: SystemConfig = {
  systemName: 'نظام إدارة الخدمات',
  maintenanceMode: false,
  maxUsers: 1000,
  sessionTimeout: 30,
  backupRetention: 30,
  logLevel: 'INFO',
  enableAudit: true,
};

export function useSystemSettings() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(defaultSystemConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { setTheme } = useTheme();

  // تحميل الإعدادات
  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/system/preferences');
      
      if (response.ok) {
        const data = await response.json();
        const mergedPreferences = { ...defaultPreferences, ...data };
        setPreferences(mergedPreferences);
        
        // تطبيق إعدادات التيم
        if (mergedPreferences.theme.mode) {
          setTheme(mergedPreferences.theme.mode);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setTheme]);

  const loadSystemConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/system/config');
      
      if (response.ok) {
        const data = await response.json();
        setSystemConfig({ ...defaultSystemConfig, ...data });
      }
    } catch (error) {
      console.error('Error loading system config:', error);
    }
  }, []);

  // حفظ الإعدادات
  const savePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    try {
      setIsSaving(true);
      const updatedPreferences = { ...preferences, ...newPreferences };
      
      const response = await fetch('/api/system/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPreferences),
      });

      if (response.ok) {
        setPreferences(updatedPreferences);
        
        // تطبيق إعدادات التيم إذا تغيرت
        if (newPreferences.theme?.mode) {
          setTheme(newPreferences.theme.mode);
        }
        
        return { success: true };
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      return { success: false, error: 'فشل في حفظ الإعدادات' };
    } finally {
      setIsSaving(false);
    }
  }, [preferences, setTheme]);

  const saveSystemConfig = useCallback(async (newConfig: Partial<SystemConfig>) => {
    try {
      setIsSaving(true);
      const updatedConfig = { ...systemConfig, ...newConfig };
      
      const response = await fetch('/api/system/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedConfig),
      });

      if (response.ok) {
        setSystemConfig(updatedConfig);
        return { success: true };
      } else {
        throw new Error('Failed to save system config');
      }
    } catch (error) {
      console.error('Error saving system config:', error);
      return { success: false, error: 'فشل في حفظ إعدادات النظام' };
    } finally {
      setIsSaving(false);
    }
  }, [systemConfig]);

  // دوال مساعدة للتحديث السريع
  const updateTheme = useCallback((theme: Partial<UserPreferences['theme']>) => {
    return savePreferences({ theme: { ...preferences.theme, ...theme } });
  }, [preferences.theme, savePreferences]);

  const updateNotifications = useCallback((notifications: Partial<UserPreferences['notifications']>) => {
    return savePreferences({ notifications: { ...preferences.notifications, ...notifications } });
  }, [preferences.notifications, savePreferences]);

  const updateSecurity = useCallback((security: Partial<UserPreferences['security']>) => {
    return savePreferences({ security: { ...preferences.security, ...security } });
  }, [preferences.security, savePreferences]);

  const updatePerformance = useCallback((performance: Partial<UserPreferences['performance']>) => {
    return savePreferences({ performance: { ...preferences.performance, ...performance } });
  }, [preferences.performance, savePreferences]);

  const resetToDefaults = useCallback(async () => {
    return savePreferences(defaultPreferences);
  }, [savePreferences]);

  const exportSettings = useCallback(() => {
    const settings = {
      preferences,
      systemConfig,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [preferences, systemConfig]);

  const importSettings = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      const settings = JSON.parse(content);
      
      if (settings.preferences) {
        await savePreferences(settings.preferences);
      }
      
      if (settings.systemConfig) {
        await saveSystemConfig(settings.systemConfig);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error importing settings:', error);
      return { success: false, error: 'فشل في استيراد الإعدادات' };
    }
  }, [savePreferences, saveSystemConfig]);

  // تحميل البيانات عند بداية التشغيل
  useEffect(() => {
    loadPreferences();
    loadSystemConfig();
  }, [loadPreferences, loadSystemConfig]);

  // تطبيق إعدادات الأداء
  useEffect(() => {
    if (preferences.performance.animationsEnabled) {
      document.documentElement.style.setProperty('--animation-duration', '0.3s');
    } else {
      document.documentElement.style.setProperty('--animation-duration', '0s');
    }
  }, [preferences.performance.animationsEnabled]);

  return {
    preferences,
    systemConfig,
    isLoading,
    isSaving,
    actions: {
      savePreferences,
      saveSystemConfig,
      updateTheme,
      updateNotifications,
      updateSecurity,
      updatePerformance,
      resetToDefaults,
      exportSettings,
      importSettings,
      reload: () => {
        loadPreferences();
        loadSystemConfig();
      },
    },
  };
}