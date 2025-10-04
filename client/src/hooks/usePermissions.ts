import { useAuth } from '@/lib/auth';
import { canCreate, canRead, canUpdate, canDelete, canAccessPage } from '@/lib/permissions';

interface UsePermissionsOptions {
  resource: string;
  page?: string;
}

export function usePermissions(options: UsePermissionsOptions) {
  const { user } = useAuth();

  const permissions = {
    canCreate: user ? canCreate(user.role, options.resource) : false,
    canRead: user ? canRead(user.role, options.resource) : false,
    canUpdate: user ? canUpdate(user.role, options.resource) : false,
    canDelete: user ? canDelete(user.role, options.resource) : false,
    canAccessPage: options.page && user ? canAccessPage(user.role, options.page) : true,
  };

  return {
    ...permissions,
    user,
    
    // Convenience methods
    canManage: permissions.canCreate && permissions.canUpdate && permissions.canDelete,
    canView: permissions.canRead,
    hasAnyPermission: Object.values(permissions).some(Boolean),
    hasAllPermissions: Object.values(permissions).every(Boolean),
  };
}