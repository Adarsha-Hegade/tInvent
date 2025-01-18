import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Upload, Pencil, Trash2, Fan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import Papa from 'papaparse';
import type { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm<Product>();

  useEffect(() => {
    loadProducts();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: async (results) => {
          const products = results.data.slice(1).map((row: any) => ({
            model_no: row[0],
            name: row[1],
            description: row[2],
            manufacturer: row[3],
            remarks: row[4],
            internal_notes: row[5],
            total_stock: parseInt(row[6]),
            bad_stock: parseInt(row[7]),
            dead_stock: parseInt(row[8]),
          }));

          const { error } = await supabase.from('products').insert(products);
          if (error) console.error('Error importing products:', error);
          else loadProducts();
        },
        header: true,
      });
    }
  };

  const loadProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (data) setProducts(data);
    if (error) console.error('Error loading products:', error);
  };

  const onSubmit = async (data: Partial<Product>) => {
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', editingProduct.id);
        
        if (!error) {
          await loadProducts();
          setIsDialogOpen(false);
          setEditingProduct(null);
          reset();
        }
      } else {
        const { error } = await supabase.from('products').insert([data]);
        if (!error) {
          await loadProducts();
          setIsDialogOpen(false);
          reset();
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setValue('model_no', product.model_no);
    setValue('name', product.name);
    setValue('description', product.description || '');
    setValue('manufacturer', product.manufacturer || '');
    setValue('remarks', product.remarks || '');
    setValue('internal_notes', product.internal_notes || '');
    setValue('total_stock', product.total_stock);
    setValue('bad_stock', product.bad_stock);
    setValue('dead_stock', product.dead_stock || 0);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      await loadProducts();
    }
  };

  const getStockStatus = (product: Product) => {
    const availableStock = product.available_stock;
    if (availableStock <= 0) return { status: 'Out of Stock', variant: 'destructive' as const };
    if (availableStock <= 10) return { status: 'Low Stock', variant: 'warning' as const };
    return { status: 'In Stock', variant: 'default' as const };
  };

  const getProductImage = (modelNo: string) => {
    try {
      return `/public/images/${modelNo}.png`;
    } catch {
      return null;
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
              reset();
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label>Model No</label>
                    <Input {...register('model_no')} required />
                  </div>
                  <div className="space-y-2">
                    <label>Name</label>
                    <Input {...register('name')} required />
                  </div>
                  <div className="space-y-2">
                    <label>Manufacturer</label>
                    <Input {...register('manufacturer')} />
                  </div>
                  <div className="space-y-2">
                    <label>Description</label>
                    <Input {...register('description')} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label>Remarks</label>
                    <Textarea {...register('remarks')} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label>Internal Notes</label>
                    <Textarea {...register('internal_notes')} />
                  </div>
                  <div className="space-y-2">
                    <label>Total Stock</label>
                    <Input type="number" {...register('total_stock')} required />
                  </div>
                  <div className="space-y-2">
                    <label>Bad Stock</label>
                    <Input type="number" {...register('bad_stock')} required />
                  </div>
                  <div className="space-y-2">
                    <label>Dead Stock</label>
                    <Input type="number" {...register('dead_stock')} required />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Stock Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const { status, variant } = getStockStatus(product);
              const imageUrl = getProductImage(product.model_no);
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={product.model_no}
                          className="w-8 h-8 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <Fan className={`w-5 h-5 ${imageUrl ? 'hidden' : ''}`} />
                      {product.model_no}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-muted-foreground">{product.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{product.manufacturer}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {product.remarks && (
                        <div className="text-sm">{product.remarks}</div>
                      )}
                      {product.internal_notes && (
                        <div className="text-sm text-muted-foreground">{product.internal_notes}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div>Total: {product.total_stock}</div>
                      <div>Bad: {product.bad_stock}</div>
                      <div>Dead: {product.dead_stock}</div>
                      <div>Booked: {product.bookings}</div>
                      <div className="font-medium">Available: {product.available_stock}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant}>{status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}