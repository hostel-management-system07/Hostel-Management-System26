import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Home, 
  Search, 
  Plus, 
  Edit, 
  Users, 
  Trash, 
  Check,
  AlertTriangle
} from 'lucide-react';
import { Room, RoomWithStudents, User } from '@/types';

interface AmenityOption {
  id: string;
  label: string;
}

const ManageRooms: React.FC = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<RoomWithStudents[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomWithStudents[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithStudents | null>(null);
  
  const amenityOptions: AmenityOption[] = [
    { id: "wifi", label: "Wi-Fi" },
    { id: "ac", label: "Air Conditioning" },
    { id: "bathroom", label: "Attached Bathroom" },
    { id: "desk", label: "Study Desk" },
    { id: "wardrobe", label: "Wardrobe" },
    { id: "fridge", label: "Mini-Fridge" },
    { id: "balcony", label: "Balcony" }
  ];
  
  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    capacity: '1',
    occupied: '0',
    floor: '1',
    block: 'A',
    type: 'single' as 'single' | 'double' | 'triple',
    amenities: ["wifi", "desk", "wardrobe"],
    status: 'available' as 'available' | 'occupied' | 'maintenance',
    rentPerMonth: '5000'
  });
  
  const blocks = [...new Set(rooms.map(room => room.block))].sort();
  const floors = [...new Set(rooms.filter(room => room.floor !== undefined).map(room => room.floor))].sort((a, b) => a - b);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [searchTerm, selectedBlock, selectedFloor, selectedStatus, rooms]);

  const filterRooms = () => {
    let filtered = [...rooms];
    
    if (searchTerm) {
      filtered = filtered.filter(room => 
        room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedBlock !== 'all') {
      filtered = filtered.filter(room => room.block === selectedBlock);
    }
    
    if (selectedFloor !== 'all') {
      filtered = filtered.filter(room => room.floor === parseInt(selectedFloor));
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(room => room.status === selectedStatus);
    }
    
    setFilteredRooms(filtered);
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'rooms'));
      
      if (querySnapshot.empty) {
        const sampleRooms = generateSampleRooms();
        setRooms(sampleRooms);
        setFilteredRooms(sampleRooms);
        setLoading(false);
        return;
      }
      
      const roomsData: RoomWithStudents[] = [];
      
      querySnapshot.forEach((doc) => {
        roomsData.push({
          id: doc.id,
          ...doc.data(),
          students: []
        } as RoomWithStudents);
      });
      
      roomsData.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
      
      setRooms(roomsData);
      setFilteredRooms(roomsData);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const generateSampleRooms = () => {
    const sampleRooms: RoomWithStudents[] = [];
    
    const blocks = ['A', 'B', 'C'];
    const floors = [1, 2, 3];
    const types = ['single', 'double', 'triple'] as const;
    let roomCount = 0;
    
    blocks.forEach(block => {
      floors.forEach(floor => {
        for (let i = 1; i <= 3; i++) {
          roomCount++;
          const roomNumber = `${block}${floor}0${i}`;
          const roomType = types[Math.floor(Math.random() * types.length)];
          const capacity = roomType === 'single' ? 1 : roomType === 'double' ? 2 : 3;
          const occupied = Math.floor(Math.random() * (capacity + 1));
          const status = occupied === 0 ? 'available' : (occupied === capacity ? 'occupied' : 'available');
          
          sampleRooms.push({
            id: `room${roomCount}`,
            roomNumber,
            capacity,
            occupied,
            floor,
            block,
            type: roomType,
            amenities: ["wifi", "desk", "wardrobe"],
            status: status as 'available' | 'occupied' | 'maintenance',
            rentPerMonth: 5000,
            students: []
          });
        }
      });
    });
    
    return sampleRooms;
  };

  const handleAddRoom = async () => {
    try {
      const newRoom = {
        roomNumber: roomForm.roomNumber,
        capacity: parseInt(roomForm.capacity),
        occupied: parseInt(roomForm.occupied),
        floor: parseInt(roomForm.floor),
        block: roomForm.block,
        type: roomForm.type,
        amenities: roomForm.amenities,
        status: roomForm.status,
        createdAt: serverTimestamp(),
        rentPerMonth: parseInt(roomForm.rentPerMonth),
        students: []
      };
      
      const docRef = await addDoc(collection(db, 'rooms'), newRoom);
      
      const addedRoom: RoomWithStudents = {
        id: docRef.id,
        ...newRoom,
        students: []
      };
      
      setRooms([...rooms, addedRoom]);
      
      toast({
        title: "Success",
        description: `Room ${roomForm.roomNumber} added successfully`,
      });
      
      setRoomForm({
        roomNumber: '',
        capacity: '1',
        occupied: '0',
        floor: '1',
        block: 'A',
        type: 'single',
        amenities: ["wifi", "desk", "wardrobe"],
        status: 'available',
        rentPerMonth: '5000'
      });
      
      setShowAddDialog(false);
    } catch (error) {
      console.error("Error adding room:", error);
      toast({
        title: "Error",
        description: "Failed to add room",
        variant: "destructive",
      });
    }
  };

  const handleEditRoom = async () => {
    if (!selectedRoom) return;
    
    try {
      const updatedRoom = {
        roomNumber: roomForm.roomNumber,
        capacity: parseInt(roomForm.capacity),
        occupied: parseInt(roomForm.occupied),
        floor: parseInt(roomForm.floor),
        block: roomForm.block,
        type: roomForm.type,
        amenities: roomForm.amenities,
        status: roomForm.status,
        rentPerMonth: parseInt(roomForm.rentPerMonth)
      };
      
      await updateDoc(doc(db, 'rooms', selectedRoom.id), updatedRoom);
      
      const updatedRooms = rooms.map(room => 
        room.id === selectedRoom.id
          ? { ...room, ...updatedRoom }
          : room
      ) as RoomWithStudents[];
      
      setRooms(updatedRooms);
      
      toast({
        title: "Success",
        description: `Room ${roomForm.roomNumber} updated successfully`,
      });
      
      setShowEditDialog(false);
    } catch (error) {
      console.error("Error updating room:", error);
      toast({
        title: "Error",
        description: "Failed to update room",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (room: RoomWithStudents) => {
    setSelectedRoom(room);
    setRoomForm({
      roomNumber: room.roomNumber,
      capacity: room.capacity.toString(),
      occupied: room.occupied.toString(),
      floor: room.floor.toString(),
      block: room.block,
      type: room.type,
      amenities: room.amenities,
      status: room.status,
      rentPerMonth: (room.rentPerMonth || 5000).toString()
    });
    setShowEditDialog(true);
  };

  const handleDeleteRoom = async (room: RoomWithStudents) => {
    if (room.occupied > 0) {
      toast({
        title: "Cannot Delete",
        description: "Room has occupants. Please relocate them first.",
        variant: "destructive",
      });
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete Room ${room.roomNumber}?`)) {
      try {
        await updateDoc(doc(db, 'rooms', room.id), {
          deleted: true,
          status: 'maintenance'
        });
        
        const updatedRooms = rooms.filter(r => r.id !== room.id);
        setRooms(updatedRooms);
        
        toast({
          title: "Success",
          description: `Room ${room.roomNumber} deleted successfully`,
        });
      } catch (error) {
        console.error("Error deleting room:", error);
        toast({
          title: "Error",
          description: "Failed to delete room",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleAmenity = (amenityId: string) => {
    if (roomForm.amenities.includes(amenityId)) {
      setRoomForm({
        ...roomForm,
        amenities: roomForm.amenities.filter(id => id !== amenityId)
      });
    } else {
      setRoomForm({
        ...roomForm,
        amenities: [...roomForm.amenities, amenityId]
      });
    }
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Room Management</h1>
            <p className="text-gray-500">
              Manage hostel rooms and occupancy
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Room
          </Button>
        </div>

        <Tabs defaultValue="rooms">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rooms">Room List</TabsTrigger>
            <TabsTrigger value="stats">Room Statistics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rooms" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Room List</CardTitle>
                    <CardDescription>
                      View and manage all hostel rooms
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search rooms..."
                        className="pl-8 w-40 md:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Block" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Blocks</SelectItem>
                        {blocks.map((block) => (
                          <SelectItem key={block} value={block}>Block {block}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Floor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Floors</SelectItem>
                        {floors.map((floor) => (
                          <SelectItem key={floor} value={floor.toString()}>Floor {floor}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Fully Occupied</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                  </div>
                ) : filteredRooms.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room</TableHead>
                        <TableHead>Block & Floor</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Occupancy</TableHead>
                        <TableHead>Amenities</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRooms.map((room) => (
                        <TableRow key={room.id}>
                          <TableCell className="font-medium">{room.roomNumber}</TableCell>
                          <TableCell>Block {room.block}, Floor {room.floor}</TableCell>
                          <TableCell className="capitalize">{room.type}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="mr-2 h-4 w-4 text-gray-500" />
                              <span>{room.occupied}/{room.capacity}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {room.amenities.map((amenity, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {amenityOptions.find(a => a.id === amenity)?.label || amenity}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {room.status === 'available' && (
                              <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>
                            )}
                            {room.status === 'occupied' && (
                              <Badge className="bg-blue-500 hover:bg-blue-600">Occupied</Badge>
                            )}
                            {room.status === 'maintenance' && (
                              <Badge className="bg-yellow-500 hover:bg-yellow-600">Maintenance</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => openEditDialog(room)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteRoom(room)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 space-y-3">
                    <Home className="h-10 w-10 text-gray-400" />
                    <p className="text-gray-500">No rooms found</p>
                    <Button onClick={() => setShowAddDialog(true)}>
                      Add New Room
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Room Availability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Rooms:</span>
                      <span className="font-medium">{rooms.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Available Rooms:</span>
                      <span className="font-medium text-green-600">
                        {rooms.filter(r => r.status === 'available').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Occupied Rooms:</span>
                      <span className="font-medium text-blue-600">
                        {rooms.filter(r => r.status === 'occupied').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Under Maintenance:</span>
                      <span className="font-medium text-yellow-600">
                        {rooms.filter(r => r.status === 'maintenance').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Room Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Single Rooms:</span>
                      <span className="font-medium">
                        {rooms.filter(r => r.type === 'single').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Double Rooms:</span>
                      <span className="font-medium">
                        {rooms.filter(r => r.type === 'double').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Triple Rooms:</span>
                      <span className="font-medium">
                        {rooms.filter(r => r.type === 'triple').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Occupancy Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Capacity:</span>
                      <span className="font-medium">
                        {rooms.reduce((sum, room) => sum + room.capacity, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Occupancy:</span>
                      <span className="font-medium">
                        {rooms.reduce((sum, room) => sum + room.occupied, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Occupancy Rate:</span>
                      <span className="font-medium">
                        {Math.round((rooms.reduce((sum, room) => sum + room.occupied, 0) / 
                                  rooms.reduce((sum, room) => sum + room.capacity, 0)) * 100) || 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>
              Create a new room in the hostel
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  placeholder="e.g. A101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Room Type</Label>
                <Select 
                  value={roomForm.type} 
                  onValueChange={(value) => setRoomForm({ 
                    ...roomForm, 
                    type: value as 'single' | 'double' | 'triple',
                    capacity: value === 'single' ? '1' : value === 'double' ? '2' : '3'
                  })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Room</SelectItem>
                    <SelectItem value="double">Double Room</SelectItem>
                    <SelectItem value="triple">Triple Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="block">Block</Label>
                <Select 
                  value={roomForm.block} 
                  onValueChange={(value) => setRoomForm({ ...roomForm, block: value })}
                >
                  <SelectTrigger id="block">
                    <SelectValue placeholder="Select block" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Block A</SelectItem>
                    <SelectItem value="B">Block B</SelectItem>
                    <SelectItem value="C">Block C</SelectItem>
                    <SelectItem value="D">Block D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Select 
                  value={roomForm.floor} 
                  onValueChange={(value) => setRoomForm({ ...roomForm, floor: value })}
                >
                  <SelectTrigger id="floor">
                    <SelectValue placeholder="Select floor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Floor 1</SelectItem>
                    <SelectItem value="2">Floor 2</SelectItem>
                    <SelectItem value="3">Floor 3</SelectItem>
                    <SelectItem value="4">Floor 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={roomForm.status} 
                  onValueChange={(value) => setRoomForm({ 
                    ...roomForm, 
                    status: value as 'available' | 'occupied' | 'maintenance' 
                  })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                  min="1"
                  max="4"
                  disabled
                />
                <p className="text-xs text-gray-500">Based on room type</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rentPerMonth">Rent Per Month (₹)</Label>
                <Input
                  id="rentPerMonth"
                  type="number"
                  value={roomForm.rentPerMonth}
                  onChange={(e) => setRoomForm({ ...roomForm, rentPerMonth: e.target.value })}
                  min="1000"
                />
              </div>
            </div>
            
            <div>
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {amenityOptions.map((amenity) => (
                  <div key={amenity.id} className="flex items-center space-x-2">
                    <Switch 
                      checked={roomForm.amenities.includes(amenity.id)}
                      onCheckedChange={() => handleToggleAmenity(amenity.id)}
                      id={`amenity-${amenity.id}`}
                    />
                    <Label htmlFor={`amenity-${amenity.id}`}>{amenity.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddRoom}
              disabled={!roomForm.roomNumber}
            >
              Add Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>
              Update room information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  placeholder="e.g. A101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Room Type</Label>
                <Select 
                  value={roomForm.type} 
                  onValueChange={(value) => setRoomForm({ 
                    ...roomForm, 
                    type: value as 'single' | 'double' | 'triple',
                    capacity: value === 'single' ? '1' : value === 'double' ? '2' : '3'
                  })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Room</SelectItem>
                    <SelectItem value="double">Double Room</SelectItem>
                    <SelectItem value="triple">Triple Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-block">Block</Label>
                <Select 
                  value={roomForm.block} 
                  onValueChange={(value) => setRoomForm({ ...roomForm, block: value })}
                >
                  <SelectTrigger id="edit-block">
                    <SelectValue placeholder="Select block" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Block A</SelectItem>
                    <SelectItem value="B">Block B</SelectItem>
                    <SelectItem value="C">Block C</SelectItem>
                    <SelectItem value="D">Block D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-floor">Floor</Label>
                <Select 
                  value={roomForm.floor} 
                  onValueChange={(value) => setRoomForm({ ...roomForm, floor: value })}
                >
                  <SelectTrigger id="edit-floor">
                    <SelectValue placeholder="Select floor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Floor 1</SelectItem>
                    <SelectItem value="2">Floor 2</SelectItem>
                    <SelectItem value="3">Floor 3</SelectItem>
                    <SelectItem value="4">Floor 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={roomForm.status} 
                  onValueChange={(value) => setRoomForm({ 
                    ...roomForm, 
                    status: value as 'available' | 'occupied' | 'maintenance' 
                  })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                  min="1"
                  max="4"
                  disabled
                />
                <p className="text-xs text-gray-500">Based on room type</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-occupied">Current Occupancy</Label>
                <Input
                  id="edit-occupied"
                  type="number"
                  value={roomForm.occupied}
                  onChange={(e) => setRoomForm({ ...roomForm, occupied: e.target.value })}
                  min="0"
                  max={roomForm.capacity}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-rentPerMonth">Rent Per Month (₹)</Label>
              <Input
                id="edit-rentPerMonth"
                type="number"
                value={roomForm.rentPerMonth}
                onChange={(e) => setRoomForm({ ...roomForm, rentPerMonth: e.target.value })}
                min="1000"
              />
            </div>
            
            <div>
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {amenityOptions.map((amenity) => (
                  <div key={amenity.id} className="flex items-center space-x-2">
                    <Switch 
                      checked={roomForm.amenities.includes(amenity.id)}
                      onCheckedChange={() => handleToggleAmenity(amenity.id)}
                      id={`edit-amenity-${amenity.id}`}
                    />
                    <Label htmlFor={`edit-amenity-${amenity.id}`}>{amenity.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            {selectedRoom && selectedRoom.occupied > 0 && (
              <div className="bg-yellow-50 p-4 rounded-md flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Room is currently occupied</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Changes to room type, capacity, or deleting this room may affect current occupants.
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditRoom}
              disabled={!roomForm.roomNumber}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ManageRooms;
