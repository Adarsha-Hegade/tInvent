import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/StatCard';
import { Overview } from '@/components/Overview';
import { RecentSales } from '@/components/RecentSales';
import { ProductList } from '@/components/ProductList';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardShell } from '@/components/DashboardShell';
import { ProductManagement } from '@/components/ProductManagement';
import { CustomerManagement } from '@/components/CustomerManagement';
import { BookingManagement } from '@/components/BookingManagement';
import { Auth } from '@/components/Auth';
import { supabase } from '@/lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth />;
  }

  return (
    <DashboardShell>
      <DashboardHeader session={session} />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Products"
              value="246"
              change="+12.5% from last month"
              className="border-l-4 border-l-primary"
            />
            <StatCard
              title="Low Stock Items"
              value="24"
              change="8 items need reorder"
              className="border-l-4 border-l-warning"
            />
            <StatCard
              title="Total Value"
              value="$142,984"
              change="+8.2% from last month"
              className="border-l-4 border-l-success"
            />
            <StatCard
              title="Out of Stock"
              value="12"
              change="-4 from last week"
              className="border-l-4 border-l-danger"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Inventory Overview</h3>
                <p className="text-sm text-muted-foreground mb-4">Monthly product movement trends</p>
                <Overview />
              </div>
            </div>
            <div className="col-span-3">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Recent Activity</h3>
                <p className="text-sm text-muted-foreground mb-4">Latest inventory changes</p>
                <RecentSales />
              </div>
            </div>
          </div>
          <ProductList />
        </TabsContent>

        <TabsContent value="products">
          <ProductManagement />
        </TabsContent>

        <TabsContent value="customers">
          <CustomerManagement />
        </TabsContent>

        <TabsContent value="bookings">
          <BookingManagement />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}