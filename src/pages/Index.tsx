import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { DashboardLayout } from '@/components/DashboardLayout';
import { LicenseAssignments } from '@/components/LicenseAssignments';
import { RAYNDashboard } from '@/components/dashboard/RAYNDashboard';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { LicenseInformation } from '@/components/dashboard/LicenseInformation';
import { StaffLicenseSummary } from '@/components/dashboard/StaffLicenseSummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Shield, Crown, Settings, User } from 'lucide-react';
import { RoleGuard, AdminOnly, ManagerOrHigher } from '@/components/RoleGuard';
import { UserRoleDisplay } from '@/components/UserRoleDisplay';
import { useUserRole } from '@/hooks/useUserRole';

const Index = () => {
  const { user, loading } = useAuth();
  const { userRole, isAdmin, isManager, isRaynAdmin, isClientAdmin } = useUserRole();
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
        // Show appropriate dashboard based on user role
        if (isRaynAdmin) {
          return <RAYNDashboard />;
        } else if (isClientAdmin) {
          return <ClientDashboard />;
        } else if (isManager) {
          // Managers see their own licenses plus staff summary
          return (
            <div className="space-y-6">
              {/* License Information */}
              <LicenseInformation />
              {/* Staff License Summary */}
              <StaffLicenseSummary />
            </div>
          );
        } else {
          // Regular users see a simplified dashboard
          return (
            <div className="space-y-6">
              {/* License Information */}
              <LicenseInformation />
            </div>
          );
        }
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default Index;