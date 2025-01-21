import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
}

export function BookingForm({ customers, products, onSubmit, initialData, onCancel }: BookingFormProps) {
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [openProductPickers, setOpenProductPickers] = useState<{ [key: number]: boolean }>({});
  const [searchQueries, setSearchQueries] = useState<{ [key: number]: string }>({});

  const { register, handleSubmit, watch, setValue } = useForm<BookingFormData>({
    defaultValues: initialData || {
      status: 'pending',
      items: [{ product_id: '', quantity: 1 }]
    }
  });

  const addItem = () => {
    const currentItems = watch('items') || [];
    setValue('items', [...currentItems, { product_id: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    const currentItems = watch('items') || [];
    setValue('items', currentItems.filter((_, i) => i !== index));
    
    // Clean up search state for removed item
    const newSearchQueries = { ...searchQueries };
    delete newSearchQueries[index];
    setSearchQueries(newSearchQueries);
    
    const newOpenPickers = { ...openProductPickers };
    delete newOpenPickers[index];
    setOpenProductPickers(newOpenPickers);
  };

  const handleProductSelect = (productId: string, index: number) => {
    const items = watch('items');
    items[index].product_id = productId;
    setValue('items', [...items]);
    setOpenProductPickers({ ...openProductPickers, [index]: false });
  };

  const filteredProducts = (index: number) => {
    const query = searchQueries[index]?.toLowerCase() || '';
    return products.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.model_no.toLowerCase().includes(query)
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <label>Customer</label>
          {isCreatingCustomer ? (
            <div className="space-y-4">
              <Input
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <Input
                type="email"
                placeholder="Email (optional)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
              <Input
                placeholder="Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={!customerName}
                  className="flex-1"
                >
                  Create Customer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreatingCustomer(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select 
                value={watch('customer_id')}
                onValueChange={(value) => setValue('customer_id', value)}
              >
                <SelectTrigger className="flex-1">
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreatingCustomer(true)}
              >
                New Customer
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label>Status</label>
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
            <label>Products</label>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
          {watch('items')?.map((item, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1">
                <Popover
                  open={openProductPickers[index]}
                  onOpenChange={(open) => 
                    setOpenProductPickers({ ...openProductPickers, [index]: open })
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !item.product_id && "text-muted-foreground"
                      )}
                    >
                      {item.product_id
                        ? products.find((product) => product.id === item.product_id)?.name
                        : "Select product..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search products..."
                        value={searchQueries[index] || ''}
                        onValueChange={(search) => 
                          setSearchQueries({ ...searchQueries, [index]: search })
                        }
                      />
                      <CommandEmpty>No products found.</CommandEmpty>
                      <CommandGroup>
                        {filteredProducts(index).map((product) => (
                          <CommandItem
                            key={product.id}
                            onSelect={() => handleProductSelect(product.id, index)}
                          >
                            <span>{product.name}</span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              (Available: {product.available_stock})
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  min="1"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) => {
                    const items = watch('items');
                    items[index].quantity = parseInt(e.target.value) || 1;
                    setValue('items', [...items]);
                  }}
                  required
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                disabled={watch('items')?.length === 1}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {initialData ? 'Update Booking' : 'Add Booking'}
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