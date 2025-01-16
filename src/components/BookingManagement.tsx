import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

interface BookingItem {
  product_id: string;
  quantity: number;
  product?: Product;
}

interface BookingFormData {
  customer_id: string;
  status: 'pending' | 'advance_paid' | 'full_paid';
  items: BookingItem[];
}

export function BookingManagement() {
  const [bookings, setBookings] = useState<(Booking & { items: BookingItem[], customer?: Customer })[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const { register, handleSubmit, reset, setValue, watch } = useForm<BookingFormData>({
    defaultValues: {
      status: 'pending',
      items: [{ product_id: '', quantity: 1 }]
    }
  });

  useEffect(() => {
    loadBookings();
    loadProducts();
    loadCustomers();
  }, []);

  const loadBookings = async () => {
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select(`
        *,
        customers:customer_id(*),
        items:booking_items(
          *,
          products:product_id(*)
        )
      `);

    if (bookingsData) {
      setBookings(bookingsData.map(booking => ({
        ...booking,
        items: booking.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          product: item.products
        }))
      })));
    }
  };

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*');
    if (data) setProducts(data);
  };

  const loadCustomers = async () => {
    const { data } = await supabase.from('customers').select('*');
    if (data) setCustomers(data);
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      if (editingBooking) {
        // Update existing booking
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            customer_id: data.customer_id,
            status: data.status
          })
          .eq('id', editingBooking.id);

        if (!bookingError) {
          // Delete existing items
          await supabase
            .from('booking_items')
            .delete()
            .eq('booking_id', editingBooking.id);

          // Insert new items
          const { error: itemsError } = await supabase
            .from('booking_items')
            .insert(data.items.map(item => ({
              booking_id: editingBooking.id,
              product_id: item.product_id,
              quantity: item.quantity
            })));

          if (!itemsError) {
            loadBookings();
            setIsAddDialogOpen(false);
            setEditingBooking(null);
            reset();
          }
        }
      } else {
        // Create new booking
        const { data: newBooking, error: bookingError } = await supabase
          .from('bookings')
          .insert([{
            customer_id: data.customer_id,
            status: data.status
          }])
          .select()
          .single();

        if (newBooking && !bookingError) {
          const bookingItems = data.items.map(item => ({
            booking_id: newBooking.id,
            product_id: item.product_id,
            quantity: item.quantity
          }));

          const { error: itemsError } = await supabase
            .from('booking_items')
            .insert(bookingItems);

          if (!itemsError) {
            loadBookings();
            setIsAddDialogOpen(false);
            reset();
          }
        }
      }
    } catch (error) {
      console.error('Error saving booking:', error);
      console.log(item.quantity);console.log(quantity);
    }
  };

  const handleEdit = (booking: Booking & { items: BookingItem[], customer?: Customer }) => {
    setEditingBooking(booking);
    setValue('customer_id', booking.customer_id);
    setValue('status', booking.status as 'pending' | 'advance_paid' | 'full_paid');
    setValue('items', booking.items);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (!error) {
      loadBookings();
    }
  };

  const addItem = () => {
    const currentItems = watch('items') || [];
    setValue('items', [...currentItems, { product_id: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    const currentItems = watch('items') || [];
    setValue('items', currentItems.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Booking Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBooking ? 'Edit Booking' : 'Add New Booking'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label>Customer</label>
                  <Select onValueChange={(value) => setValue('customer_id', value)} required>
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
                </div>
                <div className="space-y-2">
                  <label>Status</label>
                  <Select 
                    onValueChange={(value) => setValue('status', value as 'pending' | 'advance_paid' | 'full_paid')} 
                    defaultValue="pending"
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
                        <Select
                          onValueChange={(value) => {
                            const items = watch('items');
                            items[index].product_id = value;
                            setValue('items', items);
                          }}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                            setValue('items', items);
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
              <Button type="submit" className="w-full">
                {editingBooking ? 'Update Booking' : 'Add Booking'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Booking Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>{booking.customer?.name}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {booking.items.map((item, index) => (
                      <div key={index} className="text-sm">
                        {item.product?.name} x {item.quantity}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    booking.status === 'full_paid' ? 'default' :
                    booking.status === 'advance_paid' ? 'secondary' :
                    'destructive'
                  }>
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(booking.booking_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(booking)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(booking.id)}>
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