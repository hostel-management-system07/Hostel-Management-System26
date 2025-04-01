
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Eye, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RoomWithStudents } from '@/types/room';

interface RoomsListProps {
  rooms: RoomWithStudents[];
  onEditRoom: (room: RoomWithStudents) => void;
  onDeleteRoom: (room: RoomWithStudents) => void;
  onViewMembers: (room: RoomWithStudents) => void;
}

const RoomsList: React.FC<RoomsListProps> = ({ 
  rooms, 
  onEditRoom, 
  onDeleteRoom,
  onViewMembers
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Room No.</TableHead>
          <TableHead>Block</TableHead>
          <TableHead>Floor</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Capacity</TableHead>
          <TableHead>Occupied</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Amenities</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rooms.map((room) => (
          <TableRow key={room.id}>
            <TableCell className="font-medium">{room.roomNumber}</TableCell>
            <TableCell>{room.block}</TableCell>
            <TableCell>{room.floor}</TableCell>
            <TableCell>{getRoomTypeBadge(room.type)}</TableCell>
            <TableCell>{room.capacity}</TableCell>
            <TableCell>{room.occupied || 0}</TableCell>
            <TableCell>{getStatusBadge(room.status)}</TableCell>
            <TableCell>
              <div className="max-w-[200px] truncate">
                {room.amenities && room.amenities.length > 0 ? 
                  room.amenities.join(', ') : 
                  'None'}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => onViewMembers(room)}
                  className="text-blue-500 hover:text-blue-700"
                  title="View Members"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => onEditRoom(room)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => onDeleteRoom(room)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default RoomsList;
