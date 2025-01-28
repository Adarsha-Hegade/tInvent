import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, Factory } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ManufacturerView } from './manufacturers/ManufacturerView';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity-logger';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

type Manufacturer = Database['public']['Tables']['manufacturers']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface ManufacturerWithProducts extends Manufacturer {
  products?: (Product & { category?: Category })[];
}

interface CategoryCount {
  name: string;
  count: number;
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

function truncateText(text: string, wordCount: number) {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= wordCount) return text;
  return words.slice(0, wordCount).join(' ') + '...';
}

function getCategoryCounts(products: (Product & { category?: Category })[]): CategoryCount[] {
  const counts = products.reduce((acc: { [key: string]: number }, product) => {
    const categoryName = product.category?.name || 'Uncategorized';
    acc[categoryName] = (acc[categoryName] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function ManufacturerManagement() {
  const [manufacturers, setManufacturers] = useState<ManufacturerWithProducts[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<ManufacturerWithProducts | null>(null);
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
            .select(`
              *,
              category:category_id(*)
            `)
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
        
        if (error) throw error;

        await logActivity({
          action_type: 'update',
          entity_type: 'manufacturer',
          entity_id: editingManufacturer.id,
          description: `Updated manufacturer ${data.factory_name}`,
          metadata: { before: editingManufacturer, after: data }
        });
        
        toast.success('Manufacturer updated successfully');
      } else {
        const { error } = await supabase
          .from('manufacturers')
          .insert([data]);
        
        if (error) throw error;

        toast.success('Manufacturer created successfully');
      }

      await loadManufacturers();
      setIsDialogOpen(false);
      setEditingManufacturer(null);
      reset();
    } catch (error: any) {
      toast.error(error.message);
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
    try {
      const { error } = await supabase.from('manufacturers').delete().eq('id', id);
      if (error) throw error;

      await logActivity({
        action_type: 'delete',
        entity_type: 'manufacturer',
        entity_id: id,
        description: 'Deleted manufacturer',
      });

      toast.success('Manufacturer deleted successfully');
      await loadManufacturers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (selectedManufacturer) {
    return (
      <ManufacturerView
        manufacturer={selectedManufacturer}
        onBack={() => setSelectedManufacturer(null)}
      />
    );
  }

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
        {manufacturers.map((manufacturer) => {
          const categoryCounts = getCategoryCounts(manufacturer.products || []);
          const totalProducts = manufacturer.products?.length || 0;

          return (
            <Card 
              key={manufacturer.id} 
              className="relative overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedManufacturer(manufacturer)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className={`h-12 w-12 items-center justify-center ${getAvatarColor(manufacturer.factory_name)}`}>
                        <span className="text-lg font-semibold">
                          {getInitials(manufacturer.factory_name)}
                        </span>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{manufacturer.factory_name}</h3>
                        {manufacturer.contact_person && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Factory className="w-4 h-4" />
                            {manufacturer.contact_person}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(manufacturer);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(manufacturer.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {manufacturer.notes && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        {truncateText(manufacturer.notes, 15)}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Product Categories</h4>
                      <Badge variant="secondary">
                        {totalProducts} product{totalProducts !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categoryCounts.map(({ name, count }) => (
                        <Badge key={name} variant="outline" className="flex items-center gap-1">
                          <span>{name}</span>
                          <span className="text-muted-foreground">({count})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}