// Permission system for role-based access control

export type UserRole = "admin" | "manager" | "technician" | "receptionist" | "warehouse_manager" | "customer";

export interface Permission {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

// Define what each role can access
export const rolePermissions: Record<UserRole, Record<string, Permission>> = {
  admin: {
    // Admin has full access to everything
    dashboard: { read: true, create: true, update: true, delete: true },
    users: { read: true, create: true, update: true, delete: true },
    userApprovals: { read: true, create: true, update: true, delete: true },
    roles: { read: true, create: true, update: true, delete: true },
    centers: { read: true, create: true, update: true, delete: true },
    warehouses: { read: true, create: true, update: true, delete: true },
    inventory: { read: true, create: true, update: true, delete: true },
    spareParts: { read: true, create: true, update: true, delete: true },
    customers: { read: true, create: true, update: true, delete: true },
    categories: { read: true, create: true, update: true, delete: true },
    serviceRequests: { read: true, create: true, update: true, delete: true },
    transfers: { read: true, create: true, update: true, delete: true },
    reports: { read: true, create: true, update: true, delete: true },
    activities: { read: true, create: true, update: true, delete: true },
    dataManagement: { read: true, create: true, update: true, delete: true },
    settings: { read: true, create: true, update: true, delete: true },
  },

  manager: {
    // Manager can access their center's data only
    dashboard: { read: true, create: false, update: false, delete: false },
    users: { read: true, create: true, update: true, delete: false }, // Can approve users for their center
    userApprovals: { read: true, create: true, update: true, delete: false }, // Can approve users
    inventory: { read: true, create: true, update: true, delete: false }, // Their center's warehouses only
    spareParts: { read: true, create: true, update: true, delete: true }, // Can manage spare parts
    customers: { read: true, create: true, update: true, delete: false }, // Their center only
    categories: { read: true, create: true, update: true, delete: false },
    serviceRequests: { read: true, create: true, update: true, delete: false }, // Their center only
    transfers: { read: true, create: true, update: false, delete: false }, // Can only request TO their warehouse
    reports: { read: true, create: false, update: false, delete: false }, // Their center only
    activities: { read: true, create: false, update: false, delete: false }, // Their center only
  },

  technician: {
    // Technician can only see assigned service requests and add follow-ups
    serviceRequests: { read: true, create: false, update: false, delete: false }, // Only assigned to them
    serviceRequestFollowUps: { read: true, create: true, update: false, delete: false }, // Can add follow-ups only
    spareParts: { read: true, create: false, update: false, delete: false }, // Can view spare parts
    customers: { read: true, create: false, update: false, delete: false }, // Related to their requests
    categories: { read: true, create: false, update: false, delete: false }, // For reference
  },

  receptionist: {
    // Receptionist handles customers and can view service requests
    dashboard: { read: true, create: false, update: false, delete: false },
    customers: { read: true, create: true, update: true, delete: false },
    serviceRequests: { read: true, create: true, update: false, delete: false }, // Their center only
    categories: { read: true, create: false, update: false, delete: false },
  },

  warehouse_manager: {
    // Warehouse manager handles inventory and transfers
    dashboard: { read: true, create: false, update: false, delete: false },
    warehouses: { read: true, create: false, update: true, delete: false }, // Their warehouse only
    inventory: { read: true, create: true, update: true, delete: false }, // Their warehouse inventory
    categories: { read: true, create: true, update: true, delete: false }, // For spare parts
    transfers: { read: true, create: true, update: true, delete: false }, // Their warehouse only
    reports: { read: true, create: false, update: false, delete: false }, // Inventory reports only
  },

  customer: {
    // Customer can only see their own service requests
    serviceRequests: { read: true, create: true, update: false, delete: false }, // Their own only
  }
};

// Define which pages each role can access
export const rolePageAccess: Record<UserRole, string[]> = {
  admin: [
    "dashboard", "user-management", "users", "user-approvals", "roles", "centers", "warehouse-management",
    "products-management", "spare-parts-management", "customers", "categories", "service-requests", "transfers",
    "reports", "activities", "data-management", "settings"
  ],
  manager: [
    "dashboard", "user-management", "users", "user-approvals", "warehouse-management", "products-management", "spare-parts-management", "customers",
    "categories", "service-requests", "transfers", "reports", "activities"
  ],
  technician: [
    "dashboard", "service-requests"
  ],
  receptionist: [
    "dashboard", "customers", "service-requests", "categories"
  ],
  warehouse_manager: [
    "dashboard", "warehouse-management", "products-management", "spare-parts-management", "categories", "transfers", "reports"
  ],
  customer: [
    "service-requests"
  ]
};

export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: keyof Permission
): boolean {
  const permissions = rolePermissions[userRole];
  if (!permissions || !permissions[resource]) {
    return false;
  }
  return permissions[resource][action];
}

export function canAccessPage(userRole: UserRole, page: string): boolean {
  return rolePageAccess[userRole].includes(page);
}

export function getAccessiblePages(userRole: UserRole): string[] {
  return rolePageAccess[userRole];
}

// Helper functions for specific permissions
export function canRead(userRole: UserRole, resource: string): boolean {
  return hasPermission(userRole, resource, 'read');
}

export function canCreate(userRole: UserRole, resource: string): boolean {
  return hasPermission(userRole, resource, 'create');
}

export function canUpdate(userRole: UserRole, resource: string): boolean {
  return hasPermission(userRole, resource, 'update');
}

export function canDelete(userRole: UserRole, resource: string): boolean {
  return hasPermission(userRole, resource, 'delete');
}