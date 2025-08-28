import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  MapPin, 
  ArrowLeft,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface DashboardLevel {
  level: 2 | 3 | 4;
  title: string;
  locationId?: string;
  departmentId?: string;
}

interface ClientMetrics {
  licensedSeats: number;
  expiringLicenses: {
    overdue: number;
    days30: number;
    days60: number;
    days90: number;
  };
}

interface LocationData {
  id: string;
  name: string;
  seats: number;
  expiring: number;
}

interface DepartmentData {
  id: string;
  name: string;
  seats: number;
  expiring: number;
}

export function ClientDashboard() {
  const { userRole } = useUserRole();
  const [currentLevel, setCurrentLevel] = useState<DashboardLevel>({ level: 2, title: 'Organization Overview' });
  const [metrics, setMetrics] = useState<ClientMetrics | null>(null);
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole?.customer_id) {
      fetchDashboardData();
    }
  }, [currentLevel, userRole]);

  const fetchDashboardData = async () => {
    if (!userRole?.customer_id) return;
    
    setLoading(true);
    try {
      switch (currentLevel.level) {
        case 2:
          await fetchClientOverview();
          break;
        case 3:
          await fetchLocationData();
          break;
        case 4:
          await fetchDepartmentData(currentLevel.locationId!);
          break;
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error loading dashboard",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientOverview = async () => {
    if (!userRole?.customer_id) return;

    // Fetch licenses for this client
    const { data: licenses, error } = await supabase
      .from('customer_product_licenses')
      .select(`
        *,
        products (
          id,
          name
        )
      `)
      .eq('customer_id', userRole.customer_id);

    if (error) {
      console.error('Error fetching client licenses:', error);
      return;
    }

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const totalSeats = licenses?.reduce((sum, l) => sum + (l.seats || 0), 0) || 0;

    const expiring = licenses?.reduce((acc, license) => {
      if (!license.end_date) return acc;
      const endDate = new Date(license.end_date);
      
      if (endDate < now) acc.overdue++;
      else if (endDate <= thirtyDays) acc.days30++;
      else if (endDate <= sixtyDays) acc.days60++;
      else if (endDate <= ninetyDays) acc.days90++;
      
      return acc;
    }, { overdue: 0, days30: 0, days60: 0, days90: 0 }) || { overdue: 0, days30: 0, days60: 0, days90: 0 };

    setMetrics({
      licensedSeats: totalSeats,
      expiringLicenses: expiring
    });
  };

  const fetchLocationData = async () => {
    // Mock location data since we don't have location info in current schema
    // In a real implementation, this would query based on the client's locations
    setLocationData([
      { id: '1', name: 'Main Office', seats: 150, expiring: 3 },
      { id: '2', name: 'Branch Office A', seats: 75, expiring: 1 },
      { id: '3', name: 'Branch Office B', seats: 60, expiring: 2 },
      { id: '4', name: 'Remote Workers', seats: 45, expiring: 0 },
    ]);
  };

  const fetchDepartmentData = async (locationId: string) => {
    // Mock department data since we don't have department info in current schema
    // In a real implementation, this would query based on the location's departments
    setDepartmentData([
      { id: '1', name: 'Engineering', seats: 65, expiring: 2 },
      { id: '2', name: 'Sales', seats: 40, expiring: 1 },
      { id: '3', name: 'Marketing', seats: 25, expiring: 0 },
      { id: '4', name: 'Operations', seats: 20, expiring: 0 },
    ]);
  };

  const navigateToLevel = (level: DashboardLevel) => {
    setCurrentLevel(level);
  };

  const goBack = () => {
    switch (currentLevel.level) {
      case 3:
        setCurrentLevel({ level: 2, title: 'Organization Overview' });
        break;
      case 4:
        setCurrentLevel({ level: 3, title: 'Location Overview' });
        break;
    }
  };

  const getExpirationBadgeVariant = (count: number) => {
    if (count === 0) return "secondary";
    if (count < 3) return "outline";
    if (count < 6) return "secondary";
    return "destructive";
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {currentLevel.level > 2 && (
            <Button variant="outline" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold">{currentLevel.title}</h2>
            <p className="text-muted-foreground">
              Level {currentLevel.level} - {
                currentLevel.level === 2 ? 'Organization Level' :
                currentLevel.level === 3 ? 'Location Level' :
                'Department Level'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Level 2: Organization Overview */}
      {currentLevel.level === 2 && metrics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Licensed Seats</p>
                    <p className="text-3xl font-bold">{metrics.licensedSeats.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-1">Organization Total</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                    <p className="text-3xl font-bold">
                      {metrics.expiringLicenses.days30 + metrics.expiringLicenses.days60 + metrics.expiringLicenses.days90}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Next 90 days</p>
                  </div>
                  <Calendar className="h-8 w-8 text-status-warning" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expiration Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>License Expiration Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Pie Chart */}
                <div className="h-64 w-full">
                  {metrics && (
                    <ChartContainer
                      config={{
                        overdue: {
                          label: "Overdue",
                          color: "hsl(var(--status-danger))",
                        },
                        days30: {
                          label: "30 Days",
                          color: "hsl(var(--status-warning))",
                        },
                        days60: {
                          label: "60 Days",
                          color: "hsl(var(--status-info))",
                        },
                        days90: {
                          label: "90 Days",
                          color: "hsl(var(--status-success))",
                        },
                        active: {
                          label: "Active",
                          color: "hsl(var(--status-success))",
                        },
                      }}
                    >
                      <PieChart>
                        <Pie
                          data={[
                            { name: "overdue", value: metrics.expiringLicenses.overdue },
                            { name: "days30", value: metrics.expiringLicenses.days30 },
                            { name: "days60", value: metrics.expiringLicenses.days60 },
                            { name: "days90", value: metrics.expiringLicenses.days90 },
                            { name: "active", value: Math.max(0, metrics.licensedSeats - (metrics.expiringLicenses.overdue + metrics.expiringLicenses.days30 + metrics.expiringLicenses.days60 + metrics.expiringLicenses.days90)) },
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {[
                            { name: "overdue", value: metrics.expiringLicenses.overdue },
                            { name: "days30", value: metrics.expiringLicenses.days30 },
                            { name: "days60", value: metrics.expiringLicenses.days60 },
                            { name: "days90", value: metrics.expiringLicenses.days90 },
                            { name: "active", value: Math.max(0, metrics.licensedSeats - (metrics.expiringLicenses.overdue + metrics.expiringLicenses.days30 + metrics.expiringLicenses.days60 + metrics.expiringLicenses.days90)) },
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.name === "overdue" ? "hsl(var(--status-danger))" :
                                entry.name === "days30" ? "hsl(var(--status-warning))" :
                                entry.name === "days60" ? "hsl(var(--status-info))" :
                                entry.name === "days90" ? "hsl(var(--status-success))" :
                                "hsl(var(--primary))"
                              }
                            />
                          ))}
                        </Pie>
                        <ChartTooltip>
                          <ChartTooltipContent />
                        </ChartTooltip>
                      </PieChart>
                    </ChartContainer>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation to Locations */}
          <Card>
            <CardHeader>
              <CardTitle>Drill Down by Location</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigateToLevel({ level: 3, title: 'Location Overview' })}
                className="w-full"
                variant="outline"
              >
                <MapPin className="h-4 w-4 mr-2" />
                View by Location
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Level 3: Location Level */}
      {currentLevel.level === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Location Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locationData.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                  onClick={() => navigateToLevel({
                    level: 4,
                    title: `Departments - ${location.name}`,
                    locationId: location.id
                  })}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-6 w-6 text-accent-blue" />
                    <div>
                      <p className="font-medium">{location.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold">{location.seats}</p>
                      <p className="text-sm text-muted-foreground">seats</p>
                    </div>
                    <Badge variant={getExpirationBadgeVariant(location.expiring)}>
                      {location.expiring} expiring
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Level 4: Department Level */}
      {currentLevel.level === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentData.map((department) => (
                <div
                  key={department.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-status-success" />
                    <div>
                      <p className="font-medium">{department.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold">{department.seats}</p>
                      <p className="text-sm text-muted-foreground">seats</p>
                    </div>
                    <Badge variant={getExpirationBadgeVariant(department.expiring)}>
                      {department.expiring} expiring
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}