import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useBookings } from '../../../hooks/useBookings';
import { useAuthStore } from '../../../store/authStore';
import BookingTable from '../../admin/bookings/BookingTable';
import BookingModal from '../../admin/bookings/BookingModal';
import CustomerModal from '../../admin/bookings/CustomerModal';

export default function BookingView() {
  const { bookings, loading, addBooking } = useBookings();
  const { user } = useAuthStore();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  if (loading) {
    return <div>Loading...</div>;
  }

  const canCreateBookings = user?.access_level === 'read-write';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
        {canCreateBookings && (
          <div className="flex gap-4">
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </button>
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Booking
            </button>
          </div>
        )}
      </div>

      <BookingTable bookings={bookings} />

      {canCreateBookings && (
        <>
          <BookingModal
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            onSubmit={addBooking}
          />
          <CustomerModal
            isOpen={isCustomerModalOpen}
            onClose={() => setIsCustomerModalOpen(false)}
          />
        </>
      )}
    </div>
  );
}