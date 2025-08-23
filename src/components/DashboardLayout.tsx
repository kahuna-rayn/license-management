import { ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  LogOut, 
  Shield, 
  Users, 
  BarChart3, 
  Building2,
  AlertTriangle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { getRoleDisplayName } from '@/lib/roles';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function DashboardLayout({ children, activeTab = 'dashboard', onTabChange }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const { userRole, loading, isRaynAdmin, isClientAdmin } = useUserRole();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "Thank you for using RAYN License Hub.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary shadow-soft border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Shield className="h-8 w-8 text-primary-foreground" />
              <div>
                <h1 className="text-xl font-bold text-primary-foreground">RAYN License Hub</h1>
                <p className="text-sm text-primary-foreground/80">Professional License Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-primary-foreground">{user?.email}</p>
                <Badge variant="secondary" className="text-xs">
                  {loading ? 'Loading...' : userRole ? getRoleDisplayName(userRole.role, userRole) : 'User'}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 h-14">
            <button 
              onClick={() => onTabChange?.('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'dashboard' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </button>
            {(isRaynAdmin || isClientAdmin) && (
              <button 
                onClick={() => onTabChange?.('license-assignments')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'license-assignments' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4" />
                License Assignments
              </button>
            )}

          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export function DashboardOverview() {
  return null; // This component is now replaced by specific dashboard components
}