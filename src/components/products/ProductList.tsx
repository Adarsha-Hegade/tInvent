import { useState, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductImage } from './ProductImage';
import { ProductActions } from './ProductActions';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'] & {
  manufacturer_details?: Database['public']['Tables']['manufacturers']['Row'];
};

type SortField = 'name' | 'total_stock' | 'available_stock' | 'bad_stock' | 'dead_stock' | 'bookings';
type SortOrder = 'asc' | 'desc';

interface ProductListProps {
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductList({ onEdit, onDelete }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [manufacturers, setManufacturers] = useState<Database['public']['Tables']['manufacturers']['Row'][]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
    loadManufacturers();

    const subscription = supabase
      .channel('product_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadProducts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'manufacturers' }, () => {
        loadProducts();
        loadManufacturers();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadProducts = async () => {
    const { data: productsData } = await supabase
      .from('products')
      .select(`
        *,
        manufacturer_details:manufacturers(*)
      `)
      .order(sortField, { ascending: sortOrder === 'asc' });

    if (productsData) {
      setProducts(productsData);
    }
  };

  const loadManufacturers = async () => {
    const { data } = await supabase.from('manufacturers').select('*');
    if (data) setManufacturers(data);
  };

  const getStockStatus = (product: Product) => {
    if (product.available_stock <= 0) return { status: 'Out of Stock', variant: 'destructive' as const };
    if (product.available_stock <= 5) return { status: 'Low Stock', variant: 'warning' as const };
    return { status: 'In Stock', variant: 'default' as const };
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <button
        onClick={() => toggleSort(field)}
        className="flex items-center space-x-1 hover:text-primary transition-colors"
      >
        <span>{children}</span>
        {sortField === field && (
          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </button>
    </TableHead>
  );

  const filteredProducts = products
    .filter(product => {
      const searchMatch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.manufacturer_details?.factory_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const manufacturerMatch = 
        !selectedManufacturer || 
        product.manufacturer_id === selectedManufacturer;

      return searchMatch && manufacturerMatch;
    });

  const truncateText = (text: string, wordCount: number) => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= wordCount) return text;
    return words.slice(0, wordCount).join(' ') + '...';
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedManufacturer || undefined} onValueChange={setSelectedManufacturer}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by manufacturer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Manufacturers</SelectItem>
            {manufacturers.map((manufacturer) => (
              <SelectItem key={manufacturer.id} value={manufacturer.id}>
                {manufacturer.factory_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">S.No</TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <SortableHeader field="name">Product Details</SortableHeader>
              <TableHead>Status</TableHead>
              <SortableHeader field="total_stock">Total Stock</SortableHeader>
              <SortableHeader field="bad_stock">Bad Stock</SortableHeader>
              <SortableHeader field="dead_stock">Dead Stock</SortableHeader>
              <SortableHeader field="bookings">Booked Stock</SortableHeader>
              <SortableHeader field="available_stock">Available Stock</SortableHeader>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product, index) => {
              const { status, variant } = getStockStatus(product);
              const isHovered = hoveredProduct === product.id;

              return (
                <TableRow 
                  key={product.id}
                  onMouseEnter={() => setHoveredProduct(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                  className="relative group"
                >
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <ProductImage modelNo={product.model_no} name={product.name} />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.model_no}</div>
                      {isHovered && product.internal_notes && (
                        <div className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded-md">
                          {truncateText(product.internal_notes, 15)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant}>{status}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{product.total_stock}</TableCell>
                  <TableCell className="text-muted-foreground">{product.bad_stock}</TableCell>
                  <TableCell className="text-muted-foreground">{product.dead_stock}</TableCell>
                  <TableCell className="text-muted-foreground">{product.bookings}</TableCell>
                  <TableCell className="font-medium">{product.available_stock}</TableCell>
                  <TableCell>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ProductActions product={product} onEdit={onEdit} onDelete={onDelete} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}