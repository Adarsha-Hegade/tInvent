import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Package2, User, Calendar, Mail, Phone, MapPin, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'];
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

interface GroupedBooking {
  customer: Customer;
  bookings: (Booking & { items: BookingItem[] })[];
}

export function BookingManagement() {
  const [groupedBookings, setGroupedBookings] = useState<GroupedBooking[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<(Booking & { items: BookingItem[] }) | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<GroupedBooking | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
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
    const { data: bookingsData, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customer_id(*),
        items:booking_items(
          *,
          product:product_id(*)
        )
      `)
      .order('booking_date', { ascending: false });

    if (error) {
      console.error('Error loading bookings:', error);
      return;
    }

    if (bookingsData) {
      // Group bookings by customer
      const grouped = bookingsData.reduce((acc: { [key: string]: GroupedBooking }, booking) => {
        const customerId = booking.customer_id;
        if (!acc[customerId]) {
          acc[customerId] = {
            customer: booking.customer,
            bookings: []
          };
        }
        acc[customerId].bookings.push({
          ...booking,
          items: booking.items.map(item => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            product: item.product
          }))
        });
        return acc;
      }, {});

      setGroupedBookings(Object.values(grouped));
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

  const checkOverbooked = (items: BookingItem[]): { isOverbooked: boolean; overbooked: string[] } => {
    const overbooked: string[] = [];
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (product && item.quantity > product.available_stock) {
        overbooked.push(product.name);
      }
    }
    return { isOverbooked: overbooked.length > 0, overbooked };
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      if (editingBooking) {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            customer_id: data.customer_id,
            status: data.status
          })
          .eq('id', editingBooking.id);

        if (!bookingError) {
          await supabase
            .from('booking_items')
            .delete()
            .eq('booking_id', editingBooking.id);

          const { error: itemsError } = await supabase
            .from('booking_items')
            .insert(data.items.map(item => ({
              booking_id: editingBooking.id,
              product_id: item.product_id,
              quantity: item.quantity
            })));

          if (!itemsError) {
            await loadBookings();
            setIsAddDialogOpen(false);
            setEditingBooking(null);
            reset();
          }
        }
      } else {
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
            await loadBookings();
            setIsAddDialogOpen(false);
            reset();
          }
        }
      }
    } catch (error) {
      console.error('Error saving booking:', error);
    }
  };

  const handleEdit = (booking: Booking & { items: BookingItem[] }) => {
    setEditingBooking(booking);
    setValue('customer_id', booking.customer_id);
    setValue('status', booking.status);
    setValue('items', booking.items.map(item => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity
    })));
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full_paid':
        return 'border-l-success';
      case 'advance_paid':
        return 'border-l-warning';
      default:
        return 'border-l-danger';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'full_paid':
        return 'default';
      case 'advance_paid':
        return 'secondary';
      default:
        return 'destructive';
    }
  };

  const CustomerBookingCard = ({ groupedBooking }: { groupedBooking: GroupedBooking }) => {
    const { customer, bookings } = groupedBooking;
    const [showAllBookings, setShowAllBookings] = useState(false);
    const displayedBookings = showAllBookings ? bookings : bookings.slice(0, 2);
    const hasMoreBookings = bookings.length > 2;

    return (
      <Card 
        className="relative overflow-hidden group transition-all hover:shadow-lg cursor-pointer"
        onClick={() => setSelectedCustomer(groupedBooking)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            {/* Customer Details Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">{customer.name}</h3>
                </div>
                <Badge variant="secondary">
                  {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              {customer.email && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{customer.email}</span>
                </div>
              )}
              
              {customer.phone && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>

            <hr className="border-border" />

            {/* Bookings Section */}
            <div className="space-y-4">
              {displayedBookings.map((booking, index) => (
                <div key={booking.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Booking {index + 1}</h4>
                    <Badge variant={getStatusBadgeVariant(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {booking.items.slice(0, 2).map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between text-sm">
                        <span>{item.product?.name}</span>
                        <span className="font-medium">× {item.quantity}</span>
                      </div>
                    ))}
                    {booking.items.length > 2 && (
                      <div className="text-sm text-muted-foreground">
                        +{booking.items.length - 2} more items
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {hasMoreBookings && !showAllBookings && (
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllBookings(true);
                  }}
                >
                  Show {bookings.length - 2} more bookings
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const DetailedView = () => {
    if (!selectedCustomer) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setSelectedCustomer(null)}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to All Customers
          </Button>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">{selectedCustomer.customer.name}</h2>
              <div className="space-y-1 text-muted-foreground">
                {selectedCustomer.customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {selectedCustomer.customer.email}
                  </div>
                )}
                {selectedCustomer.customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {selectedCustomer.customer.phone}
                  </div>
                )}
                {selectedCustomer.customer.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedCustomer.customer.address}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Bookings History</h3>
            <div className="space-y-4">
              {selectedCustomer.bookings.map((booking, index) => (
                <Card key={booking.id} className={`border-l-4 ${getStatusColor(booking.status)}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">Booking #{index + 1}</h4>
                            <Badge variant={getStatusBadgeVariant(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(booking.booking_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(booking)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(booking.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Products</h5>
                        <div className="space-y-2">
                          {booking.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded-md">
                              <div className="flex items-center gap-2">
                                <Package2 className="w-4 h-4 text-muted-foreground" />
                                <span>{item.product?.name}</span>
                              </div>
                              <span className="font-medium">× {item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
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
              {validationError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {validationError}
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label>Customer</label>
                  <Select 
                    value={watch('customer_id')}
                    onValueChange={(value) => setValue('customer_id', value)} 
                    required
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
                        <Select
                          value={item.product_id}
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
                                {product.name} (Available: {product.available_stock})
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

      {selectedCustomer ? (
        <DetailedView />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedBookings.map((groupedBooking) => (
            <CustomerBookingCard
              key={groupedBooking.customer.id}
              groupedBooking={groupedBooking}
            />
          ))}
        </div>
      )}
    </div>
  );
}