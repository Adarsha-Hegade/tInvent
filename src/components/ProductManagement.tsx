import { useState, useEffect } from 'react';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ProductList } from './products/ProductList';
import { ProductForm } from './products/ProductForm';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity-logger';
import { showSuccessToast, showErrorToast, showLoadingToast } from '@/lib/toast-utils';
import { toast } from 'sonner';
import Papa from 'papaparse';
import type { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Manufacturer = Database['public']['Tables']['manufacturers']['Row'];

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    loadManufacturers();
    loadProducts();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('product_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadProducts();
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
        .select('*, manufacturer:manufacturer_id(*)')
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const loadingToast = showLoadingToast('product', 'create');
      
      Papa.parse(file, {
        complete: async (results) => {
          try {
            const products = results.data.slice(1).map((row: any) => ({
              model_no: row[0],
              name: row[1],
              description: row[2],
              manufacturer_id: row[3],
              remarks: row[4],
              internal_notes: row[5],
              total_stock: parseInt(row[6]),
              bad_stock: parseInt(row[7]),
              dead_stock: parseInt(row[8]),
            }));

            const { data: newProducts, error } = await supabase
              .from('products')
              .insert(products)
              .select();

            if (error) throw error;

            if (newProducts) {
              await logActivity({
                action_type: 'create',
                entity_type: 'products',
                entity_id: newProducts[0].id,
                description: `Imported ${newProducts.length} products via CSV`,
                metadata: { products: newProducts }
              });
              
              toast.dismiss(loadingToast);
              showSuccessToast('product', 'create');
              await loadProducts();
            }
          } catch (error) {
            toast.dismiss(loadingToast);
            showErrorToast('product', 'create', error);
          }
        },
        header: true,
      });
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

  const handleDelete = async (id: string) => {
    const loadingToast = showLoadingToast('product', 'delete');
    
    try {
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
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      showErrorToast('product', 'delete', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <div className="flex gap-2">
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