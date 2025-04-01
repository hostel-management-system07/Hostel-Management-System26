
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Home } from 'lucide-react';
import { RoomWithStudents } from '@/types/room';

interface RoomCardProps {
  room: RoomWithStudents;
  onManage: (room: RoomWithStudents) => void;
  onAssignStudents?: (roomId: string) => void;
  cardType?: 'occupied' | 'available';
}

const RoomCard: React.FC<RoomCardProps> = ({ 
  room, 
  onManage, 
  onAssignStudents,
  cardType = 'occupied'
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500">Available</Badge>;
      case 'occupied':
        return <Badge className="bg-blue-500">Occupied</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-500">Maintenance</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  const getRoomTypeBadge = (type: string) => {
    switch (type) {
      case 'single':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Single</Badge>;
      case 'double':
        return <Badge variant="outline" className="border-green-500 text-green-500">Double</Badge>;
      case 'triple':
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Triple</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (cardType === 'available') {
    return (
      <Card className="border border-green-100">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Room {room.roomNumber}</CardTitle>
            {getStatusBadge(room.status)}
          </div>
          <CardDescription>
            Block {room.block}, Floor {room.floor}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Type:</span>
            <span>{getRoomTypeBadge(room.type)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Capacity:</span>
            <span>{room.capacity}</span>
          </div>
          <div>
            <span className="text-sm">Amenities:</span>
            <p className="text-xs text-gray-500">
              {room.amenities && room.amenities.length > 0 ? 
                room.amenities.join(', ') : 
                'None'}
            </p>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-green-600 border-green-600 hover:bg-green-50"
            onClick={() => onAssignStudents && onAssignStudents(room.id)}
          >
            Assign Students
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border border-blue-100">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Home className="h-5 w-5 text-blue-500" />
            <CardTitle>Room {room.roomNumber}</CardTitle>
          </div>
          {getStatusBadge(room.status)}
        </div>
        <CardDescription>
          Block {room.block}, Floor {room.floor} • {getRoomTypeBadge(room.type)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm mb-2">
          <span className="font-medium">Capacity:</span> {room.occupied || 0}/{room.capacity}
        </p>
        <h4 className="font-medium text-sm mb-1">Students:</h4>
        <div className="space-y-1">
          {room.studentDetails && room.studentDetails.length > 0 ? (
            room.studentDetails.map((student, index) => (
              <div key={index} className="text-sm p-2 bg-blue-50 rounded flex justify-between items-center">
                <span>{student.name}</span>
                <span className="text-xs text-gray-500">{student.registrationNumber}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No student details available</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={() => onManage(room)}
        >
          Manage Room
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoomCard;
