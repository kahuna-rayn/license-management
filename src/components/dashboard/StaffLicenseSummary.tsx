import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  employee_id: string | null;
}

interface StaffLicense {
  staff_id: string;
  staff_name: string;
  staff_email: string;
  employee_id: string | null;
  licenses: {
    id: string;
    product_name: string;
    language: string;
    start_date: string;
    end_date: string;
    access_level: string;
    seats: number;
  }[];
}

export function StaffLicenseSummary() {
  const { user } = useAuth();
  const [staffLicenses, setStaffLicenses] = useState<StaffLicense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStaffLicenses();
    }
  }, [user]);

  const fetchStaffLicenses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First, get all staff members who have this user as their manager
      const { data: staffMembers, error: staffError } = await supabase
        .from('profiles')
        .select('id, full_name, username, employee_id')
        .eq('manager', user.id);

      if (staffError) {
        console.error('Error fetching staff members:', staffError);
        toast({
          title: "Error loading staff information",
          description: "Please try again later.",
          variant: "destructive",
        });
        return;
      }

      if (!staffMembers || staffMembers.length === 0) {
        setStaffLicenses([]);
        setLoading(false);
        return;
      }

      // Get license information for all staff members
      const staffIds = staffMembers.map(staff => staff.id);
      const { data: licenseData, error: licenseError } = await supabase
        .from('product_license_assignments')
        .select(`
          user_id,
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
        .in('user_id', staffIds);

      if (licenseError) {
        console.error('Error fetching staff licenses:', licenseError);
        toast({
          title: "Error loading staff licenses",
          description: "Please try again later.",
          variant: "destructive",
        });
        return;
      }

      // Group licenses by staff member
      const staffLicenseMap = new Map<string, StaffLicense>();
      
      // Initialize all staff members
      staffMembers.forEach(staff => {
        staffLicenseMap.set(staff.id, {
          staff_id: staff.id,
          staff_name: staff.full_name || 'Unknown',
          staff_email: staff.username || 'No email',
          employee_id: staff.employee_id,
          licenses: []
        });
      });

      // Add licenses to each staff member
      licenseData?.forEach((assignment: any) => {
        const staffMember = staffLicenseMap.get(assignment.user_id);
        if (staffMember) {
          staffMember.licenses.push({
            id: assignment.id,
            product_name: assignment.customer_product_licenses.products.name,
            language: assignment.customer_product_licenses.language,
            start_date: assignment.customer_product_licenses.start_date,
            end_date: assignment.customer_product_licenses.end_date,
            access_level: assignment.access_level,
            seats: assignment.customer_product_licenses.seats,
          });
        }
      });

      setStaffLicenses(Array.from(staffLicenseMap.values()));
    } catch (error) {
      console.error('Error fetching staff licenses:', error);
      toast({
        title: "Error loading staff licenses",
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
        return <Users className="h-4 w-4 text-status-danger" />;
      case 'manager':
        return <Users className="h-4 w-4 text-status-warning" />;
      default:
        return <User className="h-4 w-4 text-status-info" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff License Summary
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

  if (staffLicenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff License Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No staff members found under your management.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Staff License Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {staffLicenses.map((staffMember) => (
            <div key={staffMember.staff_id} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{staffMember.staff_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {staffMember.staff_email}
                    {staffMember.employee_id && ` • ID: ${staffMember.employee_id}`}
                  </p>
                </div>
              </div>
              
              {staffMember.licenses.length === 0 ? (
                <div className="text-sm text-muted-foreground pl-6">
                  No licenses assigned
                </div>
              ) : (
                <div className="space-y-2 pl-6">
                  {staffMember.licenses.map((license) => {
                    const expirationInfo = getExpirationStatus(license.end_date);
                    
                    return (
                      <div
                        key={license.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getAccessLevelIcon(license.access_level)}
                          <div>
                            <p className="font-medium text-sm">{license.product_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {license.language} • {license.access_level.charAt(0).toUpperCase() + license.access_level.slice(1)} Access
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs font-medium flex items-center gap-1">
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
                          
                          <Badge variant={expirationInfo.color as any} className="text-xs">
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
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
