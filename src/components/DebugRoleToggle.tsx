import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import { useDebug, type Customer } from '@/contexts/DebugContext';
import { UserRole, AppRole } from '@/lib/roles';
import { supabase } from '@/integrations/supabase/client';

const DEBUG_ROLES: { label: string; role: UserRole }[] = [
  {
    label: 'Client Admin',
    role: {
      role: 'admin' as AppRole,
      source: 'product_license_assignments',
      isRaynAdmin: false,
      isClientAdmin: true,
      customer_id: 'debug-customer-id'
    }
  },
  {
    label: 'Moderator',
    role: {
      role: 'moderator' as AppRole,
      source: 'product_license_assignments',
      isRaynAdmin: false,
      isClientAdmin: false,
      customer_id: 'debug-customer-id'
    }
  },
  {
    label: 'User',
    role: {
      role: 'user' as AppRole,
      source: 'default',
      isRaynAdmin: false,
      isClientAdmin: false,
      customer_id: 'debug-customer-id'
    }
  }
];

export function DebugRoleToggle() {
  const { debugRole, setDebugRole, selectedCustomer, setSelectedCustomer, isDebugMode } = useDebug();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Fetch customers when component mounts
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, customer_name, short_name')
          .eq('is_active', true)
          .order('customer_name');
        
        if (error) throw error;
        setCustomers(data || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleRoleChange = (value: string) => {
    if (value === 'none') {
      setDebugRole(null);
      setSelectedCustomer(null);
    } else {
      const selectedRole = DEBUG_ROLES.find(r => r.label === value);
      if (selectedRole) {
        // Create role with selected customer_id if it's a client role
        const roleWithCustomer = {
          ...selectedRole.role,
          customer_id: selectedRole.role.isClientAdmin || selectedRole.role.role === 'moderator' || selectedRole.role.role === 'user' 
            ? selectedCustomer?.id || customers[0]?.id 
            : undefined
        };
        setDebugRole(roleWithCustomer);
        
        // Auto-select first customer if none selected and role requires customer
        if (!selectedCustomer && (selectedRole.role.isClientAdmin || selectedRole.role.role === 'moderator' || selectedRole.role.role === 'user')) {
          setSelectedCustomer(customers[0] || null);
        }
      }
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
    
    // Update debug role with new customer_id
    if (debugRole && customer) {
      setDebugRole({
        ...debugRole,
        customer_id: customer.id
      });
    }
  };

  const requiresCustomer = debugRole && (debugRole.isClientAdmin || debugRole.role === 'moderator' || debugRole.role === 'user');

  return (
    <div className="flex items-center gap-3">
      {isDebugMode && (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Eye className="h-3 w-3 mr-1" />
          Debug Mode
          {selectedCustomer && (
            <span className="ml-1 text-xs">({selectedCustomer.short_name})</span>
          )}
        </Badge>
      )}
      
      <div className="flex items-center gap-2">
        <Select 
          value={isDebugMode ? DEBUG_ROLES.find(r => r.role.role === debugRole?.role)?.label || 'none' : 'none'} 
          onValueChange={handleRoleChange}
        >
          <SelectTrigger className="w-40 h-8">
            <SelectValue placeholder="Preview as..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex items-center gap-2">
                <EyeOff className="h-3 w-3" />
                Normal View
              </div>
            </SelectItem>
            {DEBUG_ROLES.map(({ label }) => (
              <SelectItem key={label} value={label}>
                <div className="flex items-center gap-2">
                  <Eye className="h-3 w-3" />
                  {label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {requiresCustomer && (
          <Select 
            value={selectedCustomer?.id || ''} 
            onValueChange={handleCustomerChange}
            disabled={loadingCustomers}
          >
            <SelectTrigger className="w-48 h-8">
              <SelectValue placeholder={loadingCustomers ? "Loading..." : "Select organization..."} />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3" />
                    <div className="flex flex-col">
                      <span className="text-sm">{customer.customer_name}</span>
                      <span className="text-xs text-muted-foreground">{customer.short_name}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}