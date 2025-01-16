import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Fan, Lightbulb } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('name')
        .limit(5);
      
      if (data) setProducts(data);
    };

    fetchProducts();

    // Subscribe to changes
    const subscription = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getStockStatus = (product: Product) => {
    const availableStock = product.available_stock;
    if (availableStock <= 0) return { status: 'Out of Stock', variant: 'destructive' as const };
    if (availableStock <= 10) return { status: 'Low Stock', variant: 'warning' as const };
    return { status: 'In Stock', variant: 'default' as const };
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const { status, variant } = getStockStatus(product);
            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {product.manufacturer?.toLowerCase().includes('fan') ? (
                      <Fan className="h-4 w-4" />
                    ) : (
                      <Lightbulb className="h-4 w-4" />
                    )}
                    {product.model_no}
                  </div>
                </TableCell>
                <TableCell>{product.model_no}</TableCell>
                <TableCell className="text-right">{product.available_stock}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={variant}>{status}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}