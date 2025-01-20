import { supabase } from './supabase';
import type { Database } from './database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];

type ActivityLogParams = {
  action_type: 'create' | 'update' | 'delete';
  entity_type: string;
  entity_id: string;
  description: string;
  metadata?: any;
};

function getChangesDescription(before: any, after: any): string {
  const changes: string[] = [];
  
  Object.keys(after).forEach(key => {
    if (before[key] !== after[key] && key !== 'updated_at') {
      changes.push(`${key.replace('_', ' ')} from "${before[key]}" to "${after[key]}"`);
    }
  });
  
  return changes.join(', ');
}

export async function logActivity({
  action_type,
  entity_type,
  entity_id,
  description,
  metadata
}: ActivityLogParams) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  try {
    const { error } = await supabase.from('activity_logs').insert([{
      user_id: user.id,
      action_type,
      entity_type,
      entity_id,
      description,
      metadata
    }]);

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

export async function logProductChange(
  action: 'create' | 'update' | 'delete',
  product: Product,
  previousProduct?: Product
) {
  let description = '';
  
  switch (action) {
    case 'create':
      description = `Created new product ${product.name} (${product.model_no})`;
      break;
    case 'update':
      if (previousProduct) {
        const changes = getChangesDescription(previousProduct, product);
        description = `Updated product ${product.name} (${product.model_no}): ${changes}`;
      }
      break;
    case 'delete':
      description = `Deleted product ${product.name} (${product.model_no})`;
      break;
  }

  await logActivity({
    action_type: action,
    entity_type: 'product',
    entity_id: product.id,
    description,
    metadata: {
      before: previousProduct,
      after: product,
      changes: previousProduct ? getChangesDescription(previousProduct, product) : null
    }
  });
}

export async function logBookingChange(
  action: 'create' | 'update' | 'delete',
  booking: Booking & { 
    customer?: Customer,
    items?: Array<{ product?: Product, quantity: number }>
  }
) {
  let description = '';
  const itemsList = booking.items?.map(item => 
    `${item.quantity}x ${item.product?.name}`
  ).join(', ');

  switch (action) {
    case 'create':
      description = `Created new booking for ${booking.customer?.name} with items: ${itemsList}`;
      break;
    case 'update':
      description = `Updated booking for ${booking.customer?.name}`;
      break;
    case 'delete':
      description = `Deleted booking for ${booking.customer?.name}`;
      break;
  }

  await logActivity({
    action_type: action,
    entity_type: 'booking',
    entity_id: booking.id,
    description,
    metadata: {
      booking,
      items: booking.items,
      customer: booking.customer
    }
  });
}