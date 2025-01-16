import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  products: Database['public']['Tables']['products']['Row'];
  customers: Database['public']['Tables']['customers']['Row'];
};

export function RecentSales() {
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const fetchRecentBookings = async () => {
      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          products:product_id(*),
          customers:customer_id(*)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      if (data) setRecentBookings(data as Booking[]);
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
              {booking.customers?.name || 'Unknown Customer'}
            </p>
            <p className="text-sm text-muted-foreground">
              {booking.quantity} units • {booking.products?.name}
            </p>
          </div>
          <div className={`ml-auto font-medium ${booking.status === 'confirmed' ? 'text-green-600' : 'text-amber-600'}`}>
            {booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
          </div>
        </div>
      ))}
    </div>
  );
}