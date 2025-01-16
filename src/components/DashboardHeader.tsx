import { Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardHeader() {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Dashboard</h1>
        <p className="text-muted-foreground">Manage your products and inventory levels</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}