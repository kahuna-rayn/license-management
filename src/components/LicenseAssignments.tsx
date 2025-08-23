import { useState, useEffect } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, Building2, UserCheck, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  access_level: string;
  status: string;
  customer_name?: string;
  customer_id?: string;
  hasLicense: boolean;
  license_access_level?: string;
}

interface Customer {
  id: string;
  customer_name: string;
  short_name: string;
}

interface CustomerLicense {
  id: string;
  product_name: string;
  seats: number;
  used_seats: number;
  customer_id: string;
}

export function LicenseAssignments() {
  const { userRole, isRaynAdmin, isClientAdmin, loading } = useUserRole();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerLicenses, setCustomerLicenses] = useState<CustomerLicense[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Load customers (for RAYN admins)
  useEffect(() => {
    if (isRaynAdmin) {
      loadCustomers();
    }
  }, [isRaynAdmin]);

  // Load employees when customer changes or component mounts
  useEffect(() => {
    if (isClientAdmin || (isRaynAdmin && selectedCustomer)) {
      loadEmployees();
      loadCustomerLicenses();
    }
  }, [isClientAdmin, isRaynAdmin, selectedCustomer]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, customer_name, short_name')
        .eq('is_active', true)
        .order('customer_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    }
  };

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      
      // For client admins, get their customer_id from their profile
      let targetCustomerId = selectedCustomer;
      
      if (isClientAdmin && !targetCustomerId) {
        // Get current user's customer from their license assignment
        const { data: userLicense } = await supabase
          .from('product_license_assignments')
          .select('license_id, customer_product_licenses(customer_id)')
          .eq('user_id', userRole?.source === 'user_roles' ? '' : ''); // This needs proper user ID

        if (userLicense?.[0]?.customer_product_licenses) {
          targetCustomerId = (userLicense[0].customer_product_licenses as any).customer_id;
        }
      }

      if (!targetCustomerId) return;

      // Get all employees for the customer
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          access_level,
          status,
          product_license_assignments(access_level, license_id),
          customer_product_licenses!inner(customer_id, customers(customer_name))
        `)
        .eq('customer_product_licenses.customer_id', targetCustomerId);

      if (profilesError) throw profilesError;

      const processedEmployees: Employee[] = (profilesData || []).map(profile => ({
        id: profile.id,
        full_name: profile.full_name || profile.username || 'Unknown',
        email: profile.username || '',
        access_level: profile.access_level || 'User',
        status: profile.status || 'Active',
        customer_name: (profile.customer_product_licenses as any)?.customers?.customer_name,
        customer_id: targetCustomerId,
        hasLicense: (profile.product_license_assignments as any)?.length > 0,
        license_access_level: (profile.product_license_assignments as any)?.[0]?.access_level || 'user'
      }));

      setEmployees(processedEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomerLicenses = async () => {
    try {
      const targetCustomerId = isClientAdmin ? selectedCustomer : selectedCustomer;
      if (!targetCustomerId) return;

      const { data, error } = await supabase
        .from('customer_product_licenses')
        .select(`
          id,
          seats,
          products(name),
          product_license_assignments(id)
        `)
        .eq('customer_id', targetCustomerId);

      if (error) throw error;

      const licenses: CustomerLicense[] = (data || []).map(license => ({
        id: license.id,
        product_name: (license.products as any)?.name || 'Unknown Product',
        seats: license.seats,
        used_seats: (license.product_license_assignments as any)?.length || 0,
        customer_id: targetCustomerId
      }));

      setCustomerLicenses(licenses);
    } catch (error) {
      console.error('Error loading customer licenses:', error);
    }
  };

  const assignLicenses = async (accessLevel: 'admin' | 'moderator' | 'user' = 'user') => {
    if (selectedEmployees.size === 0) {
      toast({
        title: "No employees selected",
        description: "Please select employees to assign licenses to",
        variant: "destructive",
      });
      return;
    }

    if (customerLicenses.length === 0) {
      toast({
        title: "No licenses available",
        description: "No licenses found for this customer",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the first available license for now
      const availableLicense = customerLicenses.find(l => l.used_seats < l.seats);
      if (!availableLicense) {
        toast({
          title: "No available seats",
          description: "All license seats are currently assigned",
          variant: "destructive",
        });
        return;
      }

      const assignments = Array.from(selectedEmployees).map(employeeId => ({
        user_id: employeeId,
        license_id: availableLicense.id,
        access_level: accessLevel
      }));

      const { error } = await supabase
        .from('product_license_assignments')
        .insert(assignments);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Assigned licenses to ${selectedEmployees.size} employee(s)`,
      });

      setSelectedEmployees(new Set());
      loadEmployees();
      loadCustomerLicenses();
    } catch (error) {
      console.error('Error assigning licenses:', error);
      toast({
        title: "Error",
        description: "Failed to assign licenses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const revokeLicense = async (employeeId: string) => {
    try {
      const { error } = await supabase
        .from('product_license_assignments')
        .delete()
        .eq('user_id', employeeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "License revoked successfully",
      });

      loadEmployees();
      loadCustomerLicenses();
    } catch (error) {
      console.error('Error revoking license:', error);
      toast({
        title: "Error",
        description: "Failed to revoke license",
        variant: "destructive",
      });
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleEmployeeSelection = (employeeId: string) => {
    const newSelection = new Set(selectedEmployees);
    if (newSelection.has(employeeId)) {
      newSelection.delete(employeeId);
    } else {
      newSelection.add(employeeId);
    }
    setSelectedEmployees(newSelection);
  };

  const selectAll = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(filteredEmployees.map(e => e.id)));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (!isRaynAdmin && !isClientAdmin) {
    return (
      <div className="text-center p-8">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">
          License assignments are only available to RAYN and Client administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">License Assignments</h1>
          <p className="text-muted-foreground">Manage software license assignments for employees</p>
        </div>
      </div>

      {/* Customer Selection (RAYN Admins only) */}
      {isRaynAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Select Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose an organization to manage..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.customer_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* License Overview */}
      {customerLicenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {customerLicenses
            .sort((a, b) => a.product_name.localeCompare(b.product_name))
            .map(license => (
            <Card key={license.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{license.product_name}</p>
                    <p className="text-sm text-muted-foreground">
<<<<<<< HEAD
                      {license.used_seats} / {license.seats} seats used <br />
=======
                      {license.used_seats} / {license.seats} seats used
>>>>>>> da44702f1e05d0b4d693f14dfe35e6bc73aaff17
                      Expires: {license.end_date}
                    </p>
                  </div>
                  <Badge variant={license.used_seats >= license.seats ? "destructive" : "secondary"}>
                    {Math.round((license.used_seats / license.seats) * 100)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Employee Management */}
      {(isClientAdmin || (isRaynAdmin && selectedCustomer)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee License Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={selectAll}
                  disabled={filteredEmployees.length === 0}
                >
                  {selectedEmployees.size === filteredEmployees.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  onClick={() => assignLicenses('user')}
                  disabled={selectedEmployees.size === 0 || isLoading}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign Licenses
                </Button>
              </div>
            </div>

            {/* Employee List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEmployees.map(employee => (
                <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedEmployees.has(employee.id)}
                      onCheckedChange={() => toggleEmployeeSelection(employee.id)}
                      disabled={employee.hasLicense}
                    />
                    <div>
                      <p className="font-medium">{employee.full_name}</p>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={employee.hasLicense ? "default" : "outline"}>
                      {employee.hasLicense ? `Licensed (${employee.license_access_level})` : 'No License'}
                    </Badge>
                    {employee.hasLicense && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeLicense(employee.id)}
                        disabled={isLoading}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {filteredEmployees.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No employees found matching your search.' : 'No employees found.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}