import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Save, Plus } from 'lucide-react';

interface ReusableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  showFooter?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function ReusableDialog({
  open,
  onOpenChange,
  title,
  children,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false,
  submitLabel,
  cancelLabel = 'إلغاء',
  showFooter = true,
  maxWidth = 'md'
}: ReusableDialogProps) {
  
  const defaultSubmitLabel = isEditing ? 'تحديث' : 'إضافة';
  const finalSubmitLabel = submitLabel || defaultSubmitLabel;
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  const maxWidthClasses = {
    sm: 'sm:max-w-[425px]',
    md: 'sm:max-w-[600px]',
    lg: 'sm:max-w-[800px]',
    xl: 'sm:max-w-[1000px]',
    '2xl': 'sm:max-w-[1200px]'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle className="text-right">{title}</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="max-h-[60vh] overflow-y-auto px-1">
            {children}
          </div>
          
          {showFooter && (
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {cancelLabel}
              </Button>
              {onSubmit && (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      جاري الحفظ...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      {finalSubmitLabel}
                    </div>
                  )}
                </Button>
              )}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Trigger button component for adding new items
interface AddButtonProps {
  onClick: () => void;
  children?: React.ReactNode;
  label?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function AddButton({ 
  onClick, 
  children, 
  label = 'إضافة جديد',
  icon = <Plus className="w-4 h-4 mr-2" />,
  variant = 'default',
  size = 'md'
}: AddButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      className="flex items-center"
    >
      {icon}
      {children || label}
    </Button>
  );
}