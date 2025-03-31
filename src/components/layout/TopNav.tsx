
import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const TopNav: React.FC = () => {
  const { userDetails } = useAuth();
  const nameInitial = userDetails?.name?.charAt(0) || 'U';

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
          <button className="relative p-1 text-gray-400 hover:text-gray-600">
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          
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
