import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type AppRole = Database['public']['Enums']['app_role'];

export interface UserRole {
  role: AppRole;
  source: 'user_roles' | 'product_license_assignments' | 'default';
}

/**
 * Determines the user's role based on the following hierarchy:
 * 1. If user has 'admin' role in user_roles table → RAYN admin
 * 2. If user has access_level in product_license_assignments → use that access_level
 * 3. Default to 'user' if neither exists
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    // First, check if user has admin role in user_roles table
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (userRolesError && userRolesError.code !== 'PGRST116') {
      console.error('Error checking user_roles:', userRolesError);
    }

    // If user has admin role, return RAYN admin
    if (userRoles && userRoles.role === 'admin') {
      return {
        role: 'admin',
        source: 'user_roles'
      };
    }

    // Next, check product_license_assignments for access_level
    const { data: licenseAssignments, error: licenseError } = await supabase
      .from('product_license_assignments')
      .select('access_level')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (licenseError && licenseError.code !== 'PGRST116') {
      console.error('Error checking product_license_assignments:', licenseError);
    }

    // If user has access_level in product_license_assignments, use that
    if (licenseAssignments && licenseAssignments.access_level) {
      return {
        role: licenseAssignments.access_level,
        source: 'product_license_assignments'
      };
    }

    // Default to 'user' if neither record exists
    return {
      role: 'user',
      source: 'default'
    };

  } catch (error) {
    console.error('Error determining user role:', error);
    // Return default role on error
    return {
      role: 'user',
      source: 'default'
    };
  }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(userId: string, requiredRole: AppRole): Promise<boolean> {
  const userRole = await getUserRole(userId);
  return userRole.role === requiredRole;
}

/**
 * Check if user is an admin (either RAYN admin or from product license)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, 'admin');
}

/**
 * Check if user is a moderator
 */
export async function isModerator(userId: string): Promise<boolean> {
  return hasRole(userId, 'moderator');
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: AppRole): string {
  switch (role) {
    case 'admin':
      return 'RAYN Admin';
    case 'moderator':
      return 'Moderator';
    case 'user':
      return 'User';
    default:
      return 'User';
  }
}

/**
 * Get role description
 */
export function getRoleDescription(role: AppRole): string {
  switch (role) {
    case 'admin':
      return 'Full system access with administrative privileges';
    case 'moderator':
      return 'Enhanced access with moderation capabilities';
    case 'user':
      return 'Standard user access';
    default:
      return 'Standard user access';
  }
}
