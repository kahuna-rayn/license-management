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
  Settings,
  Building2,
  Monitor,
  AlertTriangle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { getRoleDisplayName } from '@/lib/roles';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const { userRole, loading } = useUserRole();

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
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary border-b-2 border-primary">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <Users className="h-4 w-4" />
              License Assignments
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <Monitor className="h-4 w-4" />
              Software Inventory
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="h-4 w-4" />
              Settings
            </button>
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
  const metrics = [
    {
      title: "Total Licensed Seats",
      value: "1,247",
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "text-accent-blue",
    },
    {
      title: "Active Assignments",
      value: "1,089",
      change: "+8%",
      trend: "up", 
      icon: Shield,
      color: "text-status-success",
    },
    {
      title: "Expiring Soon",
      value: "23",
      change: "+3",
      trend: "warning",
      icon: Clock,
      color: "text-status-warning",
    },
    {
      title: "License Utilization",
      value: "87.3%",
      change: "+2.1%",
      trend: "up",
      icon: TrendingUp,
      color: "text-status-info",
    },
  ];

  const expiringLicenses = [
    { product: "Microsoft Office 365", users: 45, expires: "30 days", status: "warning" },
    { product: "Adobe Creative Suite", users: 12, expires: "15 days", status: "danger" },
    { product: "Slack Professional", users: 89, expires: "60 days", status: "info" },
    { product: "Zoom Enterprise", users: 156, expires: "90 days", status: "success" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Metrics Overview */}
      <div>
        <h2 className="text-2xl font-bold mb-6">License Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <Card key={index} className="card-gradient hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="text-3xl font-bold mt-2">{metric.value}</p>
                    <div className="flex items-center mt-2">
                      <span className={`text-sm font-medium ${
                        metric.trend === 'up' ? 'text-status-success' :
                        metric.trend === 'warning' ? 'text-status-warning' :
                        'text-status-danger'
                      }`}>
                        {metric.change}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">from last month</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg bg-secondary ${metric.color}`}>
                    <metric.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Expiring Licenses */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Expiring Licenses</h2>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-status-warning" />
              License Expiration Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expiringLicenses.map((license, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      license.status === 'danger' ? 'bg-status-danger' :
                      license.status === 'warning' ? 'bg-status-warning' :
                      license.status === 'info' ? 'bg-status-info' :
                      'bg-status-success'
                    }`} />
                    <div>
                      <p className="font-medium">{license.product}</p>
                      <p className="text-sm text-muted-foreground">{license.users} licensed users</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      license.status === 'danger' ? 'destructive' :
                      license.status === 'warning' ? 'secondary' :
                      'outline'
                    }>
                      Expires in {license.expires}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-gradient hover:shadow-elevated transition-all duration-300 cursor-pointer">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-accent-blue mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Assign Licenses</h3>
              <p className="text-sm text-muted-foreground">Allocate software licenses to team members</p>
            </CardContent>
          </Card>
          
          <Card className="card-gradient hover:shadow-elevated transition-all duration-300 cursor-pointer">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-12 w-12 text-accent-green mx-auto mb-4" />
              <h3 className="font-semibold mb-2">View Reports</h3>
              <p className="text-sm text-muted-foreground">Generate license usage and compliance reports</p>
            </CardContent>
          </Card>
          
          <Card className="card-gradient hover:shadow-elevated transition-all duration-300 cursor-pointer">
            <CardContent className="p-6 text-center">
              <Building2 className="h-12 w-12 text-accent-orange mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Manage Departments</h3>
              <p className="text-sm text-muted-foreground">Organize license assignments by department</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}