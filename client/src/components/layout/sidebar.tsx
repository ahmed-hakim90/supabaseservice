import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../lib/auth";
import { canAccessPage } from "../../lib/permissions";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { id: "dashboard", path: "/dashboard", icon: "bi-speedometer2", label: "لوحة التحكم" },
  { id: "unified", path: "/dashboard/unified", icon: "bi-speedometer", label: "الإدارة الموحدة المطورة" },
  { id: "management", path: "/dashboard/management", icon: "bi-grid-3x3-gap", label: "الإدارة الموحدة" },
  { id: "user-management", path: "/dashboard/user-management", icon: "bi-people-fill", label: "إدارة المستخدمين" },
  { id: "users", path: "/dashboard/users", icon: "bi-people", label: "المستخدمين" },
  // { id: "user-approvals", path: "/dashboard/user-approvals", icon: "bi-check-circle", label: "الموافقات" },
  { id: "roles", path: "/dashboard/roles", icon: "bi-shield-check", label: "الأدوار والصلاحيات" },
  { id: "centers", path: "/dashboard/centers", icon: "bi-building", label: "مراكز الخدمة" },
  { id: "warehouse-management", path: "/dashboard/warehouse-management", icon: "bi-buildings", label: "إدارة المخازن والمخزون" },
  { id: "warehouse-permissions", path: "/dashboard/warehouse-permissions", icon: "bi-clipboard-check", label: "أذونات المخزن" },
  { id: "warehouses", path: "/dashboard/warehouses", icon: "bi-shop", label: "المخازن" },
  { id: "inventory", path: "/dashboard/inventory", icon: "bi-box-seam", label: "المخزون" },
  { id: "products-management", path: "/dashboard/products-management", icon: "bi-box", label: "إدارة المنتجات وقطع الغيار" },
  { id: "spare-parts-management", path: "/dashboard/spare-parts-management", icon: "bi-gear", label: "قطع الغيار" },
  { id: "test-spare-parts", path: "/dashboard/test-spare-parts", icon: "bi-tools", label: "اختبار قطع الغيار" },
  { id: "quick-sale", path: "/dashboard/quick-sale", icon: "bi-cart-plus", label: "بيع سريع" },
  { id: "customers", path: "/dashboard/customers", icon: "bi-person-badge", label: "العملاء" },
  // { id: "categories", path: "/dashboard/categories", icon: "bi-diagram-3", label: "الفئات والمنتجات" },
  { id: "service-requests", path: "/dashboard/service-requests", icon: "bi-tools", label: "طلبات الصيانة" },
  { id: "transfers", path: "/dashboard/transfers", icon: "bi-arrow-left-right", label: "تحويل قطع الغيار" },
  { id: "reports", path: "/dashboard/reports", icon: "bi-graph-up", label: "التقارير" },
  { id: "activities", path: "/dashboard/activities", icon: "bi-activity", label: "سجل الأنشطة" },
  { id: "data-management", path: "/dashboard/data-management", icon: "bi-database", label: "إدارة البيانات" },
  { id: "system-admin", path: "/dashboard/system-admin", icon: "bi-cpu", label: "إدارة النظام" },
  { id: "settings", path: "/dashboard/settings", icon: "bi-gear", label: "الإعدادات" },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const handleNavigation = (path: string) => {
    setLocation(path);
    onClose();
  };

  // Filter menu items based on user role
  const allowedMenuItems = menuItems.filter(item => {
    if (!user) return false;
    return canAccessPage(user.role, item.id);
  });

  return (
    <div className={`sidebar fixed right-0 top-16 h-[calc(100vh-4rem)] w-64 bg-card border-l border-border overflow-y-auto transition-transform duration-300 ease-in-out lg:translate-x-0 z-30 ${isOpen ? 'open' : ''}`}>
      <div className="p-4">
        <nav className="space-y-2">
          {allowedMenuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`sidebar-link w-full justify-start text-right  ${location === item.path ? 'active' : ''}`}
              onClick={() => handleNavigation(item.path)}
              data-testid={`nav-${item.id}`}
            >
              <i className={`bi ${item.icon} w-5 h-5 ml-3`}></i>
              <span>{item.label}</span>
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
}
