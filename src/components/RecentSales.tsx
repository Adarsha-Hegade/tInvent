import { Avatar } from '@/components/ui/avatar';
import { User } from 'lucide-react';

export function RecentSales() {
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Avatar className="h-9 w-9 bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium">Ceiling Fan Restock</p>
          <p className="text-sm text-muted-foreground">+24 units • Premium Series X500</p>
        </div>
        <div className="ml-auto font-medium text-green-600">+$1,999.00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9 bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium">LED Bulb Order</p>
          <p className="text-sm text-muted-foreground">-150 units • Smart LED 10W</p>
        </div>
        <div className="ml-auto font-medium text-red-600">-$750.00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9 bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium">Pendant Light Update</p>
          <p className="text-sm text-muted-foreground">+12 units • Modern Glass Series</p>
        </div>
        <div className="ml-auto font-medium text-green-600">+$2,400.00</div>
      </div>
    </div>
  );
}