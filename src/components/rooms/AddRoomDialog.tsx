
import React from 'react';
import { serverTimestamp, addDoc, collection } from 'firebase/firestore';
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

interface AddRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomAdded: (newRoom: any) => void;
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

const AddRoomDialog: React.FC<AddRoomDialogProps> = ({ open, onOpenChange, onRoomAdded }) => {
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

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      capacity: 1,
      floor: 1,
      block: '',
      type: 'single',
      amenities: '',
      status: 'available'
    });
  };

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

  const handleAddRoom = async () => {
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
      
      const newRoom = {
        ...formData,
        amenities: amenitiesArray,
        occupied: 0,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'rooms'), newRoom);
      
      // Create the room object with ID for the parent component
      const addedRoom = {
        id: docRef.id,
        ...formData,
        amenities: amenitiesArray,
        occupied: 0,
        students: [],
        studentDetails: []
      };
      
      toast({
        title: "Success",
        description: "Room added successfully",
      });
      
      onRoomAdded(addedRoom);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error adding room:', error);
      toast({
        title: "Error",
        description: "Failed to add room",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Room</DialogTitle>
          <DialogDescription>
            Enter the details for the new room
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number</Label>
              <Input
                id="roomNumber"
                name="roomNumber"
                placeholder="e.g. 101"
                value={formData.roomNumber}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="block">Block</Label>
              <Input
                id="block"
                name="block"
                placeholder="e.g. A"
                value={formData.block}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                name="floor"
                type="number"
                min="1"
                value={formData.floor}
                onChange={handleFloorChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={handleCapacityChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Room Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleSelectChange('type', value)}
            >
              <SelectTrigger>
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
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: 'available' | 'occupied' | 'maintenance') => 
                handleSelectChange('status', value)
              }
            >
              <SelectTrigger>
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
            <Label htmlFor="amenities">Amenities (comma separated)</Label>
            <Textarea
              id="amenities"
              name="amenities"
              placeholder="e.g. Wi-Fi, Attached Bathroom, Study Table"
              value={formData.amenities}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAddRoom}>Add Room</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddRoomDialog;
