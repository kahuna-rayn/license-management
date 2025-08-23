import { useAuth } from '@/components/AuthProvider';
import { useUserRole } from '@/hooks/useUserRole';
import { RoleGuard, AdminOnly, ModeratorOrHigher } from '@/components/RoleGuard';
import { UserRoleDisplay } from '@/components/UserRoleDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, Settings, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function RoleTest() {
  const { user } = useAuth();
  const { userRole, loading, error, refetch } = useUserRole();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please sign in to test the role system.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Role System Test</h1>
          <Button onClick={refetch} variant="outline">
            Refresh Roles
          </Button>
        </div>

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Status:</strong> 
                <Badge variant="outline" className="ml-2">
                  {user.email_confirmed_at ? 'Verified' : 'Unverified'}
                </Badge>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Role Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserRoleDisplay />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Loading role information...</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  <span>Error: {error}</span>
                </div>
              ) : userRole ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Role loaded successfully</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Role:</span>
                      <Badge variant="outline">{userRole.role}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Source:</span>
                      <Badge variant="outline">{userRole.source}</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <XCircle className="h-4 w-4" />
                  <span>No role information available</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Role-Based Access Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Admin Access Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Admin Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdminOnly
                fallback={
                  <div className="text-center space-y-2">
                    <XCircle className="h-8 w-8 text-red-500 mx-auto" />
                    <p className="text-sm text-muted-foreground">Admin access denied</p>
                  </div>
                }
              >
                <div className="text-center space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                  <p className="text-sm font-medium">Admin access granted!</p>
                  <p className="text-xs text-muted-foreground">You can see this content</p>
                </div>
              </AdminOnly>
            </CardContent>
          </Card>

          {/* Moderator Access Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Moderator Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ModeratorOrHigher
                fallback={
                  <div className="text-center space-y-2">
                    <XCircle className="h-8 w-8 text-red-500 mx-auto" />
                    <p className="text-sm text-muted-foreground">Moderator access denied</p>
                  </div>
                }
              >
                <div className="text-center space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                  <p className="text-sm font-medium">Moderator access granted!</p>
                  <p className="text-xs text-muted-foreground">You can see this content</p>
                </div>
              </ModeratorOrHigher>
            </CardContent>
          </Card>

          {/* User Access Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                <p className="text-sm font-medium">User access granted!</p>
                <p className="text-xs text-muted-foreground">All authenticated users can see this</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role Hierarchy Explanation */}
        <Card>
          <CardHeader>
            <CardTitle>Role Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Crown className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <h3 className="font-semibold">RAYN Admin</h3>
                  <p className="text-sm text-muted-foreground">
                    Full system access with RAYN administrative privileges
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Source: user_roles table (app_role = 'admin')
                  </p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <Crown className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Client Admin</h3>
                  <p className="text-sm text-muted-foreground">
                    Client-level administrative access for license management
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Source: product_license_assignments table (access_level = 'admin')
                  </p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <Settings className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Moderator</h3>
                  <p className="text-sm text-muted-foreground">
                    Enhanced access with moderation capabilities
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Source: product_license_assignments table (access_level = 'moderator')
                  </p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <User className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <h3 className="font-semibold">User</h3>
                  <p className="text-sm text-muted-foreground">
                    Standard user access
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Source: Default fallback
                  </p>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Role Assignment Logic:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Check <code>user_roles</code> table for <code>app_role = 'admin'</code> → RAYN Admin</li>
                  <li>Check <code>product_license_assignments</code> table for <code>access_level = 'admin'</code> → Client Admin</li>
                  <li>Check <code>product_license_assignments</code> table for <code>access_level = 'moderator'</code> → Moderator</li>
                  <li>Default to <code>'user'</code> if neither record exists</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
