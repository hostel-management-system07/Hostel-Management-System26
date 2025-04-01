
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { RoomWithStudents } from '@/types/room';

interface ViewMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRoom: RoomWithStudents | null;
}

const ViewMembersDialog: React.FC<ViewMembersDialogProps> = ({ 
  open, 
  onOpenChange, 
  selectedRoom
}) => {
  console.log("Selected room in ViewMembers:", selectedRoom);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Room Members</DialogTitle>
          <DialogDescription>
            {selectedRoom && `Room ${selectedRoom.roomNumber}, Block ${selectedRoom.block}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {selectedRoom && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Home className="h-5 w-5 text-blue-500" />
                  <h3 className="font-medium">Room Details</h3>
                </div>
                <Badge className={
                  selectedRoom.status === 'available' ? 'bg-green-500' : 
                  selectedRoom.status === 'occupied' ? 'bg-blue-500' : 'bg-yellow-500'
                }>
                  {selectedRoom.status.charAt(0).toUpperCase() + selectedRoom.status.slice(1)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><span className="font-medium">Room Number:</span> {selectedRoom.roomNumber}</p>
                <p><span className="font-medium">Block:</span> {selectedRoom.block}</p>
                <p><span className="font-medium">Floor:</span> {selectedRoom.floor}</p>
                <p><span className="font-medium">Type:</span> {selectedRoom.type}</p>
                <p><span className="font-medium">Capacity:</span> {selectedRoom.capacity}</p>
                <p><span className="font-medium">Occupied:</span> {selectedRoom.occupied || 0}</p>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Students ({selectedRoom.studentDetails?.length || 0})</h3>
                
                {selectedRoom.studentDetails && selectedRoom.studentDetails.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRoom.studentDetails.map((student, index) => (
                      <div key={student.id || index} className="bg-gray-50 border rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{student.name || "Unknown Student"}</h4>
                            <p className="text-xs text-gray-500">{student.registrationNumber || "No Registration Number"}</p>
                          </div>
                          <Badge variant="outline">{student.year ? `Year ${student.year}` : 'No Year'}</Badge>
                        </div>
                        <div className="mt-2 text-sm">
                          <p><span className="text-gray-500">Email:</span> {student.email || "No Email"}</p>
                          {student.department && (
                            <p><span className="text-gray-500">Department:</span> {student.department}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No students assigned to this room yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewMembersDialog;
