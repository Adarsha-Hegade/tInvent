import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, Factory, Package2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Manufacturer = Database['public']['Tables']['manufacturers']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

interface ManufacturerWithProducts extends Manufacturer {
  products?: Product[];
}

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

export function ManufacturerManagement() {
  const [manufacturers, setManufacturers] = useState<ManufacturerWithProducts[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm<Manufacturer>();

  useEffect(() => {
    loadManufacturers();
  }, []);

  const loadManufacturers = async () => {
    const { data: manufacturersData } = await supabase
      .from('manufacturers')
      .select('*');

    if (manufacturersData) {
      const manufacturersWithProducts = await Promise.all(
        manufacturersData.map(async (manufacturer) => {
          const { data: products } = await supabase
            .from('products')
            .select('*')
            .eq('manufacturer_id', manufacturer.id);
          
          return {
            ...manufacturer,
            products: products || [],
          };
        })
      );
      setManufacturers(manufacturersWithProducts);
    }
  };

  const onSubmit = async (data: Partial<Manufacturer>) => {
    try {
      if (editingManufacturer) {
        const { error } = await supabase
          .from('manufacturers')
          .update(data)
          .eq('id', editingManufacturer.id);
        
        if (!error) {
          await loadManufacturers();
          setIsDialogOpen(false);
          setEditingManufacturer(null);
          reset();
        }
      } else {
        const { error } = await supabase
          .from('manufacturers')
          .insert([data]);
        
        if (!error) {
          await loadManufacturers();
          setIsDialogOpen(false);
          reset();
        }
      }
    } catch (error) {
      console.error('Error saving manufacturer:', error);
    }
  };

  const handleEdit = (manufacturer: Manufacturer) => {
    setEditingManufacturer(manufacturer);
    setValue('factory_name', manufacturer.factory_name);
    setValue('contact_person', manufacturer.contact_person || '');
    setValue('notes', manufacturer.notes || '');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('manufacturers').delete().eq('id', id);
    if (!error) {
      await loadManufacturers();
    }
  };

  const getStockStatus = (product: Product) => {
    const availableStock = product.available_stock;
    if (availableStock <= 0) return { status: 'Out of Stock', variant: 'destructive' as const };
    if (availableStock <= 10) return { status: 'Low Stock', variant: 'warning' as const };
    return { status: 'In Stock', variant: 'default' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manufacturer Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingManufacturer(null);
            reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Manufacturer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingManufacturer ? 'Edit Manufacturer' : 'Add New Manufacturer'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label>Factory Name</label>
                  <Input {...register('factory_name')} required />
                </div>
                <div className="space-y-2">
                  <label>Contact Person</label>
                  <Input {...register('contact_person')} />
                </div>
                <div className="space-y-2">
                  <label>Notes</label>
                  <Textarea {...register('notes')} />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingManufacturer ? 'Update Manufacturer' : 'Add Manufacturer'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {manufacturers.map((manufacturer) => (
          <Card key={manufacturer.id} className="relative overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className={`h-12 w-12 ${getAvatarColor(manufacturer.factory_name)}`}>
                      <span className="text-lg font-semibold">
                        {getInitials(manufacturer.factory_name)}
                      </span>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{manufacturer.factory_name}</h3>
                      {manufacturer.contact_person && (
                        <p className="text-sm text-muted-foreground">
                          Contact: {manufacturer.contact_person}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(manufacturer)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(manufacturer.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {manufacturer.notes && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm">{manufacturer.notes}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Products</h4>
                    <Badge variant="secondary">
                      {manufacturer.products?.length || 0} products
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {manufacturer.products?.map((product) => {
                      const { status, variant } = getStockStatus(product);
                      return (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center space-x-2">
                            <Package2 className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.model_no}
                              </p>
                            </div>
                          </div>
                          <Badge variant={variant}>{status}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}