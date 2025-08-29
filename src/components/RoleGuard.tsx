import { ReactNode } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { AccessLevel } from '@/lib/roles';

interface RoleGuardProps {
  children: ReactNode;
  requiredRole: AccessLevel;
  fallback?: ReactNode;
  showLoading?: boolean;
}

export function RoleGuard({ 
  children, 
  requiredRole, 
  fallback = null, 
  showLoading = true 
}: RoleGuardProps) {
  const { userRole, loading, isAdmin, isManager, isUser } = useUserRole();

  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-muted-foreground">Loading permissions...</span>
      </div>
    );
  }

  if (!userRole) {
    return <>{fallback}</>;
  }

  // Check if user has the required role
  const hasAccess = (() => {
    switch (requiredRole) {
      case 'admin':
        return isAdmin;
      case 'manager':
        return isAdmin || isManager;
      case 'user':
        return true; // All authenticated users have user access
      default:
        return false;
    }
  })();

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components for common role checks
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard requiredRole="admin" fallback={fallback}>{children}</RoleGuard>;
}

export function ManagerOrHigher({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard requiredRole="manager" fallback={fallback}>{children}</RoleGuard>;
}

export function AuthenticatedOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard requiredRole="user" fallback={fallback}>{children}</RoleGuard>;
}
