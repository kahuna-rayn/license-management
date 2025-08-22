import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getUserRole, hasRole, isAdmin, isModerator, type UserRole, type AppRole } from '@/lib/roles';

export function useUserRole() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = useCallback(async () => {
    if (!user?.id) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const role = await getUserRole(user.id);
      setUserRole(role);
    } catch (err) {
      console.error('Error fetching user role:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user role');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch role when user changes
  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  // Check if user has specific role
  const checkRole = useCallback(async (requiredRole: AppRole): Promise<boolean> => {
    if (!user?.id) return false;
    return hasRole(user.id, requiredRole);
  }, [user?.id]);

  // Check if user is admin
  const checkIsAdmin = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    return isAdmin(user.id);
  }, [user?.id]);

  // Check if user is moderator
  const checkIsModerator = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    return isModerator(user.id);
  }, [user?.id]);

  return {
    userRole,
    loading,
    error,
    refetch: fetchUserRole,
    checkRole,
    checkIsAdmin,
    checkIsModerator,
    isAdmin: userRole?.role === 'admin',
    isModerator: userRole?.role === 'moderator',
    isUser: userRole?.role === 'user',
  };
}
