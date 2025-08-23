import { useUserRole } from '@/hooks/useUserRole';
import { getRoleDisplayName, getRoleDescription } from '@/lib/roles';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, Crown, Settings } from 'lucide-react';
export function UserRoleDisplay() {
  const {
    userRole,
    loading,
    error
  } = useUserRole();
  if (loading) {
    return <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card className="w-full max-w-md border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            User Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Error loading user role: {error}</p>
        </CardContent>
      </Card>;
  }
  if (!userRole) {
    return <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No role information available</p>
        </CardContent>
      </Card>;
  }
  const getRoleIcon = () => {
    switch (userRole.role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'moderator':
        return <Settings className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };
  const getSourceColor = () => {
    switch (userRole.source) {
      case 'user_roles':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'product_license_assignments':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'default':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getSourceDescription = () => {
    switch (userRole.source) {
      case 'user_roles':
        return 'RAYN Admin Role';
      case 'product_license_assignments':
        return 'Product License Assignment';
      case 'default':
        return 'Default User Role';
      default:
        return 'Unknown Source';
    }
  };
  return;
}