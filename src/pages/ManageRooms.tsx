
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { RoomWithStudents, User } from '@/types';
import { Search, Edit, Plus, Trash2, Users2, Home, Settings, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';

const ManageRooms: React.FC = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<RoomWithStudents[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomWithStudents[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [blockFilter, setBlockFilter] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithStudents | null>(null);

  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    capacity: '2',
    floor: '1',
    block: 'A',
    type: 'double',
    status: 'available',
    amenities: 'Bed, Table, Chair, Cupboard',
    rentPerMonth: '5000'
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = [...rooms];
    
    if (searchTerm) {
      filtered = filtered.filter(room => 
        room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.block.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(room => room.status === statusFilter);
    }
    
    if (blockFilter) {
      filtered = filtered.filter(room => room.block === blockFilter);
    }
    
    setFilteredRooms(filtered);
  }, [searchTerm, statusFilter, blockFilter, rooms]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'rooms'));
      
      const roomsData: RoomWithStudents[] = [];
      
      querySnapshot.forEach((doc) => {
        roomsData.push({
          id: doc.id,
          ...doc.data(),
          students: [],
          rentPerMonth: doc.data().rentPerMonth || 5000
        } as RoomWithStudents);
      });
      
      // Create sample data if none exists
      if (roomsData.length === 0) {
        const sampleRooms: RoomWithStudents[] = [
          {
            id: "room1",
            roomNumber: "101",
            capacity: 2,
            occupied: 1,
            floor: 1,
            block: "A",
            type: "double",
            amenities: ["Bed", "Table", "Chair", "Cupboard", "Fan"],
            status: "available",
            students: [{
              id: "student1",
              name: "John Doe",
              email: "john@example.com",
              role: "student"
            }],
            rentPerMonth: 5000
          },
          {
            id: "room2",
            roomNumber: "102",
            capacity: 1,
            occupied: 1,
            floor: 1,
            block: "A",
            type: "single",
            amenities: ["Bed", "Table", "Chair", "Cupboard", "Fan", "Attached Bathroom"],
            status: "occupied",
            students: [{
              id: "student2",
              name: "Jane Smith",
              email: "jane@example.com",
              role: "student"
            }],
            rentPerMonth: 6000
          },
          {
            id: "room3",
            roomNumber: "201",
            capacity: 3,
            occupied: 0,
            floor: 2,
            block: "B",
            type: "triple",
            amenities: ["Bed", "Table", "Chair", "Cupboard", "Fan", "Balcony"],
            status: "available",
            students: [],
            rentPerMonth: 4500
          },
          {
            id: "room4",
            roomNumber: "301",
            capacity: 1,
            occupied: 0,
            floor: 3,
            block: "C",
            type: "single",
            amenities: ["Bed", "Table", "Chair", "Cupboard", "Fan", "AC"],
            status: "maintenance",
            students: [],
            rentPerMonth: 7000
          }
        ];
        
        setRooms(sampleRooms);
        setFilteredRooms(sampleRooms);
        setLoading(false);
        return;
      }
      
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

  const handleAddRoom = async () => {
    try {
      const roomData = {
        roomNumber: roomForm.roomNumber,
        capacity: parseInt(roomForm.capacity),
        occupied: 0,
        floor: parseInt(roomForm.floor),
        block: roomForm.block,
        type: roomForm.type,
        amenities: roomForm.amenities.split(',').map(item => item.trim()),
        status: roomForm.status,
        rentPerMonth: parseInt(roomForm.rentPerMonth),
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'rooms'), roomData);
      
      const newRoom: RoomWithStudents = {
        id: docRef.id,
        ...roomData,
        students: [],
        rentPerMonth: parseInt(roomForm.rentPerMonth)
      };
      
      setRooms([...rooms, newRoom]);
      
      toast({
        title: "Success",
        description: "Room added successfully",
      });
      
      // Reset form and close dialog
      setRoomForm({
        roomNumber: '',
        capacity: '2',
        floor: '1',
        block: 'A',
        type: 'double',
        status: 'available',
        amenities: 'Bed, Table, Chair, Cupboard',
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
      const roomData = {
        roomNumber: roomForm.roomNumber,
        capacity: parseInt(roomForm.capacity),
        floor: parseInt(roomForm.floor),
        block: roomForm.block,
        type: roomForm.type,
        amenities: roomForm.amenities.split(',').map(item => item.trim()),
        status: roomForm.status,
        rentPerMonth: parseInt(roomForm.rentPerMonth)
      };
      
      await updateDoc(doc(db, 'rooms', selectedRoom.id), roomData);
      
      const updatedRooms = rooms.map(room => 
        room.id === selectedRoom.id
          ? { ...room, ...roomData }
          : room
      );
      
      setRooms(updatedRooms);
      
      toast({
        title: "Success",
        description: "Room updated successfully",
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

  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    
    try {
      await deleteDoc(doc(db, 'rooms', selectedRoom.id));
      
      setRooms(rooms.filter(room => room.id !== selectedRoom.id));
      
      toast({
        title: "Success",
        description: "Room deleted successfully",
      });
      
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting room:", error);
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      });
    }
  };

  const openAddDialog = () => {
    setRoomForm({
      roomNumber: '',
      capacity: '2',
      floor: '1',
      block: 'A',
      type: 'double',
      status: 'available',
      amenities: 'Bed, Table, Chair, Cupboard',
      rentPerMonth: '5000'
    });
    setShowAddDialog(true);
  };

  const openEditDialog = (room: RoomWithStudents) => {
    setSelectedRoom(room);
    setRoomForm({
      roomNumber: room.roomNumber,
      capacity: room.capacity.toString(),
      floor: room.floor.toString(),
      block: room.block,
      type: room.type,
      status: room.status,
      amenities: room.amenities.join(', '),
      rentPerMonth: room.rentPerMonth.toString()
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (room: RoomWithStudents) => {
    setSelectedRoom(room);
    setShowDeleteDialog(true);
  };

  const getRoomStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>;
      case 'occupied':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Occupied</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Maintenance</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  // Get unique blocks for filter
  const blocks = [...new Set(rooms.map(room => room.block))];

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manage Rooms</h1>
            <p className="text-gray-500">
              Add, edit and assign hostel rooms
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" /> Add New Room
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Room Directory</CardTitle>
                <CardDescription>
                  Manage hostel room allocations and maintenance
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search rooms..."
                    className="pl-8 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={blockFilter} onValueChange={setBlockFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Block" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Blocks</SelectItem>
                    {blocks.map(block => (
                      <SelectItem key={block} value={block}>Block {block}</SelectItem>
                    ))}
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
                    <TableHead>Room No.</TableHead>
                    <TableHead>Block/Floor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead>Rent (₹/month)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.roomNumber}</TableCell>
                      <TableCell>Block {room.block}, Floor {room.floor}</TableCell>
                      <TableCell className="capitalize">{room.type}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users2 className="mr-1 h-4 w-4 text-gray-500" />
                          <span>{room.occupied}/{room.capacity}</span>
                        </div>
                      </TableCell>
                      <TableCell>₹{room.rentPerMonth}</TableCell>
                      <TableCell>{getRoomStatusBadge(room.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => openEditDialog(room)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit Room</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => openDeleteDialog(room)}
                                  disabled={room.occupied > 0}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{room.occupied > 0 ? "Cannot delete occupied room" : "Delete Room"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setBlockFilter('');
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-500" />
                Rooms Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Rooms:</span>
                  <span className="font-medium">{rooms.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Available:</span>
                  <span className="font-medium text-green-600">
                    {rooms.filter(r => r.status === 'available').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Occupied:</span>
                  <span className="font-medium text-blue-600">
                    {rooms.filter(r => r.status === 'occupied').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Maintenance:</span>
                  <span className="font-medium text-yellow-600">
                    {rooms.filter(r => r.status === 'maintenance').length}
                  </span>
                </div>
                <div className="pt-2 border-t mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Capacity:</span>
                    <span className="font-medium">
                      {rooms.reduce((acc, room) => acc + room.capacity, 0)} beds
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add New Room
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                Room Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button className="w-full mb-2">
                  Bulk Room Assignment
                </Button>
                <Button variant="outline" className="w-full">
                  Generate Room Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Room Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>
              Add a new room to the hostel. Fill in all details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  placeholder="e.g., 101"
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                />
              </div>
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  min="1"
                  value={roomForm.floor}
                  onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Room Type</Label>
                <Select
                  value={roomForm.type}
                  onValueChange={(value: 'single' | 'double' | 'triple') => setRoomForm({ ...roomForm, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="4"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={roomForm.status}
                  onValueChange={(value: 'available' | 'occupied' | 'maintenance') => setRoomForm({ ...roomForm, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities (comma-separated)</Label>
              <Input
                id="amenities"
                placeholder="e.g., Bed, Table, Chair, Cupboard"
                value={roomForm.amenities}
                onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rent">Monthly Rent (₹)</Label>
              <Input
                id="rent"
                type="number"
                min="1000"
                value={roomForm.rentPerMonth}
                onChange={(e) => setRoomForm({ ...roomForm, rentPerMonth: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRoom}>
              Add Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>
              Update the room details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-roomNumber">Room Number</Label>
                <Input
                  id="edit-roomNumber"
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                />
              </div>
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-floor">Floor</Label>
                <Input
                  id="edit-floor"
                  type="number"
                  min="1"
                  value={roomForm.floor}
                  onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Room Type</Label>
                <Select
                  value={roomForm.type}
                  onValueChange={(value: 'single' | 'double' | 'triple') => setRoomForm({ ...roomForm, type: value })}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  max="4"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={roomForm.status}
                  onValueChange={(value: 'available' | 'occupied' | 'maintenance') => setRoomForm({ ...roomForm, status: value })}
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-amenities">Amenities (comma-separated)</Label>
              <Input
                id="edit-amenities"
                value={roomForm.amenities}
                onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-rent">Monthly Rent (₹)</Label>
              <Input
                id="edit-rent"
                type="number"
                min="1000"
                value={roomForm.rentPerMonth}
                onChange={(e) => setRoomForm({ ...roomForm, rentPerMonth: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRoom}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Room Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this room? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedRoom && (
              <div className="p-4 border rounded-lg">
                <p><span className="font-medium">Room:</span> {selectedRoom.roomNumber}</p>
                <p><span className="font-medium">Block/Floor:</span> Block {selectedRoom.block}, Floor {selectedRoom.floor}</p>
                <p><span className="font-medium">Type:</span> {selectedRoom.type}</p>
              </div>
            )}
            {selectedRoom && selectedRoom.occupied > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                <p className="font-medium">Warning: This room is currently occupied!</p>
                <p className="text-sm">You must vacate all students before deleting this room.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteRoom}
              disabled={selectedRoom?.occupied ? selectedRoom.occupied > 0 : false}
            >
              Delete Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ManageRooms;
