import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/components/theme-provider';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    systemAlerts: boolean;
    securityAlerts: boolean;
  };
  performance: {
    autoRefresh: boolean;
    refreshInterval: number;
    animationsEnabled: boolean;
  };
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    systemAlerts: true,
    securityAlerts: true,
  },
  performance: {
    autoRefresh: true,
    refreshInterval: 30,
    animationsEnabled: true,
  },
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { setTheme } = useTheme();

  // Load preferences from API
  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/system/preferences');
      
      if (response.ok) {
        const data = await response.json();
        const mergedPreferences = { 
          ...defaultPreferences, 
          ...data,
          notifications: { ...defaultPreferences.notifications, ...data.notifications },
          performance: { ...defaultPreferences.performance, ...data.performance }
        };
        
        setPreferences(mergedPreferences);
        
        // Apply theme immediately
        if (mergedPreferences.theme) {
          setTheme(mergedPreferences.theme);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setTheme]);

  // Save preferences to API
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
        
        // Apply theme if changed
        if (newPreferences.theme) {
          setTheme(newPreferences.theme);
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

  // Update specific preference sections
  const updateTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    return savePreferences({ theme });
  }, [savePreferences]);

  const updateNotifications = useCallback((notifications: Partial<UserPreferences['notifications']>) => {
    return savePreferences({ 
      notifications: { ...preferences.notifications, ...notifications } 
    });
  }, [preferences.notifications, savePreferences]);

  const updatePerformance = useCallback((performance: Partial<UserPreferences['performance']>) => {
    return savePreferences({ 
      performance: { ...preferences.performance, ...performance } 
    });
  }, [preferences.performance, savePreferences]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    return savePreferences(defaultPreferences);
  }, [savePreferences]);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    isLoading,
    isSaving,
    actions: {
      updateTheme,
      updateNotifications,
      updatePerformance,
      savePreferences,
      resetToDefaults,
      reload: loadPreferences,
    },
  };
}