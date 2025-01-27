import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity-logger';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategoryFormData {
  name: string;
  description?: string;
}

interface CategoryManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryManagement({ isOpen, onClose }: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm<CategoryFormData>();

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to load categories');
      return;
    }

    if (data) {
      setCategories(data);
    }
  };

  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(data)
          .eq('id', editingCategory.id);

        if (error) throw error;

        await logActivity({
          action_type: 'update',
          entity_type: 'category',
          entity_id: editingCategory.id,
          description: `Updated category ${data.name}`,
          metadata: { before: editingCategory, after: data }
        });

        toast.success('Category updated successfully');
      } else {
        const { data: newCategory, error } = await supabase
          .from('categories')
          .insert([data])
          .select()
          .single();

        if (error) throw error;

        if (newCategory) {
          await logActivity({
            action_type: 'create',
            entity_type: 'category',
            entity_id: newCategory.id,
            description: `Created new category ${newCategory.name}`,
            metadata: newCategory
          });
        }

        toast.success('Category created successfully');
      }

      await loadCategories();
      setIsFormOpen(false);
      setEditingCategory(null);
      reset();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setValue('name', category.name);
    setValue('description', category.description || '');
    setIsFormOpen(true);
  };

  const handleDelete = async (category: Category) => {
    try {
      // Check if category is in use
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);

      if (countError) throw countError;

      if (count && count > 0) {
        toast.error(`Cannot delete category. ${count} products are using this category.`);
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      await logActivity({
        action_type: 'delete',
        entity_type: 'category',
        entity_id: category.id,
        description: `Deleted category ${category.name}`,
        metadata: category
      });

      toast.success('Category deleted successfully');
      await loadCategories();
      setCategoryToDelete(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Category Management</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Dialog open={isFormOpen} onOpenChange={(open) => {
              setIsFormOpen(open);
              if (!open) {
                setEditingCategory(null);
                reset();
              }
            }}>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label>Name</label>
                      <Input {...register('name')} required />
                    </div>
                    <div className="space-y-2">
                      <label>Description</label>
                      <Textarea {...register('description')} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCategoryToDelete(category)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>

      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{categoryToDelete?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => categoryToDelete && handleDelete(categoryToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}