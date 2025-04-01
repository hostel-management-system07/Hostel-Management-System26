
import React from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { RoomType } from '@/types/room';

interface DeleteRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRoom: RoomType | null;
  onRoomDeleted: (roomId: string) => void;
}

const DeleteRoomDialog: React.FC<DeleteRoomDialogProps> = ({ 
  open, 
  onOpenChange, 
  selectedRoom,
  onRoomDeleted
}) => {
  const { toast } = useToast();

  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    
    try {
      await deleteDoc(doc(db, 'rooms', selectedRoom.id));
      
      onRoomDeleted(selectedRoom.id);
      
      toast({
        title: "Success",
        description: "Room deleted successfully",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Room</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this room? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        {selectedRoom && (
          <div className="py-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium mb-2">Room Information</h4>
              <p><span className="font-medium">Room Number:</span> {selectedRoom.roomNumber}</p>
              <p><span className="font-medium">Block:</span> {selectedRoom.block}</p>
              <p><span className="font-medium">Floor:</span> {selectedRoom.floor}</p>
              <p><span className="font-medium">Status:</span> {selectedRoom.status}</p>
            </div>
            
            {selectedRoom.status === 'occupied' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center">
                <AlertTriangle className="text-yellow-500 mr-2" />
                <p className="text-sm">This room is currently occupied. You must relocate or remove all residents before deleting.</p>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteRoom}
            disabled={selectedRoom?.status === 'occupied'}
          >
            Delete Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteRoomDialog;
