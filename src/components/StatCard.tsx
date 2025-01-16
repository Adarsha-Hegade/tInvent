import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  className?: string;
}

export function StatCard({ title, value, change, className }: StatCardProps) {
  return (
    <Card className={cn("p-6 relative overflow-hidden group transition-all hover:shadow-lg", className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
      <h3 className="font-medium text-sm text-muted-foreground relative z-10">{title}</h3>
      <p className="text-3xl font-bold mt-2 relative z-10">{value}</p>
      <p className="text-sm text-muted-foreground mt-2 relative z-10">{change}</p>
    </Card>
  );
}