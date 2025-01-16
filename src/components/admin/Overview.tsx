import React from 'react';
import { useProducts } from '../../hooks/useProducts';
import { useBookings } from '../../hooks/useBookings';
import StatsCard from '../common/StatsCard';
import { Package2, AlertTriangle, BookOpen, Package } from 'lucide-react';

export default function Overview() {
  const { products, loading: productsLoading } = useProducts();
  const { bookings, loading: bookingsLoading } = useBookings();

  if (productsLoading || bookingsLoading) {
    return <div>Loading...</div>;
  }

  const totalStock = products.reduce((sum, product) => sum + product.total_stock, 0);
  const totalBookings = bookings.length;
  const lowStockItems = products.filter(p => p.available_stock < 10).length;
  const totalAvailable = products.reduce((sum, product) => sum + product.available_stock, 0);

  const stats = [
    { name: 'Total Stock', value: totalStock, icon: Package2, color: 'blue' },
    { name: 'Total Bookings', value: totalBookings, icon: BookOpen, color: 'green' },
    { name: 'Low Stock Items', value: lowStockItems, icon: AlertTriangle, color: 'yellow' },
    { name: 'Available Stock', value: totalAvailable, icon: Package, color: 'indigo' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard key={stat.name} {...stat} />
        ))}
      </div>
    </div>
  );
}