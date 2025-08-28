import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import { useDebug } from '@/contexts/DebugContext';
import { UserRole, AppRole } from '@/lib/roles';

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
    label: 'Manager',
    role: {
      role: 'manager' as AppRole,
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
      isClientAdmin: false
    }
  }
];

export function DebugRoleToggle() {
  const { debugRole, setDebugRole, isDebugMode } = useDebug();

  const handleRoleChange = (value: string) => {
    if (value === 'none') {
      setDebugRole(null);
    } else {
      const selectedRole = DEBUG_ROLES.find(r => r.label === value);
      if (selectedRole) {
        setDebugRole(selectedRole.role);
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      {isDebugMode && (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Eye className="h-3 w-3 mr-1" />
          Debug Mode
        </Badge>
      )}
      
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
    </div>
  );
}