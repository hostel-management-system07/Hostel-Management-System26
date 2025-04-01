
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  BellOff,
  CheckCheck,
  Mail,
  AlertCircle,
  Megaphone,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
  global?: boolean;
  userId?: string;
  link?: string;
}

const Notifications: React.FC = () => {
  const { userDetails } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userDetails?.id) {
      fetchNotifications();
    }
  }, [userDetails]);

  const fetchNotifications = async () => {
    if (!userDetails?.id) return;

    try {
      setLoading(true);
      
      // Create compound query to get user-specific and global notifications
      const userNotifications = query(
        collection(db, 'notifications'),
        where('userId', '==', userDetails.id),
        orderBy('createdAt', 'desc')
      );
      
      const globalNotifications = query(
        collection(db, 'notifications'),
        where('global', '==', true),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      // For admin users, also include notifications marked with role: 'admin'
      const adminNotifications = userDetails.role === 'admin' ? 
        query(
          collection(db, 'notifications'),
          where('role', '==', 'admin'),
          orderBy('createdAt', 'desc')
        ) : null;
      
      // Fetch notifications
      const [userSnap, globalSnap, adminSnap] = await Promise.all([
        getDocs(userNotifications),
        getDocs(globalNotifications),
        adminNotifications ? getDocs(adminNotifications) : Promise.resolve({ docs: [] })
      ]);
      
      const userDocs = userSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
      
      const globalDocs = globalSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
      
      const adminDocs = adminSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
      
      // Combine and filter out duplicates by ID
      const combinedNotifications = [...userDocs, ...globalDocs, ...adminDocs];
      const uniqueNotifications = Array.from(
        new Map(combinedNotifications.map(item => [item.id, item])).values()
      ) as Notification[];
      
      // Sort by createdAt (newest first)
      uniqueNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotifications(uniqueNotifications);
      
      // Create sample data if none exists
      if (uniqueNotifications.length === 0) {
        const sampleNotifications = [
          {
            title: "Welcome to Hostel Management System",
            message: "Thank you for using our system. Here you'll receive notifications about important events.",
            type: "welcome",
            global: true,
            read: false,
            createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
          },
          {
            title: "Fee Payment Reminder",
            message: "Your hostel fee payment is due in 7 days. Please clear your dues to avoid late charges.",
            type: "fee",
            userId: userDetails.id,
            read: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
          },
          {
            title: "New Announcement",
            message: "Hostel maintenance work will be conducted this weekend. Please check the announcements page for details.",
            type: "announcement",
            global: true,
            read: false,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
          }
        ];
        
        for (const notification of sampleNotifications) {
          await addDoc(collection(db, 'notifications'), {
            ...notification,
            createdAt: serverTimestamp()
          });
        }
        
        // Re-fetch after adding sample data
        return fetchNotifications();
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(notification => !notification.read);
    
    if (unreadNotifications.length === 0) {
      toast({
        title: "Info",
        description: "No unread notifications",
      });
      return;
    }
    
    try {
      // Update each notification in Firestore
      const updatePromises = unreadNotifications.map(notification => 
        updateDoc(doc(db, 'notifications', notification.id), { read: true })
      );
      
      await Promise.all(updatePromises);
      
      // Update local state
      setNotifications(notifications.map(notification => ({
        ...notification,
        read: true
      })));
      
      toast({
        title: "Success",
        description: `Marked ${unreadNotifications.length} notifications as read`,
      });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (notification: Notification) => {
    if (notification.read) return;
    
    try {
      await updateDoc(doc(db, 'notifications', notification.id), {
        read: true
      });
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="h-5 w-5 text-blue-500" />;
      case 'fee':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'email':
        return <Mail className="h-5 w-5 text-purple-500" />;
      case 'complaint':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'room-assignment':
      case 'room-booking':
        return <Bell className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-gray-500">
              Stay updated on hostel activities and announcements
            </p>
          </div>
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              Your latest updates and announcements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b last:border-b-0 ${
                      !notification.read ? 'bg-blue-50' : ''
                    } ${notification.link ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={() => {
                      markAsRead(notification);
                      if (notification.link) {
                        window.location.href = notification.link;
                      }
                    }}
                  >
                    <div className="flex">
                      <div className="flex-shrink-0 pt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="ml-3 flex-grow">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-medium ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center">
                            {!notification.read && (
                              <Badge className="mr-2 bg-blue-500">New</Badge>
                            )}
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              {getTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm ${!notification.read ? 'text-blue-700' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40">
                <BellOff className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500">No notifications found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
