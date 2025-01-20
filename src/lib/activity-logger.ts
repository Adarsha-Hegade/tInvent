import { supabase } from './supabase';

type ActivityLogParams = {
  action_type: 'create' | 'update' | 'delete';
  entity_type: string;
  entity_id: string;
  description: string;
  metadata?: any;
};

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

  await supabase.from('activity_logs').insert([{
    user_id: user.id,
    action_type,
    entity_type,
    entity_id,
    description,
    metadata
  }]);
}