import { Pencil, Trash2, ChevronLeft, Package2, Calendar, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
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

interface BookingDetailsProps {
  groupedBooking: GroupedBooking;
  onBack: () => void;
  onEdit: (booking: Booking & { items: BookingItem[] }) => void;
  onDelete: (id: string) => void;
}

export function BookingDetails({ groupedBooking, onBack, onEdit, onDelete }: BookingDetailsProps) {
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

  const handleDelete = (id: string) => {
    onDelete(id);
    toast.success('Booking deleted successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to All Customers
        </Button>
      </div>

      <div className="bg-card rounded-lg border p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{groupedBooking.customer.name}</h2>
            <div className="space-y-1 text-muted-foreground">
              {groupedBooking.customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {groupedBooking.customer.email}
                </div>
              )}
              {groupedBooking.customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {groupedBooking.customer.phone}
                </div>
              )}
              {groupedBooking.customer.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {groupedBooking.customer.address}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Bookings History</h3>
          <div className="space-y-4">
            {groupedBooking.bookings.map((booking, index) => (
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
                        <Button variant="ghost" size="icon" onClick={() => onEdit(booking)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this booking. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(booking.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
}