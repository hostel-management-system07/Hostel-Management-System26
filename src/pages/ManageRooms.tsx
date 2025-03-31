
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Room } from '@/types';
import { 
  Search,
  PlusCircle,
  Trash2,
  Edit,
  Users,
  AreaChart,
  ShowerHead,
  Wifi,
  Bed
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface RoomWithStudents extends Room {
  students?: {
    id: string;
    name: string;
    email: string;
  }[];
}

const ManageRooms: React.FC = () => {
  const [rooms, setRooms] = useState<RoomWithStudents[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomWithStudents[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<RoomWithStudents | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<RoomWithStudents | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state for adding/editing room
  const [formData, setFormData] = useState({
    roomNumber: '',
    capacity: 2,
    floor: 1,
    block: 'A',
    type: 'double' as 'single' | 'double' | 'triple',
    amenities: [] as string[],
    status: 'available' as 'available' | 'occupied' | 'maintenance',
    rentPerMonth: 5000
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    let filtered = [...rooms];
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        room => room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
               room.block.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(room => room.status === statusFilter);
    }
    
    setFilteredRooms(filtered);
  }, [searchTerm, statusFilter, rooms]);

  const fetchRooms = async () => {
    try {
      const roomsCollection = collection(db, 'rooms');
      const snapshot = await getDocs(roomsCollection);
      
      const roomsData: RoomWithStudents[] = [];
      
      for (const roomDoc of snapshot.docs) {
        const roomData = { id: roomDoc.id, ...roomDoc.data() } as RoomWithStudents;
        
        // Fetch students assigned to this room
        if (roomData.status === 'occupied') {
          const studentsQuery = query(
            collection(db, 'users'),
            where('roomId', '==', roomDoc.id)
          );
          
          const studentsSnapshot = await getDocs(studentsQuery);
          const students = studentsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || 'Unknown',
            email: doc.data().email || 'No email'
          }));
          
          roomData.students = students;
        }
        
        roomsData.push(roomData);
      }
      
      // If no rooms, create sample data
      if (roomsData.length === 0) {
        const sampleRooms = [
          {
            roomNumber: '101',
            capacity: 2,
            occupied: 1,
            floor: 1,
            block: 'A',
            type: 'double',
            amenities: ['Wi-Fi', 'Bathroom', 'Study Table'],
            status: 'occupied',
            rentPerMonth: 5000
          },
          {
            roomNumber: '102',
            capacity: 1,
            occupied: 0,
            floor: 1,
            block: 'A',
            type: 'single',
            amenities: ['Wi-Fi', 'Bathroom', 'Study Table'],
            status: 'available',
            rentPerMonth: 6000
          },
          {
            roomNumber: '103',
            capacity: 3,
            occupied: 0,
            floor: 1,
            block: 'A',
            type: 'triple',
            amenities: ['Wi-Fi', 'Bathroom', 'Study Table', 'AC'],
            status: 'maintenance',
            rentPerMonth: 4500
          }
        ];
        
        for (const room of sampleRooms) {
          const docRef = await addDoc(collection(db, 'rooms'), {
            ...room,
            createdAt: serverTimestamp()
          });
          
          roomsData.push({ id: docRef.id, ...room } as RoomWithStudents);
        }
      }
      
      setRooms(roomsData);
      setFilteredRooms(roomsData);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast({
        title: "Error",
        description: "Failed to load rooms data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "capacity" || name === "floor" || name === "rentPerMonth") {
      setFormData({
        ...formData,
        [name]: Number(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAmenityChange = (amenity: string) => {
    setFormData(prevState => {
      const amenities = [...prevState.amenities];
      
      if (amenities.includes(amenity)) {
        return {
          ...prevState,
          amenities: amenities.filter(a => a !== amenity)
        };
      } else {
        return {
          ...prevState,
          amenities: [...amenities, amenity]
        };
      }
    });
  };

  const openAddDialog = () => {
    setFormData({
      roomNumber: '',
      capacity: 2,
      floor: 1,
      block: 'A',
      type: 'double',
      amenities: ['Wi-Fi', 'Study Table'],
      status: 'available',
      rentPerMonth: 5000
    });
    setShowAddDialog(true);
  };

  const openEditDialog = (room: RoomWithStudents) => {
    setRoomToEdit(room);
    setFormData({
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      floor: room.floor,
      block: room.block,
      type: room.type,
      amenities: room.amenities || [],
      status: room.status,
      rentPerMonth: room.rentPerMonth || 5000
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (room: RoomWithStudents) => {
    setRoomToDelete(room);
    setShowDeleteDialog(true);
  };

  const handleAddRoom = async () => {
    try {
      // Check if room number already exists
      const roomNumberCheck = query(
        collection(db, 'rooms'),
        where('roomNumber', '==', formData.roomNumber)
      );
      
      const roomSnapshot = await getDocs(roomNumberCheck);
      
      if (!roomSnapshot.empty) {
        toast({
          title: "Error",
          description: "A room with this number already exists",
          variant: "destructive",
        });
        return;
      }
      
      const roomData = {
        ...formData,
        occupied: 0,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'rooms'), roomData);
      
      const newRoom = { id: docRef.id, ...roomData } as RoomWithStudents;
      setRooms([...rooms, newRoom]);
      setFilteredRooms([...filteredRooms, newRoom]);
      
      toast({
        title: "Success",
        description: `Room ${formData.roomNumber} has been added`,
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
    if (!roomToEdit) return;
    
    try {
      // Check if room number already exists and it's not this room
      if (formData.roomNumber !== roomToEdit.roomNumber) {
        const roomNumberCheck = query(
          collection(db, 'rooms'),
          where('roomNumber', '==', formData.roomNumber)
        );
        
        const roomSnapshot = await getDocs(roomNumberCheck);
        
        if (!roomSnapshot.empty) {
          toast({
            title: "Error",
            description: "A room with this number already exists",
            variant: "destructive",
          });
          return;
        }
      }
      
      await updateDoc(doc(db, 'rooms', roomToEdit.id), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      
      const updatedRooms = rooms.map(room => 
        room.id === roomToEdit.id 
          ? { ...room, ...formData } 
          : room
      );
      
      setRooms(updatedRooms);
      setFilteredRooms(
        filteredRooms.map(room => 
          room.id === roomToEdit.id 
            ? { ...room, ...formData } 
            : room
        )
      );
      
      toast({
        title: "Success",
        description: `Room ${formData.roomNumber} has been updated`,
      });
      
      setShowEditDialog(false);
      setRoomToEdit(null);
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
    if (!roomToDelete) return;
    
    try {
      // Check if room has occupants
      if (roomToDelete.status === 'occupied') {
        const q = query(
          collection(db, 'users'),
          where('roomId', '==', roomToDelete.id)
        );
        
        const studentsSnapshot = await getDocs(q);
        
        if (!studentsSnapshot.empty) {
          // Update students to remove room assignment
          for (const studentDoc of studentsSnapshot.docs) {
            await updateDoc(doc(db, 'users', studentDoc.id), {
              roomId: null
            });
          }
        }
      }
      
      // Delete the room
      await deleteDoc(doc(db, 'rooms', roomToDelete.id));
      
      setRooms(rooms.filter(room => room.id !== roomToDelete.id));
      setFilteredRooms(filteredRooms.filter(room => room.id !== roomToDelete.id));
      
      toast({
        title: "Success",
        description: `Room ${roomToDelete.roomNumber} has been removed`,
      });
      
      setShowDeleteDialog(false);
      setRoomToDelete(null);
    } catch (error) {
      console.error("Error deleting room:", error);
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
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

  // Room occupancy statistics
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(room => room.status === 'available').length;
  const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
  const maintenanceRooms = rooms.filter(room => room.status === 'maintenance').length;
  
  // Capacity statistics
  const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
  const totalOccupancy = rooms.reduce((sum, room) => sum + (room.occupied || 0), 0);
  const occupancyRate = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wi-fi':
        return <Wifi className="h-4 w-4 mr-1 text-blue-500" />;
      case 'bathroom':
        return <ShowerHead className="h-4 w-4 mr-1 text-blue-500" />;
      case 'ac':
        return <AreaChart className="h-4 w-4 mr-1 text-blue-500" />;
      default:
        return <Bed className="h-4 w-4 mr-1 text-blue-500" />;
    }
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manage Rooms</h1>
            <p className="text-gray-500">View and manage hostel room assignments</p>
          </div>
          <Button onClick={openAddDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Room
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalRooms}</div>
              <p className="text-xs text-gray-500 mt-1">In the hostel</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Available Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{availableRooms}</div>
              <p className="text-xs text-gray-500 mt-1">Ready for allocation</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Occupied Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{occupiedRooms}</div>
              <p className="text-xs text-gray-500 mt-1">Currently in use</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Occupancy Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(occupancyRate)}%</div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full" 
                  style={{ width: `${occupancyRate}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {totalOccupancy}/{totalCapacity} beds occupied
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Room Directory</CardTitle>
            <CardDescription>
              Manage all hostel rooms and their assignments
            </CardDescription>
            <div className="flex items-center justify-between mt-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search rooms..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500">Filter:</p>
                <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="grid">
              <TabsList className="mb-4">
                <TabsTrigger value="grid">Grid View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="grid" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRooms.map((room) => (
                    <Card key={room.id} className="overflow-hidden">
                      <div className={`h-2 w-full ${
                        room.status === 'available' ? 'bg-green-500' : 
                        room.status === 'occupied' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}></div>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle>Room {room.roomNumber}</CardTitle>
                          {getStatusBadge(room.status)}
                        </div>
                        <CardDescription>
                          Block {room.block}, Floor {room.floor}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-3">
                          <div className="flex items-center text-sm">
                            <Users className="h-4 w-4 mr-2 text-gray-500" />
                            <span>
                              {room.occupied || 0}/{room.capacity} Occupied • {room.type} room
                            </span>
                          </div>
                          
                          {room.amenities && room.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {room.amenities.map((amenity, index) => (
                                <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center">
                                  {getAmenityIcon(amenity)}
                                  {amenity}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {room.students && room.students.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-500 mb-1">Occupants:</p>
                              <div className="space-y-1">
                                {room.students.map(student => (
                                  <div key={student.id} className="text-sm">
                                    {student.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2">
                        <p className="text-sm font-medium">₹{room.rentPerMonth || 5000}/month</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(room)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openDeleteDialog(room)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="table">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room No.</TableHead>
                        <TableHead>Block</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rent/Month</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRooms.length > 0 ? (
                        filteredRooms.map((room) => (
                          <TableRow key={room.id}>
                            <TableCell className="font-medium">{room.roomNumber}</TableCell>
                            <TableCell>Block {room.block}, Floor {room.floor}</TableCell>
                            <TableCell className="capitalize">{room.type}</TableCell>
                            <TableCell>{(room.occupied || 0)}/{room.capacity}</TableCell>
                            <TableCell>{getStatusBadge(room.status)}</TableCell>
                            <TableCell>₹{room.rentPerMonth || 5000}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(room)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(room)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            {isLoading ? 'Loading rooms...' : 'No rooms found'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Add Room Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>
              Enter the details to add a new hostel room
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. 101"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="block">Block</Label>
                <Select 
                  value={formData.block} 
                  onValueChange={(value) => handleSelectChange('block', value)}
                >
                  <SelectTrigger>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  name="floor"
                  type="number"
                  min="0"
                  value={formData.floor}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => handleSelectChange('status', value)}
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
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Room Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: any) => handleSelectChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rentPerMonth">Monthly Rent (₹)</Label>
              <Input
                id="rentPerMonth"
                name="rentPerMonth"
                type="number"
                value={formData.rentPerMonth}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-2">
                {['Wi-Fi', 'Bathroom', 'Study Table', 'AC', 'Hot Water', 'Balcony'].map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`amenity-${amenity}`}
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={() => handleAmenityChange(amenity)}
                    />
                    <label 
                      htmlFor={`amenity-${amenity}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>
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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>
              Update the room details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="block">Block</Label>
                <Select 
                  value={formData.block} 
                  onValueChange={(value) => handleSelectChange('block', value)}
                >
                  <SelectTrigger>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  name="floor"
                  type="number"
                  min="0"
                  value={formData.floor}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => handleSelectChange('status', value)}
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
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Room Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: any) => handleSelectChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rentPerMonth">Monthly Rent (₹)</Label>
              <Input
                id="rentPerMonth"
                name="rentPerMonth"
                type="number"
                value={formData.rentPerMonth}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-2">
                {['Wi-Fi', 'Bathroom', 'Study Table', 'AC', 'Hot Water', 'Balcony'].map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`amenity-edit-${amenity}`}
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={() => handleAmenityChange(amenity)}
                    />
                    <label 
                      htmlFor={`amenity-edit-${amenity}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>
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
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Room {roomToDelete?.roomNumber}?
              {roomToDelete?.status === 'occupied' && (
                <p className="mt-2 text-amber-600">
                  Warning: This room is currently occupied. Deleting it will also remove the room assignment for all students.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRoom}>
              Delete Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ManageRooms;
