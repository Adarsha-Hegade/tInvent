import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type BookingWithDetails = Database['public']['Tables']['bookings']['Row'] & {
  customer?: Database['public']['Tables']['customers']['Row'];
  items?: {
    product?: Database['public']['Tables']['products']['Row'];
    quantity: number;
  }[];
};

export function RecentSales() {
  const [recentBookings, setRecentBookings] = useState<BookingWithDetails[]>([]);

  useEffect(() => {
    const fetchRecentBookings = async () => {
      const { data } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          created_at,
          customer:customer_id(name),
          items:booking_items(
            quantity,
            product:product_id(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      if (data) setRecentBookings(data);
    };

    fetchRecentBookings();

    // Subscribe to changes
    const subscription = supabase
      .channel('bookings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchRecentBookings();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="space-y-8">
      {recentBookings.map((booking) => (
        <div key={booking.id} className="flex items-center">
          <Avatar className="h-9 w-9 bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium">
              {booking.customer?.name || 'Unknown Customer'}
            </p>
            <p className="text-sm text-muted-foreground">
              {booking.items?.map((item, index) => (
                <span key={index}>
                  {item.quantity} × {item.product?.name}
                  {index < (booking.items?.length || 0) - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          </div>
          <div className={`ml-auto font-medium ${
            booking.status === 'full_paid' 
              ? 'text-green-600' 
              : booking.status === 'advance_paid'
                ? 'text-amber-600'
                : 'text-gray-600'
          }`}>
            {booking.status === 'full_paid' 
              ? 'Paid' 
              : booking.status === 'advance_paid'
                ? 'Advance'
                : 'Pending'}
          </div>
        </div>
      ))}
    </div>
  );
}