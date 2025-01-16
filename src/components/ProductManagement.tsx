import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Upload, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import Papa from 'papaparse';
import type { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<Product>();

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
            size: row[3],
            finish: row[4],
            manufacturer: row[5],
            total_stock: parseInt(row[6]),
            bad_stock: parseInt(row[7]),
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
    const { error } = await supabase.from('products').insert([data]);
    if (error) {
      console.error('Error adding product:', error);
    } else {
      await loadProducts();
      setIsAddDialogOpen(false);
      reset();
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
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
                    <label>Description</label>
                    <Input {...register('description')} />
                  </div>
                  <div className="space-y-2">
                    <label>Size</label>
                    <Input {...register('size')} />
                  </div>
                  <div className="space-y-2">
                    <label>Finish</label>
                    <Input {...register('finish')} />
                  </div>
                  <div className="space-y-2">
                    <label>Manufacturer</label>
                    <Input {...register('manufacturer')} />
                  </div>
                  <div className="space-y-2">
                    <label>Total Stock</label>
                    <Input type="number" {...register('total_stock')} required />
                  </div>
                  <div className="space-y-2">
                    <label>Bad Stock</label>
                    <Input type="number" {...register('bad_stock')} required />
                  </div>
                </div>
                <Button type="submit" className="w-full">Add Product</Button>
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
              <TableHead>Total Stock</TableHead>
              <TableHead>Available Stock</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.model_no}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.manufacturer}</TableCell>
                <TableCell>{product.total_stock}</TableCell>
                <TableCell>{product.available_stock}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
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
  );
}