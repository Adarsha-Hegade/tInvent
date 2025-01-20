import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Manufacturer = Database['public']['Tables']['manufacturers']['Row'];

interface ProductFormProps {
  product?: Product;
  manufacturers: Manufacturer[];
  onSubmit: (data: Partial<Product>) => Promise<void>;
}

export function ProductForm({ product, manufacturers, onSubmit }: ProductFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm<Partial<Product>>({
    defaultValues: product || {
      total_stock: 0,
      bad_stock: 0,
      dead_stock: 0,
    },
  });

  return (
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
          <Select
            value={watch('manufacturer_id')}
            onValueChange={(value) => setValue('manufacturer_id', value)}
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
        {product ? 'Update Product' : 'Add Product'}
      </Button>
    </form>
  );
}