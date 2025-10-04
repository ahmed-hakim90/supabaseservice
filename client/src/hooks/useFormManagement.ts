import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiPost, apiPut, apiDelete } from '@/lib/db';

interface UseFormManagementOptions<T, InsertT, UpdateT = Partial<T>> {
  queryKey: string[];
  apiEndpoint: string;
  successMessages: {
    create: string;
    update: string;
    delete: string;
  };
  errorMessages: {
    create: string;
    update: string;
    delete: string;
  };
  initialFormData?: Partial<InsertT>;
}

export function useFormManagement<T extends { id: string }, InsertT, UpdateT = Partial<T>>(
  options: UseFormManagementOptions<T, InsertT, UpdateT>
) {
  const [formData, setFormData] = useState<Partial<InsertT>>(options.initialFormData || {});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: InsertT) => apiPost(options.apiEndpoint, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey });
      setIsAddDialogOpen(false);
      setFormData(options.initialFormData || {});
      toast({ title: options.successMessages.create });
    },
    onError: (error: any) => {
      toast({
        title: options.errorMessages.create,
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateT }) => 
      apiPut(`${options.apiEndpoint}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey });
      setEditingItem(null);
      setFormData(options.initialFormData || {});
      setIsAddDialogOpen(false);
      toast({ title: options.successMessages.update });
    },
    onError: (error: any) => {
      toast({
        title: options.errorMessages.update,
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`${options.apiEndpoint}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey });
      toast({ title: options.successMessages.delete });
    },
    onError: (error: any) => {
      toast({
        title: options.errorMessages.delete,
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const openAddDialog = () => {
    setEditingItem(null);
    setFormData(options.initialFormData || {});
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (item: T) => {
    setEditingItem(item);
    setFormData(item as any);
    setIsAddDialogOpen(true);
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setEditingItem(null);
    setFormData(options.initialFormData || {});
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (editingItem) {
      updateMutation.mutate({ 
        id: editingItem.id, 
        data: formData as UpdateT 
      });
    } else {
      createMutation.mutate(formData as InsertT);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      deleteMutation.mutate(id);
    }
  };

  return {
    // State
    formData,
    setFormData,
    isAddDialogOpen,
    setIsAddDialogOpen,
    editingItem,
    setEditingItem,

    // Mutations
    createMutation,
    updateMutation,
    deleteMutation,

    // Helper functions
    openAddDialog,
    openEditDialog,
    closeDialog,
    handleSubmit,
    handleDelete,

    // Computed values
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    isEditing: editingItem !== null,
  };
}