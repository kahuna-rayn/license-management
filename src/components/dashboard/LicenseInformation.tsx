import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

interface UserLicense {
  id: string;
  product_name: string;
  language: string;
  start_date: string;
  end_date: string;
  access_level: string;
  seats: number;
}

export function LicenseInformation() {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState<UserLicense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserLicenses();
    }
  }, [user]);

  const fetchUserLicenses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_license_assignments')
        .select(`
          id,
          access_level,
          customer_product_licenses!inner (
            start_date,
            end_date,
            language,
            seats,
            products!inner (
              name
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user licenses:', error);
        toast({
          title: "Error loading licenses",
          description: "Please try again later.",
          variant: "destructive",
        });
        return;
      }

      const formattedLicenses: UserLicense[] = data?.map((assignment: any) => ({
        id: assignment.id,
        product_name: assignment.customer_product_licenses.products.name,
        language: assignment.customer_product_licenses.language,
        start_date: assignment.customer_product_licenses.start_date,
        end_date: assignment.customer_product_licenses.end_date,
        access_level: assignment.access_level,
        seats: assignment.customer_product_licenses.seats,
      })) || [];

      setLicenses(formattedLicenses);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      toast({
        title: "Error loading licenses",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getExpirationStatus = (endDate: string) => {
    const now = new Date();
    const expiration = new Date(endDate);
    const daysUntilExpiration = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) {
      return { status: 'expired', days: Math.abs(daysUntilExpiration), color: 'destructive' };
    } else if (daysUntilExpiration <= 30) {
      return { status: 'expiring', days: daysUntilExpiration, color: 'secondary' };
    } else if (daysUntilExpiration <= 90) {
      return { status: 'warning', days: daysUntilExpiration, color: 'outline' };
    } else {
      return { status: 'active', days: daysUntilExpiration, color: 'default' };
    }
  };

  const getAccessLevelIcon = (accessLevel: string) => {
    switch (accessLevel) {
      case 'admin':
        return <Shield className="h-4 w-4 text-status-danger" />;
      case 'manager':
        return <Shield className="h-4 w-4 text-status-warning" />;
      default:
        return <Shield className="h-4 w-4 text-status-info" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            My Licenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (licenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            My Licenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No licenses assigned to your account.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          My Licenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {licenses.map((license) => {
            const expirationInfo = getExpirationStatus(license.end_date);
            
            return (
              <div
                key={license.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getAccessLevelIcon(license.access_level)}
                  <div>
                    <p className="font-medium">{license.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {license.language} • {license.access_level.charAt(0).toUpperCase() + license.access_level.slice(1)} Access
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(license.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {expirationInfo.status === 'expired' 
                        ? `Expired ${expirationInfo.days} days ago`
                        : expirationInfo.status === 'expiring'
                        ? `Expires in ${expirationInfo.days} days`
                        : expirationInfo.status === 'warning'
                        ? `Expires in ${expirationInfo.days} days`
                        : `Active for ${expirationInfo.days} days`
                      }
                    </p>
                  </div>
                  
                  <Badge variant={expirationInfo.color as any}>
                    {expirationInfo.status === 'expired' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {expirationInfo.status === 'expiring' && <Clock className="h-3 w-3 mr-1" />}
                    {expirationInfo.status === 'warning' && <Clock className="h-3 w-3 mr-1" />}
                    {expirationInfo.status === 'active' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {expirationInfo.status === 'expired' ? 'Expired' :
                     expirationInfo.status === 'expiring' ? 'Expiring Soon' :
                     expirationInfo.status === 'warning' ? 'Expires Soon' :
                     'Active'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}