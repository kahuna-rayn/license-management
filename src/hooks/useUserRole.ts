import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getUserRole, hasRole, isAdmin, isManager, isRaynAdmin, isClientAdmin, type UserRole, type AccessLevel } from '@/lib/roles';
import { useDebug } from '@/contexts/DebugContext';

export function useUserRole() {
  const { user } = useAuth();
  const { debugRole, isDebugMode } = useDebug();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualUserRole, setActualUserRole] = useState<UserRole | null>(null);

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
      setActualUserRole(role);
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
  const checkRole = useCallback(async (requiredRole: AccessLevel): Promise<boolean> => {
    if (!user?.id) return false;
    return hasRole(user.id, requiredRole);
  }, [user?.id]);

  // Check if user is admin
  const checkIsAdmin = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    return isAdmin(user.id);
  }, [user?.id]);

  // Check if user is manager
  const checkIsManager = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    return isManager(user.id);
  }, [user?.id]);

  // Check if user is RAYN admin
  const checkIsRaynAdmin = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    const role = await getUserRole(user.id);
    return role.isRaynAdmin;
  }, [user?.id]);

  // Check if user is Client admin
  const checkIsClientAdmin = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    const role = await getUserRole(user.id);
    return role.isClientAdmin;
  }, [user?.id]);

  // Use debug role if in debug mode, otherwise use actual role
  const effectiveRole = isDebugMode ? debugRole : userRole;
  
  return {
    userRole: effectiveRole,
    actualUserRole,
    loading,
    error,
    refetch: fetchUserRole,
    checkRole,
    checkIsAdmin,
    checkIsManager,
    checkIsRaynAdmin,
    checkIsClientAdmin,
    isAdmin: effectiveRole?.isRaynAdmin || effectiveRole?.isClientAdmin,
    isRaynAdmin: effectiveRole?.isRaynAdmin,
    isClientAdmin: effectiveRole?.isClientAdmin,
    isManager: effectiveRole?.role === 'manager',
    isUser: effectiveRole?.role === 'user',
    isDebugMode,
  };
}
