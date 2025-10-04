import { useAuth } from "../../lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  onMobileMenuToggle: () => void;
}

export default function Navbar({ onMobileMenuToggle }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2"
              data-testid="button-mobile-menu"
            >
              <i className="bi bi-list text-xl"></i>
            </Button>
            <div className="flex-shrink-0 flex items-center mr-4">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <span className="mr-2 text-xl font-bold text-foreground">Sokany</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <ThemeToggle variant="button" size="sm" />
            
            <div className="relative">
              <Button variant="ghost" size="sm" className="p-2" data-testid="button-notifications">
                <i className="bi bi-bell text-lg"></i>
                <span className="notification-badge">3</span>
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 space-x-reverse p-2" data-testid="button-user-menu">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <i className="bi bi-person text-primary-foreground"></i>
                  </div>
                  <span className="hidden md:block font-medium">{user?.fullName || "المستخدم"}</span>
                  <i className="bi bi-chevron-down text-sm"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem data-testid="menu-profile">
                  <i className="bi bi-person w-4 h-4 ml-2"></i>
                  الملف الشخصي
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-settings">
                  <i className="bi bi-gear w-4 h-4 ml-2"></i>
                  الإعدادات
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive" data-testid="menu-logout">
                  <i className="bi bi-box-arrow-left w-4 h-4 ml-2"></i>
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
