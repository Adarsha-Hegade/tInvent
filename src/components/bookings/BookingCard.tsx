import { useState } from 'react';
import { User, Mail, Phone, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Database } from '@/lib/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

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

interface BookingCardProps {
  groupedBooking: GroupedBooking;
  onSelect: (groupedBooking: GroupedBooking) => void;
}

export function BookingCard({ groupedBooking, onSelect }: BookingCardProps) {
  const { customer, bookings } = groupedBooking;
  const [showAllBookings, setShowAllBookings] = useState(false);
  const displayedBookings = showAllBookings ? bookings : bookings.slice(0, 2);
  const hasMoreBookings = bookings.length > 2;

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

  return (
    <Card 
      className="relative overflow-hidden group transition-all hover:shadow-lg cursor-pointer"
      onClick={() => onSelect(groupedBooking)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
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
}