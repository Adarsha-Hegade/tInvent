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
import type { Database } from '@/lib/database.types';

type DashboardStats = {
  totalProducts: number;
  lowStockItems: number;
  totalValue: number;
  outOfStock: number;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockItems: 0,
    totalValue: 0,
    outOfStock: 0,
  });

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

  useEffect(() => {
    const fetchDashboardStats = async () => {
      const { data: products } = await supabase
        .from('products')
        .select('*');

      if (products) {
        const stats = products.reduce(
          (acc, product) => {
            acc.totalProducts++;
            if (product.available_stock <= 10 && product.available_stock > 0) {
              acc.lowStockItems++;
            }
            if (product.available_stock <= 0) {
              acc.outOfStock++;
            }
            // Assuming each product has an average value of $100
            acc.totalValue += product.total_stock * 100;
            return acc;
          },
          { totalProducts: 0, lowStockItems: 0, totalValue: 0, outOfStock: 0 }
        );
        setStats(stats);
      }
    };

    if (session) {
      fetchDashboardStats();

      // Subscribe to changes
      const subscription = supabase
        .channel('products_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          fetchDashboardStats();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [session]);

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
              value={stats.totalProducts.toString()}
              change={`${stats.totalProducts} products in inventory`}
              className="border-l-4 border-l-primary"
            />
            <StatCard
              title="Low Stock Items"
              value={stats.lowStockItems.toString()}
              change={`${stats.lowStockItems} items need reorder`}
              className="border-l-4 border-l-warning"
            />
            <StatCard
              title="Total Value"
              value={`$${stats.totalValue.toLocaleString()}`}
              change="Estimated inventory value"
              className="border-l-4 border-l-success"
            />
            <StatCard
              title="Out of Stock"
              value={stats.outOfStock.toString()}
              change={`${stats.outOfStock} items unavailable`}
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