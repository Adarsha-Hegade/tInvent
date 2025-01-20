import { useState, useEffect } from 'react';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProductList } from './products/ProductList';
import { ProductForm } from './products/ProductForm';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity-logger';
import Papa from 'papaparse';
import type { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Manufacturer = Database['public']['Tables']['manufacturers']['Row'];

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadManufacturers();
  }, []);

  const loadManufacturers = async () => {
    const { data } = await supabase.from('manufacturers').select('*');
    if (data) setManufacturers(data);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: async (results) => {
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

          if (!error && newProducts) {
            await logActivity({
              action_type: 'create',
              entity_type: 'products',
              entity_id: newProducts[0].id,
              description: `Imported ${newProducts.length} products via CSV`,
              metadata: { products: newProducts }
            });
          }
        },
        header: true,
      });
    }
  };

  const handleSubmit = async (data: Partial<Product>) => {
    try {
      if (editingProduct) {
        const { data: updatedProduct, error } = await supabase
          .from('products')
          .update(data)
          .eq('id', editingProduct.id)
          .select()
          .single();
        
        if (!error && updatedProduct) {
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
          setIsDialogOpen(false);
          setEditingProduct(null);
        }
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert([data])
          .select()
          .single();

        if (!error && newProduct) {
          await logActivity({
            action_type: 'create',
            entity_type: 'product',
            entity_id: newProduct.id,
            description: `Created new product ${newProduct.name} (${newProduct.model_no})`,
            metadata: newProduct
          });
          setIsDialogOpen(false);
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { data: deletedProduct, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (!error && deletedProduct) {
      await logActivity({
        action_type: 'delete',
        entity_type: 'product',
        entity_id: id,
        description: `Deleted product ${deletedProduct.name} (${deletedProduct.model_no})`,
        metadata: deletedProduct
      });
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
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ProductList onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}