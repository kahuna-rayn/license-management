# RAYN License Hub - Role-Based Access Control System

## Overview

This document describes the role-based access control (RBAC) system implemented in the RAYN License Hub application. The system determines user roles based on database records and provides role-based content access throughout the application.

## Role Hierarchy

The system implements a four-tier role hierarchy:

1. **RAYN Admin** (`admin`) - Full system access with RAYN administrative privileges
2. **Client Admin** (`admin`) - Client-level administrative access for license management
3. **Manager** (`manager`) - Enhanced access with management capabilities  
4. **User** (`user`) - Standard user access (default)

## Role Assignment Logic

User roles are determined using the following priority-based logic:

### 1. RAYN Admin Check
- **Source**: `user_roles` table
- **Condition**: `role = 'admin'` (uses `access_level_type` enum)
- **Result**: User becomes RAYN Admin with full system access
- **Priority**: Highest

### 2. Client Admin Check
- **Source**: `product_license_assignments` table
- **Condition**: `access_level = 'admin'` (uses `access_level_type` enum)
- **Result**: User becomes Client Admin with client-level administrative access
- **Priority**: Medium

### 3. Product License Assignment
- **Source**: `product_license_assignments` table
- **Condition**: User has an `access_level` record (not admin)
- **Result**: User gets the role specified in `access_level` column (uses `access_level_type` enum)
- **Priority**: Low

### 4. Default User Role
- **Source**: System default
- **Condition**: No records found in either table
- **Result**: User gets standard 'user' role
- **Priority**: Lowest

## Implementation Files

### Core Role Logic
- **`src/lib/roles.ts`** - Core role determination functions
- **`src/hooks/useUserRole.ts`** - React hook for role management
- **`src/components/RoleGuard.tsx`** - Role-based access control components

### UI Components
- **`src/components/UserRoleDisplay.tsx`** - Role information display
- **`src/pages/RoleTest.tsx`** - Role system testing page

## Usage Examples

### Basic Role Check
```typescript
import { useUserRole } from '@/hooks/useUserRole';

function MyComponent() {
  const { userRole, isAdmin, isManager } = useUserRole();
  
  if (isAdmin) {
    return <AdminPanel />;
  }
  
  return <UserDashboard />;
}
```

### Role-Based Content Protection
```typescript
import { AdminOnly, ManagerOrHigher } from '@/components/RoleGuard';

function Dashboard() {
  return (
    <div>
      <AdminOnly fallback={<AccessDenied />}>
        <AdminPanel />
      </AdminOnly>
      
      <ManagerOrHigher fallback={<AccessDenied />}>
        <ManagementTools />
      </ManagerOrHigher>
      
      <UserDashboard />
    </div>
  );
}
```

### Custom Role Guard
```typescript
import { RoleGuard } from '@/components/RoleGuard';

function CustomComponent() {
  return (
    <RoleGuard requiredRole="manager" fallback={<AccessDenied />}>
      <ManagerContent />
    </RoleGuard>
  );
}
```

## Testing the Role System

### 1. Access the Test Page
Navigate to `/role-test` to see a comprehensive role system test page.

### 2. Test Different Scenarios
- **RAYN Admin User**: Add a record to `user_roles` table with `role = 'admin'` (uses `access_level_type` enum)
- **Client Admin User**: Add a record to `product_license_assignments` table with `access_level = 'admin'` (uses `access_level_type` enum)
- **Manager User**: Add a record to `product_license_assignments` table with `access_level = 'manager'` (uses `access_level_type` enum)
- **Regular User**: No records in either table (defaults to 'user')

### 3. Verify Role Assignment
The test page shows:
- Current user information
- Role assignment details
- Role source information
- Access control tests for each role level

## Role Sources and Visual Indicators

The system provides visual indicators for role sources:

- **🟡 RAYN Admin Role** - Yellow badge for RAYN admin roles from `user_roles` table
- **🔵 Client Admin Role** - Blue badge for client admin roles from `product_license_assignments` table
- **🟢 Product License Assignment** - Green badge for other roles from `product_license_assignments` table  
- **⚪ Default User Role** - Gray badge for default user roles

## Security Considerations

1. **Server-Side Validation**: Always validate roles on the server side
2. **Database Permissions**: Ensure proper RLS (Row Level Security) policies
3. **Role Caching**: Roles are cached in the client but should be revalidated for sensitive operations
4. **Audit Logging**: Consider logging role changes and access attempts

## Error Handling

The role system includes comprehensive error handling:

- **Database Errors**: Graceful fallback to default user role
- **Network Issues**: Cached role information with refresh capability
- **Invalid Roles**: Validation and fallback mechanisms

## Performance Optimizations

1. **Role Caching**: User roles are cached in React state
2. **Efficient Queries**: Single queries with proper indexing
3. **Lazy Loading**: Role information loads only when needed
4. **Background Refresh**: Roles can be refreshed without blocking UI

## Future Enhancements

Potential improvements to consider:

1. **Role Inheritance**: Support for role hierarchies
2. **Temporary Roles**: Time-limited role assignments
3. **Role Groups**: Bulk role management
4. **Advanced Permissions**: Granular permission system
5. **Role Analytics**: Usage and access analytics

## Troubleshooting

### Common Issues

1. **Role Not Updating**: Check database records and refresh the page
2. **Access Denied**: Verify role assignment in database
3. **Loading Issues**: Check network connectivity and database access

### Debug Information

The role test page (`/role-test`) provides detailed debug information including:
- Current user details
- Role assignment status
- Database query results
- Error messages

## Support

For issues with the role system:
1. Check the role test page for debug information
2. Verify database records exist and are correct
3. Check browser console for error messages
4. Review network requests in browser dev tools
