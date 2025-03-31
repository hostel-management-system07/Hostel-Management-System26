
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, CheckCircle, Clock, AlertTriangle, Info, MessageCircle, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ChatBot from '@/components/ChatBot';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'important' | 'fee' | 'complaint' | 'announcement';
  createdAt: string;
  read: boolean;
}

const Notifications: React.FC = () => {
  const { userDetails } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [userDetails?.id]);

  const fetchNotifications = async () => {
    if (!userDetails?.id) return;
    
    setLoading(true);
    try {
      let q = query(
        collection(db, 'notifications'),
        where('userId', '==', userDetails.id),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      // If no user-specific notifications, get global notifications
      const globalQuery = query(
        collection(db, 'notifications'),
        where('global', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const globalSnapshot = await getDocs(globalQuery);
      
      let notificationsData: Notification[] = [];
      
      querySnapshot.forEach((doc) => {
        notificationsData.push({
          id: doc.id,
          ...doc.data()
        } as Notification);
      });
      
      globalSnapshot.forEach((doc) => {
        notificationsData.push({
          id: doc.id,
          ...doc.data()
        } as Notification);
      });
      
      // If no notifications found, create sample data
      if (notificationsData.length === 0) {
        const sampleNotifications = [
          {
            title: 'Welcome to the Hostel',
            message: 'Thank you for joining our hostel. We hope you have a pleasant stay.',
            type: 'info',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            userId: userDetails.id,
            read: true
          },
          {
            title: 'Fee Payment Reminder',
            message: 'Your hostel fee is due in 7 days. Please make the payment before the due date to avoid late fees.',
            type: 'fee',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            userId: userDetails.id,
            read: false
          },
          {
            title: 'Maintenance Notice',
            message: 'The water supply will be temporarily disconnected on Sunday from 10 AM to 2 PM for maintenance work.',
            type: 'announcement',
            global: true,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            read: false
          },
          {
            title: 'Complaint Update',
            message: 'Your complaint regarding the water heater has been addressed. Please let us know if you face any further issues.',
            type: 'complaint',
            createdAt: new Date().toISOString(),
            userId: userDetails.id,
            read: false
          }
        ];
        
        for (const notification of sampleNotifications) {
          await addDoc(collection(db, 'notifications'), {
            ...notification,
            createdAt: serverTimestamp()
          });
        }
        
        // Refetch after creating sample data
        return fetchNotifications();
      }
      
      // Sort by date
      notificationsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
      
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      ));
      
      toast({
        title: 'Notification marked as read',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      for (const notification of notifications.filter(n => !n.read)) {
        await updateDoc(doc(db, 'notifications', notification.id), {
          read: true
        });
      }
      
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
      
      toast({
        title: 'All notifications marked as read',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notifications',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'important':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'fee':
        return <Clock className="h-5 w-5 text-purple-500" />;
      case 'complaint':
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case 'announcement':
        return <Megaphone className="h-5 w-5 text-blue-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationClass = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'important':
        return 'border-red-200 bg-red-50';
      case 'fee':
        return 'border-purple-200 bg-purple-50';
      case 'complaint':
        return 'border-green-200 bg-green-50';
      case 'announcement':
        return 'border-blue-200 bg-blue-50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const filterNotifications = (notifications: Notification[]) => {
    if (!filter) return notifications;
    return notifications.filter(notification => notification.type === filter);
  };

  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-gray-500">Stay updated with the latest hostel announcements</p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <CheckCircle className="mr-2 h-4 w-4" /> Mark All as Read
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            variant={filter === null ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilter(null)}
          >
            All
          </Button>
          <Button 
            variant={filter === 'announcement' ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilter('announcement')}
          >
            <Megaphone className="h-4 w-4 mr-1" /> Announcements
          </Button>
          <Button 
            variant={filter === 'fee' ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilter('fee')}
          >
            <Clock className="h-4 w-4 mr-1" /> Fee Reminders
          </Button>
          <Button 
            variant={filter === 'complaint' ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilter('complaint')}
          >
            <MessageCircle className="h-4 w-4 mr-1" /> Complaints
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-blue-500" />
              Notification Center
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-blue-500">{unreadCount} new</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Stay updated with important hostel information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
              </div>
            ) : filterNotifications(notifications).length > 0 ? (
              <div className="space-y-4">
                {filterNotifications(notifications).map((notification) => (
                  <div 
                    key={notification.id}
                    className={cn(
                      "p-4 border rounded-lg relative",
                      notification.read ? "border-gray-200" : getNotificationClass(notification.type)
                    )}
                  >
                    <div className="flex space-x-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={cn(
                            "font-medium",
                            !notification.read && "font-semibold"
                          )}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </span>
                            {!notification.read && (
                              <Badge className="ml-2 bg-blue-500">New</Badge>
                            )}
                          </div>
                        </div>
                        <p className={cn(
                          "mt-1 text-gray-600",
                          !notification.read && "text-gray-800"
                        )}>
                          {notification.message}
                        </p>
                        {!notification.read && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => markAsRead(notification.id)} 
                            className="mt-2 text-blue-600"
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
                <p className="text-sm text-gray-500 text-center mt-1">
                  {filter 
                    ? `You don't have any ${filter} notifications at the moment.` 
                    : "You're all caught up! There are no new notifications."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ChatBot />
    </DashboardLayout>
  );
};

export default Notifications;
