import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

// Loading Button Component
interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export function LoadingButton({
  children,
  isLoading = false,
  loadingText = 'جاري التحميل...',
  icon,
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      {...props}
      disabled={isLoading || disabled}
      className={`flex items-center justify-center ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </Button>
  );
}

// Status Badge Component
interface StatusBadgeProps extends Omit<BadgeProps, 'children'> {
  status: 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled' | 'in_progress' | 'draft';
  customLabel?: string;
}

export function StatusBadge({ status, customLabel, className, ...props }: StatusBadgeProps) {
  const statusConfig = {
    active: { label: 'نشط', variant: 'default', color: 'bg-green-500' },
    inactive: { label: 'غير نشط', variant: 'secondary', color: 'bg-gray-500' },
    pending: { label: 'في الانتظار', variant: 'secondary', color: 'bg-yellow-500' },
    approved: { label: 'موافق عليه', variant: 'default', color: 'bg-green-500' },
    rejected: { label: 'مرفوض', variant: 'destructive', color: 'bg-red-500' },
    completed: { label: 'مكتمل', variant: 'default', color: 'bg-blue-500' },
    cancelled: { label: 'ملغي', variant: 'secondary', color: 'bg-gray-500' },
    in_progress: { label: 'قيد التنفيذ', variant: 'secondary', color: 'bg-orange-500' },
    draft: { label: 'مسودة', variant: 'outline', color: 'bg-gray-300' }
  } as const;

  const config = statusConfig[status] || statusConfig.inactive;
  
  return (
    <Badge
      {...props}
      variant={config.variant as any}
      className={`${config.color} text-white ${className}`}
    >
      {customLabel || config.label}
    </Badge>
  );
}

// Loading State Component
interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'skeleton' | 'card';
}

export function LoadingState({ 
  message = 'جاري التحميل...', 
  size = 'md',
  variant = 'spinner' 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  if (variant === 'skeleton') {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className={`${sizeClasses[size]} animate-spin`} />
            <span className="text-muted-foreground">{message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-center py-4">
      <div className="flex items-center gap-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin`} />
        <span className="text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ 
  title, 
  description, 
  icon = <XCircle className="w-12 h-12 text-muted-foreground" />,
  action 
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="mb-4">{icon}</div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            {description}
          </p>
        )}
        {action && action}
      </CardContent>
    </Card>
  );
}

// Error State Component
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ 
  title = 'حدث خطأ',
  message, 
  onRetry,
  retryLabel = 'إعادة المحاولة' 
}: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <strong>{title}</strong>
          <p className="mt-1">{message}</p>
        </div>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="ml-4"
          >
            {retryLabel}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Success State Component
interface SuccessStateProps {
  title?: string;
  message: string;
  onClose?: () => void;
}

export function SuccessState({ 
  title = 'تم بنجاح',
  message, 
  onClose 
}: SuccessStateProps) {
  return (
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="flex items-center justify-between text-green-800">
        <div>
          <strong>{title}</strong>
          <p className="mt-1">{message}</p>
        </div>
        {onClose && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="ml-4 text-green-800 hover:bg-green-100"
          >
            إغلاق
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Progress State Component
interface ProgressStateProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
}

export function ProgressState({ 
  value, 
  max, 
  label,
  showPercentage = true 
}: ProgressStateProps) {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          {showPercentage && <span>{percentage}%</span>}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {value} من {max}
      </div>
    </div>
  );
}