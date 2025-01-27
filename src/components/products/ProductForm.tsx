import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Manufacturer = Database['public']['Tables']['manufacturers']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface ProductFormProps {
  product?: Product;
  manufacturers: Manufacturer[];
  categories: Category[];
  onSubmit: (data: Partial<Product>) => Promise<void>;
  isLoading?: boolean;
}

export function ProductForm({ product, manufacturers, categories, onSubmit, isLoading }: ProductFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm<Partial<Product>>({
    defaultValues: {
      model_no: product?.model_no || '',
      name: product?.name || '',
      manufacturer_id: product?.manufacturer_id || '',
      category_id: product?.category_id || '',
      price: product?.price || 0,
      description: product?.description || '',
      remarks: product?.remarks || '',
      internal_notes: product?.internal_notes || '',
      total_stock: product?.total_stock || 0,
      bad_stock: product?.bad_stock || 0,
      dead_stock: product?.dead_stock || 0,
    },
  });

  const handleFormSubmit = async (data: Partial<Product>) => {
    // Remove generated columns before submitting
    const { available_stock, bookings, created_at, updated_at, ...submitData } = data as any;
    await onSubmit(submitData);
  };

  const formatPrice = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Ensure only two decimal places
    const parts = numericValue.split('.');
    if (parts.length > 1) {
      parts[1] = parts[1].slice(0, 2);
      return parts.join('.');
    }
    
    return numericValue;
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label>Model No</label>
          <Input {...register('model_no')} required disabled={isLoading} />
        </div>
        <div className="space-y-2">
          <label>Name</label>
          <Input {...register('name')} required disabled={isLoading} />
        </div>
        <div className="space-y-2">
          <label>Manufacturer</label>
          <Select
            value={watch('manufacturer_id')}
            onValueChange={(value) => setValue('manufacturer_id', value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select manufacturer" />
            </SelectTrigger>
            <SelectContent>
              {manufacturers.map((manufacturer) => (
                <SelectItem key={manufacturer.id} value={manufacturer.id}>
                  {manufacturer.factory_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label>Category</label>
          <Select
            value={watch('category_id')}
            onValueChange={(value) => setValue('category_id', value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label>Price (₹)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            {...register('price', {
              valueAsNumber: true,
              required: true,
              min: 0,
              onChange: (e) => {
                e.target.value = formatPrice(e.target.value);
              }
            })}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <label>Description</label>
          <Input {...register('description')} disabled={isLoading} />
        </div>
        <div className="col-span-2 space-y-2">
          <label>Remarks</label>
          <Textarea {...register('remarks')} disabled={isLoading} />
        </div>
        <div className="col-span-2 space-y-2">
          <label>Internal Notes</label>
          <Textarea {...register('internal_notes')} disabled={isLoading} />
        </div>
        <div className="space-y-2">
          <label>Total Stock</label>
          <Input 
            type="number" 
            {...register('total_stock', { valueAsNumber: true })} 
            required 
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <label>Bad Stock</label>
          <Input 
            type="number" 
            {...register('bad_stock', { valueAsNumber: true })} 
            required 
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <label>Dead Stock</label>
          <Input 
            type="number" 
            {...register('dead_stock', { valueAsNumber: true })} 
            required 
            disabled={isLoading}
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {product ? 'Updating...' : 'Creating...'}
          </>
        ) : (
          product ? 'Update Product' : 'Add Product'
        )}
      </Button>
    </form>
  );
}