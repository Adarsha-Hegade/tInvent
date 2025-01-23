import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

interface BookingItem {
  id?: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

interface BookingFormData {
  customer_id: string;
  status: 'pending' | 'advance_paid' | 'full_paid';
  items: BookingItem[];
}

interface BookingFormProps {
  customers: Customer[];
  products: Product[];
  onSubmit: (data: BookingFormData) => Promise<void>;
  initialData?: BookingFormData;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function BookingForm({ customers, products, onSubmit, initialData, onCancel, isSubmitting }: BookingFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BookingFormData>({
    defaultValues: initialData || {
      status: 'pending',
      items: []
    }
  });

  const removeItem = (index: number) => {
    const currentItems = watch('items') || [];
    setValue('items', currentItems.filter((_, i) => i !== index));
  };

  const addProduct = (product: Product) => {
    const currentItems = watch('items') || [];
    const existingItemIndex = currentItems.findIndex(item => item.product_id === product.id);

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const newQuantity = currentItems[existingItemIndex].quantity + 1;
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: newQuantity
      };
      setValue('items', updatedItems);
    } else {
      // Add new item
      setValue('items', [...currentItems, { product_id: product.id, quantity: 1, product }]);
    }
    setShowProductSearch(false);
    setSearchQuery('');
  };

  const handleQuantityChange = (index: number, value: number) => {
    const items = watch('items');
    items[index].quantity = value;
    setValue('items', [...items]);
  };

  const filteredProducts = searchQuery.trim().length > 0 
    ? products
        .filter(product => {
          const query = searchQuery.toLowerCase();
          return (
            product.name.toLowerCase().includes(query) ||
            product.model_no.toLowerCase().includes(query)
          );
        })
        .slice(0, 5) // Limit to 5 results
    : [];

  const isItemOverbooked = (item: BookingItem) => {
    const product = products.find(p => p.id === item.product_id);
    return product && item.quantity > product.available_stock;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Customer</label>
          <Select 
            value={watch('customer_id')}
            onValueChange={(value) => setValue('customer_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.customer_id && (
            <p className="text-sm text-destructive">Please select a customer</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select 
            value={watch('status')}
            onValueChange={(value) => setValue('status', value as 'pending' | 'advance_paid' | 'full_paid')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="advance_paid">Advance Paid</SelectItem>
              <SelectItem value="full_paid">Full Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Products</label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setShowProductSearch(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>

          {showProductSearch && (
            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
              </div>
              {searchQuery.trim().length > 0 && (
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                      onClick={() => addProduct(product)}
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.model_no}</p>
                      </div>
                      <Badge variant={product.available_stock > 0 ? 'default' : 'destructive'}>
                        Available: {product.available_stock}
                      </Badge>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No products found
                    </p>
                  )}
                </div>
              )}
            </Card>
          )}

          <div className="space-y-2">
            {watch('items')?.map((item, index) => {
              const isOverbooked = isItemOverbooked(item);
              return (
                <div 
                  key={index} 
                  className={cn(
                    "flex gap-4 items-center p-2 rounded-md",
                    isOverbooked ? "bg-destructive/10" : "bg-muted/50"
                  )}
                >
                  <div className="flex-1">
                    <p className="font-medium">{products.find(p => p.id === item.product_id)?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {products.find(p => p.id === item.product_id)?.model_no}
                    </p>
                    {isOverbooked && (
                      <p className="text-xs text-destructive mt-1">
                        Warning: Exceeds available stock ({products.find(p => p.id === item.product_id)?.available_stock} available)
                      </p>
                    )}
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                      className={cn(isOverbooked && "border-destructive")}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          type="submit" 
          className="flex-1"
          disabled={isSubmitting || !watch('items')?.length}
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Booking' : 'Add Booking'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}