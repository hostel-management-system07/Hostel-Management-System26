
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Clipboard, CreditCard, Bell, Settings, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const Sidebar: React.FC = () => {
  const { pathname } = useLocation();
  const { userDetails, signOut } = useAuth();
  const isAdmin = userDetails?.role === 'admin';

  const studentNavItems = [
    { name: 'Dashboard', href: '/student-dashboard', icon: Home },
    { name: 'Room Booking', href: '/room-booking', icon: Users },
    { name: 'My Complaints', href: '/my-complaints', icon: Clipboard },
    { name: 'Fee Payment', href: '/fee-payment', icon: CreditCard },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const adminNavItems = [
    { name: 'Dashboard', href: '/admin-dashboard', icon: Home },
    { name: 'Manage Rooms', href: '/manage-rooms', icon: Users },
    { name: 'Manage Students', href: '/manage-students', icon: Users },
    { name: 'Complaints', href: '/complaints', icon: Clipboard },
    { name: 'Fee Management', href: '/fee-management', icon: CreditCard },
    { name: 'Announcements', href: '/announcements', icon: Bell },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <aside className="bg-white w-64 min-h-screen shadow-sm border-r">
      <div className="p-4">
        <h2 className="text-2xl font-bold text-blue-700">HMS</h2>
        <p className="text-gray-500 text-sm">Hostel Management System</p>
      </div>
      
      <div className="px-4 mt-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {isAdmin ? 'ADMIN MENU' : 'MAIN MENU'}
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-2 py-2 text-sm rounded-lg",
                pathname === item.href
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="absolute bottom-0 w-64 p-4 border-t">
        <button
          onClick={() => signOut()}
          className="flex items-center w-full px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
