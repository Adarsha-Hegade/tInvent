import { useState } from 'react';
import { ChevronLeft, Download, Factory, Package2, Search, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import Papa from 'papaparse';
import type { Database } from '@/lib/database.types';

type Manufacturer = Database['public']['Tables']['manufacturers']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

interface ManufacturerWithProducts extends Manufacturer {
  products?: Product[];
}

interface ManufacturerViewProps {
  manufacturer: ManufacturerWithProducts;
  onBack: () => void;
}

type SortField = 'name' | 'model_no' | 'total_stock' | 'available_stock';
type SortOrder = 'asc' | 'desc';

function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    'bg-blue-100 text-blue-600',
    'bg-green-100 text-green-600',
    'bg-yellow-100 text-yellow-600',
    'bg-purple-100 text-purple-600',
    'bg-pink-100 text-pink-600',
    'bg-indigo-100 text-indigo-600',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

export function ManufacturerView({ manufacturer, onBack }: ManufacturerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  const getStockStatus = (product: Product) => {
    if (product.available_stock <= 0) return { status: 'Out of Stock', variant: 'destructive' as const };
    if (product.available_stock <= 10) return { status: 'Low Stock', variant: 'warning' as const };
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
          <ArrowUpDown className="h-4 w-4 ml-1" />
        )}
      </button>
    </TableHead>
  );

  const filteredAndSortedProducts = manufacturer.products
    ?.filter(product => {
      const searchMatch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model_no.toLowerCase().includes(searchTerm.toLowerCase());
      
      const stockMatch = 
        stockFilter === 'all' ||
        (stockFilter === 'low' && product.available_stock <= 10 && product.available_stock > 0) ||
        (stockFilter === 'out' && product.available_stock <= 0);

      return searchMatch && stockMatch;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const modifier = sortOrder === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * modifier;
      }
      
      return ((aValue as number) - (bValue as number)) * modifier;
    });

  const handleExport = () => {
    if (!manufacturer.products?.length) return;

    const exportData = manufacturer.products.map(product => ({
      'Model No': product.model_no,
      'Name': product.name,
      'Description': product.description || '',
      'Total Stock': product.total_stock,
      'Available Stock': product.available_stock,
      'Bad Stock': product.bad_stock,
      'Dead Stock': product.dead_stock,
      'Bookings': product.bookings,
      'Remarks': product.remarks || '',
      'Status': getStockStatus(product).status
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${manufacturer.factory_name}_products_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Manufacturers
      </Button>

      <div className="bg-card rounded-lg border p-6 space-y-6">
        <div className="flex items-start gap-6">
          <Avatar className={`h-16 w-16 items-center justify-center text-2xl ${getAvatarColor(manufacturer.factory_name)}`}>
            <span className="font-semibold">
              {getInitials(manufacturer.factory_name)}
            </span>
          </Avatar>
          <div className="flex-1 space-y-1">
            <h2 className="text-2xl font-bold">{manufacturer.factory_name}</h2>
            {manufacturer.contact_person && (
              <p className="text-muted-foreground flex items-center gap-2">
                <Factory className="w-4 h-4" />
                Contact: {manufacturer.contact_person}
              </p>
            )}
          </div>
        </div>

        {manufacturer.notes && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm whitespace-pre-wrap">{manufacturer.notes}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Product Inventory</h3>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Inventory
            </Button>
          </div>

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
            <Select value={stockFilter} onValueChange={(value: any) => setStockFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">S.No</TableHead>
                  <SortableHeader field="name">Product Name</SortableHeader>
                  <SortableHeader field="model_no">Model No</SortableHeader>
                  <TableHead>Status</TableHead>
                  <SortableHeader field="total_stock">Total Stock</SortableHeader>
                  <SortableHeader field="available_stock">Available</SortableHeader>
                  <TableHead>Bad Stock</TableHead>
                  <TableHead>Dead Stock</TableHead>
                  <TableHead>Bookings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedProducts?.map((product, index) => {
                  const { status, variant } = getStockStatus(product);
                  return (
                    <TableRow key={product.id} className="group">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{product.name}</div>
                          {product.remarks && (
                            <div className="text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              {product.remarks}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package2 className="w-4 h-4 text-muted-foreground" />
                          {product.model_no}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={variant}>{status}</Badge>
                      </TableCell>
                      <TableCell>{product.total_stock}</TableCell>
                      <TableCell>{product.available_stock}</TableCell>
                      <TableCell className="text-muted-foreground">{product.bad_stock}</TableCell>
                      <TableCell className="text-muted-foreground">{product.dead_stock}</TableCell>
                      <TableCell className="text-muted-foreground">{product.bookings}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}