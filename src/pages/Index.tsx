import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { DashboardLayout, DashboardOverview } from '@/components/DashboardLayout';
import { LicenseAssignments } from '@/components/LicenseAssignments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Shield, Crown, Settings, User } from 'lucide-react';
import { RoleGuard, AdminOnly, ModeratorOrHigher } from '@/components/RoleGuard';
import { UserRoleDisplay } from '@/components/UserRoleDisplay';
import { useUserRole } from '@/hooks/useUserRole';

const Index = () => {
  const { user, loading } = useAuth();
  const { userRole, isAdmin, isModerator } = useUserRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading RAYN License Hub...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Please sign in to access the RAYN License Hub dashboard.
            </p>
            <Button variant="enterprise" size="lg" onClick={() => navigate('/auth')} className="w-full">
              Go to Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'license-assignments':
        return <LicenseAssignments />;
      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            {/* Role-Based Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Admin Only Content */}
              <AdminOnly fallback={
                <Card className="opacity-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5" />
                      Admin Panel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Admin access required to view this content.
                    </p>
                  </CardContent>
                </Card>
              }>
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-primary" />
                      Admin Panel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Welcome, RAYN Admin! You have full system access.
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        System Settings
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        User Management
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        License Management
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </AdminOnly>

              {/* Moderator or Higher Content */}
              <ModeratorOrHigher fallback={
                <Card className="opacity-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Moderation Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Moderator access required to view this content.
                    </p>
                  </CardContent>
                </Card>
              }>
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      Moderation Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Enhanced access with moderation capabilities.
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        Content Review
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        User Reports
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        Audit Logs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </ModeratorOrHigher>

              {/* User Content (Always Visible) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Standard user access and features.
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      My Licenses
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      Profile Settings
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Overview */}
            <DashboardOverview />
          </div>
        );
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default Index;