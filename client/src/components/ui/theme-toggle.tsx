import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown' | 'cards';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ 
  variant = 'dropdown', 
  size = 'default',
  showLabel = false,
  className = ''
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', label: 'فاتح', icon: Sun },
    { value: 'dark', label: 'داكن', icon: Moon },
    { value: 'system', label: 'النظام', icon: Monitor },
  ];

  // Simple button toggle (Light/Dark only)
  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className={className}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {showLabel && (
          <span className="mr-2">
            {theme === 'dark' ? 'فاتح' : 'داكن'}
          </span>
        )}
      </Button>
    );
  }

  // Dropdown with all options
  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size={size} className={className}>
            {theme === 'light' && <Sun className="h-4 w-4" />}
            {theme === 'dark' && <Moon className="h-4 w-4" />}
            {theme === 'system' && <Monitor className="h-4 w-4" />}
            {showLabel && <span className="mr-2">التيم</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            return (
              <DropdownMenuItem
                key={themeOption.value}
                onClick={() => setTheme(themeOption.value as any)}
                className={theme === themeOption.value ? 'bg-accent' : ''}
              >
                <Icon className="mr-2 h-4 w-4" />
                {themeOption.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Cards layout for settings pages
  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-3 gap-3 ${className}`}>
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;
          
          return (
            <button
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value as any)}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200
                ${isActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
                }
                ${themeOption.value === 'light' ? 'bg-white text-gray-900' : ''}
                ${themeOption.value === 'dark' ? 'bg-gray-900 text-white' : ''}
                ${themeOption.value === 'system' ? 'bg-gradient-to-br from-white to-gray-900 text-gray-700' : ''}
              `}
            >
              <div className="flex flex-col items-center space-y-2">
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{themeOption.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}