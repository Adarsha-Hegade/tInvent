import { toast } from 'sonner';

type EntityType = 'product' | 'booking' | 'customer' | 'manufacturer';
type ActionType = 'create' | 'update' | 'delete';

const entityNames: Record<EntityType, string> = {
  product: 'Product',
  booking: 'Booking',
  customer: 'Customer',
  manufacturer: 'Manufacturer'
};

export const showSuccessToast = (entity: EntityType, action: ActionType) => {
  const entityName = entityNames[entity];
  const actionText = action === 'create' ? 'created' : action === 'update' ? 'updated' : 'deleted';
  toast.success(`${entityName} ${actionText} successfully`);
};

export const showErrorToast = (entity: EntityType, action: ActionType, error?: any) => {
  const entityName = entityNames[entity];
  const actionText = action === 'create' ? 'create' : action === 'update' ? 'update' : 'delete';
  const errorMessage = error?.message || `Unable to ${actionText} ${entityName.toLowerCase()}`;
  toast.error(`Error: ${errorMessage}`);
};

export const showLoadingToast = (entity: EntityType, action: ActionType) => {
  const entityName = entityNames[entity];
  const actionText = action === 'create' ? 'Creating' : action === 'update' ? 'Updating' : 'Deleting';
  return toast.loading(`${actionText} ${entityName.toLowerCase()}...`);
};