import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type AppRole = Database['public']['Enums']['app_role'];

export interface UserRole {
  role: AppRole;
  source: 'user_roles' | 'product_license_assignments' | 'default';
  isRaynAdmin: boolean;
  isClientAdmin: boolean;
  customer_id?: string; // Customer ID for client admins
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
        source: 'user_roles',
        isRaynAdmin: true,
        isClientAdmin: false
      };
    }

    // Next, check product_license_assignments for access_level and get customer_id
    const { data: licenseAssignments, error: licenseError } = await supabase
      .from('product_license_assignments')
      .select(`
        access_level,
        license_id
      `)
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (licenseError && licenseError.code !== 'PGRST116') {
      console.error('Error checking product_license_assignments:', licenseError);
    }

    // If user has access_level in product_license_assignments, get customer_id
    if (licenseAssignments && licenseAssignments.access_level) {
      let customer_id = undefined;
      
      // Fetch customer_id from the related license
      if (licenseAssignments.license_id) {
        const { data: license } = await supabase
          .from('customer_product_licenses')
          .select('customer_id')
          .eq('id', licenseAssignments.license_id)
          .single();
        
        customer_id = license?.customer_id;
      }

      return {
        role: licenseAssignments.access_level,
        source: 'product_license_assignments',
        isRaynAdmin: false,
        isClientAdmin: licenseAssignments.access_level === 'admin',
        customer_id
      };
    }

    // Default to 'user' if neither record exists
    return {
      role: 'user',
      source: 'default',
      isRaynAdmin: false,
      isClientAdmin: false
    };

  } catch (error) {
    console.error('Error determining user role:', error);
    // Return default role on error
    return {
      role: 'user',
      source: 'default',
      isRaynAdmin: false,
      isClientAdmin: false
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
 * Check if user is a RAYN admin (from user_roles table)
 */
export async function isRaynAdmin(userId: string): Promise<boolean> {
  const userRole = await getUserRole(userId);
  return userRole.isRaynAdmin;
}

/**
 * Check if user is a Client admin (from product_license_assignments table)
 */
export async function isClientAdmin(userId: string): Promise<boolean> {
  const userRole = await getUserRole(userId);
  return userRole.isClientAdmin;
}

/**
 * Check if user is any type of admin (RAYN or Client)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const userRole = await getUserRole(userId);
  return userRole.isRaynAdmin || userRole.isClientAdmin;
}

/**
 * Check if user is a moderator
 */
export async function isModerator(userId: string): Promise<boolean> {
  return hasRole(userId, 'moderator');
}

/**
 * Get role display name with proper differentiation
 */
export function getRoleDisplayName(role: AppRole, userRole?: UserRole): string {
  // If we have userRole context, use it to differentiate admin types
  if (userRole) {
    if (userRole.isRaynAdmin) {
      return 'RAYN Admin';
    }
    if (userRole.isClientAdmin) {
      return 'Client Admin';
    }
  }

  // Fallback to basic role names
  switch (role) {
    case 'admin':
      return 'Admin'; // Generic admin if no context
    case 'moderator':
      return 'Moderator';
    case 'user':
      return 'User';
    default:
      return 'User';
  }
}

/**
 * Get role description with proper differentiation
 */
export function getRoleDescription(role: AppRole, userRole?: UserRole): string {
  if (userRole) {
    if (userRole.isRaynAdmin) {
      return 'Full system access with RAYN administrative privileges';
    }
    if (userRole.isClientAdmin) {
      return 'Client-level administrative access for license management';
    }
  }

  switch (role) {
    case 'admin':
      return 'Administrative access';
    case 'moderator':
      return 'Enhanced access with moderation capabilities';
    case 'user':
      return 'Standard user access';
    default:
      return 'Standard user access';
  }
}
