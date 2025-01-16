import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Fan, Lightbulb } from 'lucide-react';

const products = [
  {
    id: 1,
    name: 'Premium Ceiling Fan X500',
    type: 'Fan',
    sku: 'FAN-X500-BLK',
    stock: 45,
    price: 299.99,
    status: 'In Stock',
  },
  {
    id: 2,
    name: 'Smart LED Bulb 10W',
    type: 'Light',
    sku: 'LED-10W-SMT',
    stock: 12,
    price: 24.99,
    status: 'Low Stock',
  },
  {
    id: 3,
    name: 'Modern Glass Pendant Light',
    type: 'Light',
    sku: 'PND-GLS-MOD',
    stock: 28,
    price: 199.99,
    status: 'In Stock',
  },
  {
    id: 4,
    name: 'Industrial Ceiling Fan',
    type: 'Fan',
    sku: 'FAN-IND-72',
    stock: 0,
    price: 449.99,
    status: 'Out of Stock',
  },
  {
    id: 5,
    name: 'Track Light Kit',
    type: 'Light',
    sku: 'TRK-LED-4',
    stock: 15,
    price: 89.99,
    status: 'In Stock',
  },
];

export function ProductList() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {product.type === 'Fan' ? (
                    <Fan className="h-4 w-4" />
                  ) : (
                    <Lightbulb className="h-4 w-4" />
                  )}
                  {product.type}
                </div>
              </TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell className="text-right">{product.stock}</TableCell>
              <TableCell className="text-right">${product.price}</TableCell>
              <TableCell className="text-right">
                <Badge variant={
                  product.status === 'In Stock' ? 'default' :
                  product.status === 'Low Stock' ? 'warning' :
                  'destructive'
                }>
                  {product.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}