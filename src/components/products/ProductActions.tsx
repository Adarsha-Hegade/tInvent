import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductActionsProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductActions({ product, onEdit, onDelete }: ProductActionsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
        <Edit className="w-4 h-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => onDelete(product)}
        className="hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}