import React, { useState } from 'react';
import { Package2, BookOpen } from 'lucide-react';
import Sidebar from '../common/Sidebar';
import { useAuthStore } from '../../store/authStore';
import ProductView from './products/ProductView';
import BookingView from './bookings/BookingView';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const { signOut } = useAuthStore();

  const navigation = [
    { name: 'Products', icon: Package2, id: 'products' },
    { name: 'Bookings', icon: BookOpen, id: 'bookings' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductView />;
      case 'bookings':
        return <BookingView />;
      default:
        return <ProductView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        navigation={navigation}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={signOut}
      />
      <main className="flex-1 overflow-y-auto p-8">
        {renderContent()}
      </main>
    </div>
  );
}