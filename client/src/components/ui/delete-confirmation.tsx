import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  itemName?: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteConfirmation({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  onConfirm,
  loading = false
}: DeleteConfirmationProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600 flex items-center gap-2">
            <i className="bi bi-exclamation-triangle"></i>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right">
            {description}
            {itemName && (
              <div className="mt-2 p-3 bg-muted rounded border border-destructive/20">
                <strong>{itemName}</strong>
              </div>
            )}
            <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
              <i className="bi bi-info-circle mr-1"></i>
              تحذير: هذا الإجراء لا يمكن التراجع عنه!
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner mr-2"></div>
                جاري الحذف...
              </>
            ) : (
              <>
                <i className="bi bi-trash mr-2"></i>
                تأكيد الحذف
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}