import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Users, 
  Calendar, 
  TrendingUp, 
  MapPin, 
  Briefcase,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

interface DashboardLevel {
  level: 1 | 2 | 3 | 4;
  title: string;
  customerId?: string;
  locationId?: string;
  departmentId?: string;
}

interface LicenseMetrics {
  licensedClients: number;
  licensedSeats: number;
  expiringLicenses: {
    overdue: number;
    days30: number;
    days60: number;
    days90: number;
  };
  licensesByIndustry: Array<{
    industry: string;
    count: number;
    seats: number;
  }>;
}

interface ClientData {
  id: string;
  name: string;
  seats: number;
  expiring: number;
  industry?: string;
}

export function RAYNDashboard() {
  const [currentLevel, setCurrentLevel] = useState<DashboardLevel>({ level: 1, title: 'RAYN Overview' });
  const [metrics, setMetrics] = useState<LicenseMetrics | null>(null);
  const [clientData, setClientData] = useState<ClientData[]>([]);
  const [locationData, setLocationData] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [currentLevel]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      switch (currentLevel.level) {
        case 1:
          await fetchRAYNOverview();
          break;
        case 2:
          await fetchClientData();
          break;
        case 3:
          await fetchLocationData(currentLevel.customerId!);
          break;
        case 4:
          await fetchDepartmentData(currentLevel.customerId!, currentLevel.locationId!);
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

  const fetchRAYNOverview = async () => {
    // Fetch overall RAYN metrics
    const { data: licenses, error } = await supabase
      .from('customer_product_licenses')
      .select(`
        *,
        customers (
          id,
          customer_name,
          short_name
        ),
        products (
          id,
          name
        )
      `);

    if (error) {
      console.error('Error fetching licenses:', error);
      return;
    }

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const uniqueClients = new Set(licenses?.map(l => l.customer_id)).size;
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

    // Mock industry data for now
    const licensesByIndustry = [
      { industry: 'Technology', count: 12, seats: 340 },
      { industry: 'Finance', count: 8, seats: 260 },
      { industry: 'Healthcare', count: 6, seats: 180 },
      { industry: 'Education', count: 4, seats: 120 },
    ];

    setMetrics({
      licensedClients: uniqueClients,
      licensedSeats: totalSeats,
      expiringLicenses: expiring,
      licensesByIndustry
    });
  };

  const fetchClientData = async () => {
    const { data: licenses, error } = await supabase
      .from('customer_product_licenses')
      .select(`
        *,
        customers (
          id,
          customer_name,
          short_name
        )
      `);

    if (error) {
      console.error('Error fetching client data:', error);
      return;
    }

    const now = new Date();
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const clientMap = new Map();
    
    licenses?.forEach(license => {
      if (!license.customers) return;
      
      const clientId = license.customers.id;
      const endDate = license.end_date ? new Date(license.end_date) : null;
      const isExpiring = endDate && endDate <= ninetyDays;
      
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          id: clientId,
          name: license.customers.customer_name,
          seats: 0,
          expiring: 0,
          industry: 'Technology' // Mock for now
        });
      }
      
      const client = clientMap.get(clientId);
      client.seats += license.seats || 0;
      if (isExpiring) client.expiring++;
    });

    setClientData(Array.from(clientMap.values()));
  };

  const fetchLocationData = async (customerId: string) => {
    // Mock location data since we don't have location info in current schema
    setLocationData([
      { id: '1', name: 'Headquarters', seats: 120, expiring: 2 },
      { id: '2', name: 'Regional Office', seats: 80, expiring: 1 },
      { id: '3', name: 'Branch Office', seats: 45, expiring: 0 },
    ]);
  };

  const fetchDepartmentData = async (customerId: string, locationId: string) => {
    // Mock department data since we don't have department info in current schema
    setDepartmentData([
      { id: '1', name: 'Engineering', seats: 45, expiring: 1 },
      { id: '2', name: 'Sales', seats: 35, expiring: 1 },
      { id: '3', name: 'Marketing', seats: 25, expiring: 0 },
      { id: '4', name: 'HR', seats: 15, expiring: 0 },
    ]);
  };

  const navigateToLevel = (level: DashboardLevel) => {
    setCurrentLevel(level);
  };

  const goBack = () => {
    switch (currentLevel.level) {
      case 2:
        setCurrentLevel({ level: 1, title: 'RAYN Overview' });
        break;
      case 3:
        setCurrentLevel({ level: 2, title: 'Client Overview' });
        break;
      case 4:
        setCurrentLevel({ 
          level: 3, 
          title: `Location Overview - ${currentLevel.customerId}`,
          customerId: currentLevel.customerId 
        });
        break;
    }
  };

  const getExpirationBadgeVariant = (count: number) => {
    if (count === 0) return "secondary";
    if (count < 5) return "outline";
    if (count < 10) return "secondary";
    return "destructive";
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
          {currentLevel.level > 1 && (
            <Button variant="outline" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold">{currentLevel.title}</h2>
            <p className="text-muted-foreground">
              Level {currentLevel.level} - {
                currentLevel.level === 1 ? 'RAYN Overview' :
                currentLevel.level === 2 ? 'Client Level' :
                currentLevel.level === 3 ? 'Location Level' :
                'Department Level'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Level 1: RAYN Overview */}
      {currentLevel.level === 1 && metrics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Licensed Clients</p>
                    <p className="text-3xl font-bold">{metrics.licensedClients}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Licensed Seats</p>
                    <p className="text-3xl font-bold">{metrics.licensedSeats.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-accent-blue" />
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
                  </div>
                  <Calendar className="h-8 w-8 text-status-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                    <p className="text-3xl font-bold text-status-danger">{metrics.expiringLicenses.overdue}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-status-danger" />
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
                 {/* Pie Chart and Overview */}
                 <div className="flex items-center gap-6">
                   {/* Pie Chart */}
                   <div className="h-64 flex-1">
                     {metrics && (
                       <div className="w-full h-full">
                         <ChartContainer
                           config={{
                             overdue: {
                               label: "Overdue",
                               color: "hsl(var(--status-danger))",
                             },
                             days30: {
                               label: "30 Days",
                               color: "hsl(var(--accent-red))",
                             },
                             days60: {
                               label: "60 Days",
                               color: "hsl(var(--accent-orange))",
                             },
                             days90: {
                               label: "90 Days",
                               color: "hsl(var(--accent-blue))",
                             },
                             active: {
                               label: "Active",
                               color: "hsl(var(--status-success))",
                             },
                           }}
                           className="w-full h-full"
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
                                     entry.name === "days30" ? "hsl(var(--accent-red))" :
                                     entry.name === "days60" ? "hsl(var(--accent-orange))" :
                                     entry.name === "days90" ? "hsl(var(--accent-blue))" :
                                     "hsl(var(--status-success))"
                                   }
                                 />
                               ))}
                             </Pie>
                             <ChartTooltip>
                               <ChartTooltipContent />
                             </ChartTooltip>
                           </PieChart>
                         </ChartContainer>
                       </div>
                     )}
                   </div>
                   
                   {/* Category Overview - Vertical Stack */}
                   <div className="space-y-3 min-w-[120px]">
                     <div className="text-center p-3 rounded-lg bg-status-danger/10">
                       <p className="text-xl font-bold text-status-danger">{metrics.expiringLicenses.overdue}</p>
                       <p className="text-xs text-muted-foreground">Overdue</p>
                     </div>
                     <div className="text-center p-3 rounded-lg bg-accent-red/10">
                       <p className="text-xl font-bold text-accent-red">{metrics.expiringLicenses.days30}</p>
                       <p className="text-xs text-muted-foreground">30 Days</p>
                     </div>
                     <div className="text-center p-3 rounded-lg bg-accent-orange/10">
                       <p className="text-xl font-bold text-accent-orange">{metrics.expiringLicenses.days60}</p>
                       <p className="text-xs text-muted-foreground">60 Days</p>
                     </div>
                     <div className="text-center p-3 rounded-lg bg-accent-blue/10">
                       <p className="text-xl font-bold text-accent-blue">{metrics.expiringLicenses.days90}</p>
                       <p className="text-xs text-muted-foreground">90 Days</p>
                     </div>
                     <div className="text-center p-3 rounded-lg bg-status-success/10">
                       <p className="text-xl font-bold text-status-success">
                         {Math.max(0, metrics.licensedSeats - (metrics.expiringLicenses.overdue + metrics.expiringLicenses.days30 + metrics.expiringLicenses.days60 + metrics.expiringLicenses.days90))}
                       </p>
                       <p className="text-xs text-muted-foreground">Active</p>
                     </div>
                   </div>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Industry Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Licenses by Industry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.licensesByIndustry.map((industry, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{industry.industry}</p>
                        <p className="text-sm text-muted-foreground">{industry.count} clients</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{industry.seats}</p>
                      <p className="text-sm text-muted-foreground">seats</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Level 2: Client Level */}
      {currentLevel.level === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Client Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientData.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                  onClick={() => navigateToLevel({
                    level: 3,
                    title: `Locations - ${client.name}`,
                    customerId: client.id
                  })}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.industry}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold">{client.seats}</p>
                      <p className="text-sm text-muted-foreground">seats</p>
                    </div>
                    <Badge variant={getExpirationBadgeVariant(client.expiring)}>
                      {client.expiring} expiring
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
                    customerId: currentLevel.customerId,
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
                    <Users className="h-6 w-6 text-status-success" />
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