
import React, { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const TopNav: React.FC = () => {
  const { userDetails } = useAuth();
  const nameInitial = userDetails?.name?.charAt(0) || 'U';
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notificationsQuery = query(
          collection(db, 'notifications'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(notificationsQuery);
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  const unreadNotificationsCount = notifications.filter(notif => !notif.read).length;

  return (
    <header className="bg-white border-b px-6 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center w-1/2">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-1 text-gray-400 hover:text-gray-600">
                <Bell className="h-6 w-6" />
                {unreadNotificationsCount > 0 && (
                  <Badge className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center p-0 text-xs">
                    {unreadNotificationsCount}
                  </Badge>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex justify-between items-center p-2 border-b">
                <h4 className="font-semibold">Notifications</h4>
                <button className="text-xs text-blue-500 hover:text-blue-700">
                  Mark all as read
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <DropdownMenuItem key={notif.id} className="flex flex-col items-start p-3 border-b">
                      <div className="flex w-full justify-between">
                        <span className="font-medium">{notif.title}</span>
                        {!notif.read && <Badge className="ml-2">New</Badge>}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{notif.message}</p>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <p className="p-4 text-sm text-center text-gray-500">No notifications</p>
                )}
              </div>
              <div className="p-2 border-t text-center">
                <button className="text-sm text-blue-500 hover:text-blue-700">
                  View all notifications
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium">{userDetails?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{userDetails?.role}</p>
            </div>
            
            <Avatar className="h-8 w-8">
              <AvatarImage src={userDetails?.profilePicture} />
              <AvatarFallback>{nameInitial}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
