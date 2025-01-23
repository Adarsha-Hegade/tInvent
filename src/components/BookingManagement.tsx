import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookingForm } from './bookings/BookingForm';
import { BookingCard } from './bookings/BookingCard';
import { BookingDetails } from './bookings/BookingDetails';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity-logger';
import { toast } from 'sonner';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      loadBookings(),
      loadProducts(),
      loadCustomers()
    ]).finally(() => {
      setIsLoading(false);
    });

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('booking_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadBookings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_items' }, () => {
        loadBookings();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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
      toast.error('Failed to load bookings');
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
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
      return;
    }

    if (data) {
      setProducts(data);
    }
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
      return;
    }

    if (data) {
      setCustomers(data);
    }
  };

  const validateBooking = (items: BookingItem[]): { isValid: boolean; message?: string } => {
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (!product) {
        return { isValid: false, message: 'Invalid product selected' };
      }
      
      // For updates, we need to consider the current booking's quantities
      let currentBookedQuantity = 0;
      if (editingBooking) {
        const existingItem = editingBooking.items.find(i => i.product_id === item.product_id);
        if (existingItem) {
          currentBookedQuantity = existingItem.quantity;
        }
      }

      const availableStock = product.available_stock + currentBookedQuantity;
      if (item.quantity > availableStock) {
        return {
          isValid: false,
          message: `Not enough stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`
        };
      }
    }
    return { isValid: true };
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      setValidationError(null);

      const validation = validateBooking(data.items);
      if (!validation.isValid) {
        setValidationError(validation.message || 'Invalid booking data');
        return;
      }

      if (editingBooking) {
        // Update existing booking
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            customer_id: data.customer_id,
            status: data.status
          })
          .eq('id', editingBooking.id);

        if (bookingError) {
          throw bookingError;
        }

        // Delete existing items
        await supabase
          .from('booking_items')
          .delete()
          .eq('booking_id', editingBooking.id);

        // Insert new items
        const { error: itemsError } = await supabase
          .from('booking_items')
          .insert(data.items.map((item: BookingItem) => ({
            booking_id: editingBooking.id,
            product_id: item.product_id,
            quantity: item.quantity
          })));

        if (itemsError) {
          throw itemsError;
        }

        await logActivity({
          action_type: 'update',
          entity_type: 'booking',
          entity_id: editingBooking.id,
          description: `Updated booking for customer ${data.customer_id}`,
          metadata: { items: data.items }
        });

        toast.success('Booking updated successfully');
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

        if (bookingError || !newBooking) {
          throw bookingError || new Error('Failed to create booking');
        }

        const bookingItems = data.items.map((item: BookingItem) => ({
          booking_id: newBooking.id,
          product_id: item.product_id,
          quantity: item.quantity
        }));

        const { error: itemsError } = await supabase
          .from('booking_items')
          .insert(bookingItems);

        if (itemsError) {
          throw itemsError;
        }

        await logActivity({
          action_type: 'create',
          entity_type: 'booking',
          entity_id: newBooking.id,
          description: `Created new booking for customer ${data.customer_id}`,
          metadata: { items: data.items }
        });

        toast.success('Booking created successfully');
      }

      setIsAddDialogOpen(false);
      setEditingBooking(null);
      await loadBookings();
    } catch (error) {
      console.error('Error saving booking:', error);
      toast.error('Failed to save booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (booking: Booking & { items: BookingItem[] }) => {
    setEditingBooking(booking);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
      
      await logActivity({
        action_type: 'delete',
        entity_type: 'booking',
        entity_id: id,
        description: 'Deleted booking',
      });

      toast.success('Booking deleted successfully');
      await loadBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to delete booking');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
                setValidationError(null);
              }}
              isSubmitting={isSubmitting}
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