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
}

export function NotificationDialog() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get current user's email
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email);
      }
    });
  }, []);

  const fetchLogs = async () => {
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
      setLogs(logsData);
      setUnreadCount(logsData.length);
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
            {JSON.stringify(metadata.changes, null, 2)}
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
                {item.quantity}x {item.product?.name || item.product_id}
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
                    <span className="text-sm font-medium">
                      {log.user_id === userEmail ? 'You' : 'Another user'}
                    </span>
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