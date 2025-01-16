import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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

export function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm<Booking>({
    defaultValues: {
      status: 'pending' // Set default status
    }
  });

  useEffect(() => {
    loadBookings();
    loadProducts();
    loadCustomers();
  }, []);

  const loadBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        products:product_id(name),
        customers:customer_id(name)
      `);
    if (data) setBookings(data);
    if (error) console.error('Error loading bookings:', error);
  };

  const loadProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (data) setProducts(data);
    if (error) console.error('Error loading products:', error);
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase.from('customers').select('*');
    if (data) setCustomers(data);
    if (error) console.error('Error loading customers:', error);
  };

  const onSubmit = async (data: Partial<Booking>) => {
    const bookingData = {
      ...data,
      booking_date: new Date().toISOString(),
      status: data.status || 'pending' // Ensure status is set
    };

    const { error } = await supabase.from('bookings').insert([bookingData]);
    if (error) {
      console.error('Error adding booking:', error);
    } else {
      loadBookings();
      setIsAddDialogOpen(false);
      reset();
    }
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Booking</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label>Customer</label>
                  <Select onValueChange={(value) => setValue('customer_id', value)}>
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
                  <label>Product</label>
                  <Select onValueChange={(value) => setValue('product_id', value)}>
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
                <div className="space-y-2">
                  <label>Quantity</label>
                  <Input type="number" {...register('quantity')} required min="1" />
                </div>
                <div className="space-y-2">
                  <label>Status</label>
                  <Select onValueChange={(value) => setValue('status', value)} defaultValue="pending">
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">Add Booking</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Booking Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>{booking.customers?.name}</TableCell>
                <TableCell>{booking.products?.name}</TableCell>
                <TableCell>{booking.quantity}</TableCell>
                <TableCell>
                  <Badge variant={
                    booking.status === 'confirmed' ? 'default' :
                    booking.status === 'pending' ? 'secondary' :
                    'destructive'
                  }>
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(booking.booking_date).toLocaleDateString()}</TableCell>
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