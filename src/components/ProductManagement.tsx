import { useState, useEffect } from 'react';
import { Plus, Upload, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ProductList } from './products/ProductList';
import { ProductForm } from './products/ProductForm';
import { CategoryManagement } from './products/CategoryManagement';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity-logger';
import { showSuccessToast, showErrorToast, showLoadingToast } from '@/lib/toast-utils';
import { toast } from 'sonner';
import Papa from 'papaparse';
import type { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Manufacturer = Database['public']['Tables']['manufacturers']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    loadManufacturers();
    loadProducts();
    loadCategories();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('product_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadProducts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        loadCategories();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, manufacturer:manufacturer_id(*), category:category_id(*)')
        .order('name');
      
      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      showErrorToast('product', 'read', error);
    }
  };

  const loadManufacturers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('manufacturers').select('*');
      if (error) throw error;
      if (data) setManufacturers(data);
    } catch (error) {
      showErrorToast('manufacturer', 'read', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      showErrorToast('category', 'read', error);
    }
  };

  const findOrCreateManufacturer = async (name: string) => {
    if (!name) return null;
    
    try {
      // Try to find existing manufacturer
      const { data: existing } = await supabase
        .from('manufacturers')
        .select('id')
        .ilike('factory_name', name)
        .single();

      if (existing) return existing.id;

      // Create new manufacturer if not found
      const { data: created, error } = await supabase
        .from('manufacturers')
        .insert([{ factory_name: name }])
        .select('id')
        .single();

      if (error) throw error;
      return created?.id || null;
    } catch (error) {
      console.error('Error handling manufacturer:', error);
      return null;
    }
  };

  const findOrCreateCategory = async (name: string) => {
    if (!name) return null;
    
    try {
      // Try to find existing category
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', name)
        .single();

      if (existing) return existing.id;

      // Create new category if not found
      const { data: created, error } = await supabase
        .from('categories')
        .insert([{ name }])
        .select('id')
        .single();

      if (error) throw error;
      return created?.id || null;
    } catch (error) {
      console.error('Error handling category:', error);
      return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const loadingToast = showLoadingToast('product', 'create');
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const productsToUpsert = await Promise.all(
            results.data.map(async (row: any) => {
              // Get or create manufacturer and category
              const manufacturerId = await findOrCreateManufacturer(row.Manufacturer);
              const categoryId = await findOrCreateCategory(row.Category);

              return {
                model_no: row['Model No'],
                name: row.Name,
                description: row.Description,
                manufacturer_id: manufacturerId,
                category_id: categoryId,
                price: parseFloat(row.Price) || 0,
                total_stock: parseInt(row['Total Stock']) || 0,
                bad_stock: parseInt(row['Bad Stock']) || 0,
                dead_stock: parseInt(row['Dead Stock']) || 0,
                remarks: row.Remarks,
                internal_notes: row['Internal Notes'],
                size: row.Size,
                finish: row.Finish
              };
            })
          );

          // Filter out invalid entries
          const validProducts = productsToUpsert.filter(p => p.model_no && p.name);

          if (validProducts.length === 0) {
            throw new Error('No valid products found in CSV');
          }

          // Upsert products based on model_no
          const { error } = await supabase
            .from('products')
            .upsert(validProducts, {
              onConflict: 'model_no'
            });

          if (error) throw error;

          await logActivity({
            action_type: 'create',
            entity_type: 'products',
            entity_id: validProducts[0].model_no,
            description: `Imported ${validProducts.length} products via CSV`,
            metadata: { products: validProducts }
          });
          
          toast.dismiss(loadingToast);
          toast.success(`Successfully imported ${validProducts.length} products`);
          await loadProducts();
        } catch (error: any) {
          toast.dismiss(loadingToast);
          toast.error(`Import failed: ${error.message}`);
        }
      },
      error: (error) => {
        toast.dismiss(loadingToast);
        toast.error(`CSV parsing failed: ${error.message}`);
      }
    });

    // Reset file input
    event.target.value = '';
  };

  const checkActiveBookings = async (productId: string): Promise<boolean> => {
    const { data: bookings, error } = await supabase
      .from('booking_items')
      .select('booking_id')
      .eq('product_id', productId)
      .limit(1);

    if (error) {
      console.error('Error checking bookings:', error);
      return false;
    }

    return bookings && bookings.length > 0;
  };

  const handleDelete = async (id: string) => {
    const loadingToast = showLoadingToast('product', 'delete');
    
    try {
      // Check for active bookings
      const hasActiveBookings = await checkActiveBookings(id);
      
      if (hasActiveBookings) {
        toast.dismiss(loadingToast);
        toast.error('Cannot delete product with active bookings');
        return;
      }

      const { data: deletedProduct, error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (deletedProduct) {
        await logActivity({
          action_type: 'delete',
          entity_type: 'product',
          entity_id: id,
          description: `Deleted product ${deletedProduct.name} (${deletedProduct.model_no})`,
          metadata: deletedProduct
        });
        
        toast.dismiss(loadingToast);
        showSuccessToast('product', 'delete');
        setProductToDelete(null);
        await loadProducts();

        // Update UI components
        window.dispatchEvent(new CustomEvent('productDeleted', { 
          detail: { productId: id }
        }));
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      showErrorToast('product', 'delete', error);
    }
  };

  const handleSubmit = async (data: Partial<Product>) => {
    const loadingToast = showLoadingToast('product', editingProduct ? 'update' : 'create');
    
    try {
      if (editingProduct) {
        const { data: updatedProduct, error } = await supabase
          .from('products')
          .update(data)
          .eq('id', editingProduct.id)
          .select()
          .single();
        
        if (error) throw error;

        if (updatedProduct) {
          await logActivity({
            action_type: 'update',
            entity_type: 'product',
            entity_id: editingProduct.id,
            description: `Updated product ${updatedProduct.name} (${updatedProduct.model_no})`,
            metadata: {
              before: editingProduct,
              after: updatedProduct,
              changes: Object.entries(data).reduce((acc, [key, value]) => {
                if (editingProduct[key as keyof Product] !== value) {
                  acc[key] = {
                    from: editingProduct[key as keyof Product],
                    to: value
                  };
                }
                return acc;
              }, {} as Record<string, any>)
            }
          });
          
          toast.dismiss(loadingToast);
          showSuccessToast('product', 'update');
          setIsDialogOpen(false);
          setEditingProduct(null);

          await loadProducts();

          // Update UI components
          window.dispatchEvent(new CustomEvent('productUpdated', { 
            detail: { product: updatedProduct }
          }));
        }
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert([data])
          .select()
          .single();

        if (error) throw error;

        if (newProduct) {
          await logActivity({
            action_type: 'create',
            entity_type: 'product',
            entity_id: newProduct.id,
            description: `Created new product ${newProduct.name} (${newProduct.model_no})`,
            metadata: newProduct
          });
          
          toast.dismiss(loadingToast);
          showSuccessToast('product', 'create');
          setIsDialogOpen(false);
          await loadProducts();

          // Update UI components
          window.dispatchEvent(new CustomEvent('productCreated', { 
            detail: { product: newProduct }
          }));
        }
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      showErrorToast('product', editingProduct ? 'update' : 'create', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    const exportData = products.map(product => ({
      'Model No': product.model_no,
      'Name': product.name,
      'Description': product.description || '',
      'Category': product.category?.name || '',
      'Manufacturer': product.manufacturer?.factory_name || '',
      'Price': product.price || 0,
      'Total Stock': product.total_stock || 0,
      'Available Stock': product.available_stock || 0,
      'Bad Stock': product.bad_stock || 0,
      'Dead Stock': product.dead_stock || 0,
      'Bookings': product.bookings || 0,
      'Remarks': product.remarks || '',
      'Internal Notes': product.internal_notes || '',
      'Size': product.size || '',
      'Finish': product.finish || '',
      'Created At': product.created_at || '',
      'Updated At': product.updated_at || ''
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Upload className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('csvUpload')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <input
            id="csvUpload"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
            <ListFilter className="w-4 h-4 mr-2" />
            Manage Categories
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingProduct(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <ProductForm
                product={editingProduct || undefined}
                manufacturers={manufacturers}
                categories={categories}
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ProductList 
        products={products}
        onEdit={handleEdit} 
        onDelete={(product) => setProductToDelete(product)} 
      />

      <CategoryManagement
        isOpen={isCategoryDialogOpen}
        onClose={() => setIsCategoryDialogOpen(false)}
      />

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              "{productToDelete?.name}" and remove it from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => productToDelete && handleDelete(productToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}