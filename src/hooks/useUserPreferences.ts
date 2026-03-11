import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface UserPreferences {
  theme?: string;
  layout?: 'comfortable' | 'compact' | 'spacious';
  defaultView?: 'list' | 'grid' | 'kanban';
  sidebarCollapsed?: boolean;
  notifications?: {
    email?: boolean;
    push?: boolean;
    desktop?: boolean;
  };
  language?: string;
  dashboardLayout?: string[];
  favoritePages?: string[];
  tableColumns?: Record<string, string[]>;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  layout: 'comfortable',
  defaultView: 'list',
  sidebarCollapsed: false,
  notifications: {
    email: true,
    push: true,
    desktop: true,
  },
  language: 'pt-BR',
  dashboardLayout: [],
  favoritePages: [],
  tableColumns: {},
};

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setPreferences(DEFAULT_PREFERENCES);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('preferences')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data?.preferences) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...data.preferences });
      } else {
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const updatedPreferences = { ...preferences, ...newPreferences };

      const { error: saveError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        });

      if (saveError) throw saveError;

      setPreferences(updatedPreferences);
      setError(null);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
      throw err;
    }
  };

  const updatePreference = useCallback(
    async <K extends keyof UserPreferences>(
      key: K,
      value: UserPreferences[K]
    ) => {
      await savePreferences({ [key]: value });
    },
    [preferences]
  );

  const resetPreferences = async () => {
    await savePreferences(DEFAULT_PREFERENCES);
  };

  const toggleSidebar = async () => {
    await updatePreference('sidebarCollapsed', !preferences.sidebarCollapsed);
  };

  const setDefaultView = async (view: 'list' | 'grid' | 'kanban') => {
    await updatePreference('defaultView', view);
  };

  const setLayout = async (layout: 'comfortable' | 'compact' | 'spacious') => {
    await updatePreference('layout', layout);
  };

  const addFavoritePage = async (page: string) => {
    const favoritePages = preferences.favoritePages || [];
    if (!favoritePages.includes(page)) {
      await updatePreference('favoritePages', [...favoritePages, page]);
    }
  };

  const removeFavoritePage = async (page: string) => {
    const favoritePages = preferences.favoritePages || [];
    await updatePreference(
      'favoritePages',
      favoritePages.filter((p) => p !== page)
    );
  };

  const setTableColumns = async (tableId: string, columns: string[]) => {
    const tableColumns = preferences.tableColumns || {};
    await updatePreference('tableColumns', {
      ...tableColumns,
      [tableId]: columns,
    });
  };

  return {
    preferences,
    loading,
    error,
    savePreferences,
    updatePreference,
    resetPreferences,
    toggleSidebar,
    setDefaultView,
    setLayout,
    addFavoritePage,
    removeFavoritePage,
    setTableColumns,
  };
};
