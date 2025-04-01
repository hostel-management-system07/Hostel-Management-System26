
import React from 'react';
import { serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { RoomType } from '@/types/room';

interface EditRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRoom: RoomType | null;
  onRoomUpdated: (updatedRoom: RoomType) => void;
}

interface FormData {
  roomNumber: string;
  capacity: number;
  floor: number;
  block: string;
  type: 'single' | 'double' | 'triple';
  amenities: string;
  status: 'available' | 'occupied' | 'maintenance';
}

const EditRoomDialog: React.FC<EditRoomDialogProps> = ({ 
  open, 
  onOpenChange, 
  selectedRoom,
  onRoomUpdated 
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = React.useState<FormData>({
    roomNumber: '',
    capacity: 1,
    floor: 1,
    block: '',
    type: 'single',
    amenities: '',
    status: 'available'
  });

  // Update form when selected room changes
  React.useEffect(() => {
    if (selectedRoom) {
      setFormData({
        roomNumber: selectedRoom.roomNumber,
        capacity: selectedRoom.capacity,
        floor: selectedRoom.floor,
        block: selectedRoom.block,
        type: selectedRoom.type,
        amenities: selectedRoom.amenities ? selectedRoom.amenities.join(', ') : '',
        status: selectedRoom.status
      });
    }
  }, [selectedRoom]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setFormData({
      ...formData,
      capacity: Math.max(1, value)
    });
  };
  
  const handleFloorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setFormData({
      ...formData,
      floor: Math.max(1, value)
    });
  };

  const handleEditRoom = async () => {
    if (!selectedRoom) return;
    
    try {
      if (!formData.roomNumber || !formData.block) {
        toast({
          title: "Error",
          description: "Room number and block are required",
          variant: "destructive",
        });
        return;
      }
      
      const amenitiesArray = formData.amenities
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      await updateDoc(doc(db, 'rooms', selectedRoom.id), {
        ...formData,
        amenities: amenitiesArray,
        updatedAt: serverTimestamp()
      });
      
      // Update local state via parent component
      const updatedRoom = {
        ...selectedRoom,
        ...formData,
        amenities: amenitiesArray
      };
      
      onRoomUpdated(updatedRoom);
      
      toast({
        title: "Success",
        description: "Room updated successfully",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating room:', error);
      toast({
        title: "Error",
        description: "Failed to update room",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Room</DialogTitle>
          <DialogDescription>
            Update room details
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-roomNumber">Room Number</Label>
              <Input
                id="edit-roomNumber"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-block">Block</Label>
              <Input
                id="edit-block"
                name="block"
                value={formData.block}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-floor">Floor</Label>
              <Input
                id="edit-floor"
                name="floor"
                type="number"
                min="1"
                value={formData.floor}
                onChange={handleFloorChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-capacity">Capacity</Label>
              <Input
                id="edit-capacity"
                name="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={handleCapacityChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-type">Room Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleSelectChange('type', value)}
            >
              <SelectTrigger id="edit-type">
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="double">Double</SelectItem>
                <SelectItem value="triple">Triple</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: 'available' | 'occupied' | 'maintenance') => 
                handleSelectChange('status', value)
              }
            >
              <SelectTrigger id="edit-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-amenities">Amenities (comma separated)</Label>
            <Textarea
              id="edit-amenities"
              name="amenities"
              value={formData.amenities}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleEditRoom}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoomDialog;
