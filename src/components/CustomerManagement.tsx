import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Customer = Database['public']['Tables']['customers']['Row'];

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<Customer>();

  useEffect(() => {
    loadCustomers();
  }, []); // Load customers when component mounts

  const loadCustomers = async () => {
    const { data, error } = await supabase.from('customers').select('*');
    if (data) setCustomers(data);
    if (error) console.error('Error loading customers:', error);
  };

  const onSubmit = async (data: Partial<Customer>) => {
    const { error } = await supabase.from('customers').insert([data]);
    if (error) {
      console.error('Error adding customer:', error);
    } else {
      await loadCustomers();
      setIsAddDialogOpen(false);
      reset();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Customer Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label>Name</label>
                  <Input {...register('name')} required />
                </div>
                <div className="space-y-2">
                  <label>Email</label>
                  <Input type="email" {...register('email')} />
                </div>
                <div className="space-y-2">
                  <label>Phone</label>
                  <Input {...register('phone')} />
                </div>
                <div className="space-y-2">
                  <label>Address</label>
                  <Input {...register('address')} />
                </div>
              </div>
              <Button type="submit" className="w-full">Add Customer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.address}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}