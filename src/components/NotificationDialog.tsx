import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  description: string;
  metadata: any;
  created_at: string;
  user_email?: string;
}

export function NotificationDialog() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchLogs = async () => {
    // First, get the activity logs
    const { data: logsData, error: logsError } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (logsError) {
      console.error('Error fetching logs:', logsError);
      return;
    }

    if (logsData) {
      // Then, get the user emails for each unique user_id
      const userIds = [...new Set(logsData.map(log => log.user_id))];
      
      // Get emails directly from auth.users
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
        perPage: userIds.length,
        page: 1,
        filters: {
          id: {
            in: userIds
          }
        }
      });

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Create a map of user_id to email
      const userMap = (usersData?.users || []).reduce((acc, user) => {
        acc[user.id] = user.email;
        return acc;
      }, {} as Record<string, string>);

      // Combine the logs with user emails
      const logsWithUsers = logsData.map(log => ({
        ...log,
        user_email: userMap[log.user_id] || 'Unknown User'
      }));

      setLogs(logsWithUsers);
      setUnreadCount(logsWithUsers.length);
    }
  };

  useEffect(() => {
    fetchLogs();

    const subscription = supabase
      .channel('activity_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatMetadata = (metadata: any) => {
    if (!metadata) return null;

    if (metadata.changes) {
      return (
        <div className="mt-2 text-sm">
          <strong>Changes:</strong>
          <pre className="mt-1 p-2 bg-gray-50 rounded-md overflow-x-auto">
            {metadata.changes}
          </pre>
        </div>
      );
    }

    if (metadata.items) {
      return (
        <div className="mt-2 text-sm">
          <strong>Items:</strong>
          <ul className="mt-1 list-disc list-inside">
            {metadata.items.map((item: any, index: number) => (
              <li key={index}>
                {item.quantity}x {item.product?.name}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Activity Log</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col space-y-2 p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getActionColor(log.action_type)}>
                      {log.action_type}
                    </Badge>
                    <span className="text-sm font-medium">{log.user_email}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm">{log.description}</p>
                {formatMetadata(log.metadata)}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}