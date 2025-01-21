import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookingForm } from './bookings/BookingForm';
import { BookingCard } from './bookings/BookingCard';
import { BookingDetails } from './bookings/BookingDetails';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity-logger';
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

  const handleSubmit = async (data: any) => {
    try {
      const { isOverbooked, overbooked } = checkOverbooked(data.items);
      if (isOverbooked) {
        setValidationError(`The following products are overbooked: ${overbooked.join(', ')}`);
        return;
      }

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
            .insert(data.items.map((item: BookingItem) => ({
              booking_id: editingBooking.id,
              product_id: item.product_id,
              quantity: item.quantity
            })));

          if (!itemsError) {
            await loadBookings();
            setIsAddDialogOpen(false);
            setEditingBooking(null);
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
          const bookingItems = data.items.map((item: BookingItem) => ({
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
          }
        }
      }
    } catch (error) {
      console.error('Error saving booking:', error);
    }
  };

  const handleEdit = (booking: Booking & { items: BookingItem[] }) => {
    setEditingBooking(booking);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (!error) {
      loadBookings();
    }
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
            {validationError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {validationError}
              </div>
            )}
            <BookingForm
              customers={customers}
              products={products}
              onSubmit={handleSubmit}
              initialData={editingBooking ? {
                customer_id: editingBooking.customer_id,
                status: editingBooking.status,
                items: editingBooking.items
              } : undefined}
              onCancel={() => {
                setIsAddDialogOpen(false);
                setEditingBooking(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {selectedCustomer ? (
        <BookingDetails
          groupedBooking={selectedCustomer}
          onBack={() => setSelectedCustomer(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedBookings.map((groupedBooking) => (
            <BookingCard
              key={groupedBooking.customer.id}
              groupedBooking={groupedBooking}
              onSelect={setSelectedCustomer}
            />
          ))}
        </div>
      )}
    </div>
  );
}