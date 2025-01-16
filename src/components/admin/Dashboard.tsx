import React from 'react';
import { Package2, Users, BookOpen, LayoutDashboard } from 'lucide-react';
import Sidebar from '../common/Sidebar';
import { useAuthStore } from '../../store/authStore';
import ProductList from './products/ProductList';
import UserManagement from './users/UserManagement';
import Overview from './Overview';
import BookingManagement from './bookings/BookingManagement';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = React.useState('overview');
  const { signOut } = useAuthStore();

  const navigation = [
    { name: 'Overview', icon: LayoutDashboard, id: 'overview' },
    { name: 'Products', icon: Package2, id: 'products' },
    { name: 'Users', icon: Users, id: 'users' },
    { name: 'Bookings', icon: BookOpen, id: 'bookings' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'products':
        return <ProductList />;
      case 'users':
        return <UserManagement />;
      case 'bookings':
        return <BookingManagement />;
      default:
        return <Overview />;
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