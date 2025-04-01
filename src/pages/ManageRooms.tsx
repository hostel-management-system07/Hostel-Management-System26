
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Home, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Users, 
  AlertTriangle,
  CheckCircle,
  RefreshCcw,
  Eye,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface RoomType {
  id: string;
  roomNumber: string;
  capacity: number;
  occupied: number;
  floor: number;
  block: string;
  type: 'single' | 'double' | 'triple';
  amenities: string[];
  status: 'available' | 'occupied' | 'maintenance';
  students?: string[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  roomId?: string;
  registrationNumber?: string;
  department?: string;
  year?: string;
}

interface RoomWithStudents extends RoomType {
  studentDetails?: Student[];
}

const ManageRooms: React.FC = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<RoomWithStudents[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [showViewMembersDialog, setShowViewMembersDialog] = useState(false);
  
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [targetRoomId, setTargetRoomId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    roomNumber: '',
    capacity: 1,
    floor: 1,
    block: '',
    type: 'single' as 'single' | 'double' | 'triple',
    amenities: '',
    status: 'available' as 'available' | 'occupied' | 'maintenance'
  });

  useEffect(() => {
    fetchRooms();
    fetchStudents();
  }, []);

  // Filter rooms based on search and filters
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.block.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    const matchesType = typeFilter === 'all' || room.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });
  
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const roomsSnapshot = await getDocs(collection(db, 'rooms'));
      const roomsList: RoomWithStudents[] = [];
      
      for (const roomDoc of roomsSnapshot.docs) {
        const roomData = roomDoc.data() as RoomType;
        
        // Get students assigned to this room
        const studentsList: Student[] = [];
        if (roomData.students && roomData.students.length > 0) {
          for (const studentId of roomData.students) {
            const studentDoc = await getDoc(doc(db, 'students', studentId));
            if (studentDoc.exists()) {
              studentsList.push({ id: studentDoc.id, ...studentDoc.data() } as Student);
            }
          }
        }
        
        roomsList.push({
          id: roomDoc.id,
          roomNumber: roomData.roomNumber || '',
          capacity: roomData.capacity || 1,
          occupied: roomData.occupied || 0,
          floor: roomData.floor || 1,
          block: roomData.block || '',
          type: roomData.type || 'single',
          amenities: roomData.amenities || [],
          status: roomData.status || 'available',
          students: roomData.students || [],
          studentDetails: studentsList
        });
      }
      
      // Create sample data if none exists
      if (roomsList.length === 0) {
        const sampleRooms = [
          {
            roomNumber: "101",
            capacity: 2,
            occupied: 0,
            floor: 1,
            block: "A",
            type: "double",
            amenities: ["Wi-Fi", "Attached Bathroom", "Study Table"],
            status: "available"
          },
          {
            roomNumber: "102",
            capacity: 1,
            occupied: 0,
            floor: 1,
            block: "A",
            type: "single",
            amenities: ["Wi-Fi", "Attached Bathroom", "Study Table", "AC"],
            status: "available"
          },
          {
            roomNumber: "201",
            capacity: 3,
            occupied: 0,
            floor: 2,
            block: "B",
            type: "triple",
            amenities: ["Wi-Fi", "Shared Bathroom", "Study Table", "Balcony"],
            status: "available"
          },
          {
            roomNumber: "301",
            capacity: 1,
            occupied: 1,
            floor: 3,
            block: "C",
            type: "single",
            amenities: ["Wi-Fi", "Attached Bathroom", "Study Table", "Balcony", "AC"],
            status: "occupied"
          }
        ];
        
        for (const room of sampleRooms) {
          await addDoc(collection(db, 'rooms'), room);
        }
        
        // Refetch after creating sample data
        return fetchRooms();
      }
      
      // Sort by room number
      roomsList.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
      
      setRooms(roomsList);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStudents = async () => {
    try {
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsList: Student[] = [];
      
      studentsSnapshot.forEach((doc) => {
        studentsList.push({ id: doc.id, ...doc.data() } as Student);
      });
      
      // Create sample data if none exists
      if (studentsList.length === 0) {
        const sampleStudents = [
          {
            name: "John Doe",
            email: "john.doe@example.com",
            registrationNumber: "STU001",
            department: "Computer Science",
            year: "2",
          },
          {
            name: "Jane Smith",
            email: "jane.smith@example.com",
            registrationNumber: "STU002",
            department: "Mechanical Engineering",
            year: "3",
          },
          {
            name: "Mike Brown",
            email: "mike.brown@example.com",
            registrationNumber: "STU003",
            department: "Electrical Engineering",
            year: "1",
          }
        ];
        
        for (const student of sampleStudents) {
          await addDoc(collection(db, 'students'), student);
        }
        
        // Refetch after creating sample data
        return fetchStudents();
      }
      
      setStudents(studentsList);
      
      // Filter unassigned students
      const unassignedList = studentsList.filter(student => !student.roomId);
      setUnassignedStudents(unassignedList);
      
    } catch (error) {
      console.error('Error fetching students:', error);
    }
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
      
      // Update local state
      setRooms([...rooms, {
        id: docRef.id,
        ...formData,
        amenities: amenitiesArray,
        occupied: 0,
        students: [],
        studentDetails: []
      }]);
      
      toast({
        title: "Success",
        description: "Room added successfully",
      });
      
      setShowAddDialog(false);
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
      
      // Update local state
      setRooms(rooms.map(room => 
        room.id === selectedRoom.id
          ? { 
              ...room, 
              ...formData, 
              amenities: amenitiesArray
            }
          : room
      ));
      
      toast({
        title: "Success",
        description: "Room updated successfully",
      });
      
      setShowEditDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error updating room:', error);
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
      
      // Update local state
      setRooms(rooms.filter(room => room.id !== selectedRoom.id));
      
      toast({
        title: "Success",
        description: "Room deleted successfully",
      });
      
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      });
    }
  };

  const handleBulkAssign = async () => {
    try {
      if (!targetRoomId || selectedStudents.length === 0) {
        toast({
          title: "Error",
          description: "Please select a target room and at least one student",
          variant: "destructive",
        });
        return;
      }
      
      const targetRoom = rooms.find(room => room.id === targetRoomId);
      if (!targetRoom) return;
      
      if (targetRoom.occupied + selectedStudents.length > targetRoom.capacity) {
        toast({
          title: "Error",
          description: `Room capacity exceeded. This room can only accommodate ${targetRoom.capacity} students.`,
          variant: "destructive",
        });
        return;
      }
      
      // Update room with new students
      const updatedStudents = [...(targetRoom.students || []), ...selectedStudents];
      await updateDoc(doc(db, 'rooms', targetRoomId), {
        students: updatedStudents,
        occupied: updatedStudents.length,
        status: updatedStudents.length > 0 ? 'occupied' : 'available'
      });
      
      // Update each student with the roomId
      for (const studentId of selectedStudents) {
        await updateDoc(doc(db, 'students', studentId), {
          roomId: targetRoomId
        });
        
        // Create notification for the student
        await addDoc(collection(db, 'notifications'), {
          userId: studentId,
          title: "Room Assignment",
          message: `You have been assigned to Room ${targetRoom.roomNumber}, Block ${targetRoom.block}`,
          type: "room-assignment",
          createdAt: serverTimestamp(),
          read: false
        });
      }
      
      toast({
        title: "Success",
        description: `${selectedStudents.length} students assigned to Room ${targetRoom.roomNumber}`,
      });
      
      // Refresh data
      fetchRooms();
      fetchStudents();
      
      setShowBulkAssignDialog(false);
      setSelectedStudents([]);
      setTargetRoomId('');
    } catch (error) {
      console.error('Error assigning rooms:', error);
      toast({
        title: "Error",
        description: "Failed to assign rooms",
        variant: "destructive",
      });
    }
  };

  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };
  
  const openEditDialog = (room: RoomType) => {
    setSelectedRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      floor: room.floor,
      block: room.block,
      type: room.type,
      amenities: room.amenities ? room.amenities.join(', ') : '',
      status: room.status
    });
    setShowEditDialog(true);
  };
  
  const openDeleteDialog = (room: RoomType) => {
    setSelectedRoom(room);
    setShowDeleteDialog(true);
  };
  
  const openBulkAssignDialog = () => {
    setSelectedStudents([]);
    setTargetRoomId('');
    setShowBulkAssignDialog(true);
  };
  
  const openViewMembersDialog = (room: RoomWithStudents) => {
    setSelectedRoom(room);
    setShowViewMembersDialog(true);
  };

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
    setSelectedRoom(null);
  };

  const handleStudentSelection = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
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
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Room Management</h1>
            <p className="text-gray-500">Manage hostel rooms and assignments</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" /> Add Room
            </Button>
            <Button variant="outline" onClick={openBulkAssignDialog}>
              <Users className="mr-2 h-4 w-4" /> Bulk Room Assignment
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all-rooms">
          <TabsList>
            <TabsTrigger value="all-rooms">All Rooms</TabsTrigger>
            <TabsTrigger value="occupied">Occupied Rooms</TabsTrigger>
            <TabsTrigger value="available">Available Rooms</TabsTrigger>
          </TabsList>
          
          <div className="flex justify-between my-4">
            <div className="flex gap-4">
              <div className="w-[200px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[200px]">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="relative w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                placeholder="Search rooms..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <TabsContent value="all-rooms">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                  </div>
                ) : filteredRooms.length > 0 ? (
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
                      {filteredRooms.map((room) => (
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
                                onClick={() => openViewMembersDialog(room)}
                                className="text-blue-500 hover:text-blue-700"
                                title="View Members"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => openEditDialog(room)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => openDeleteDialog(room)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40">
                    <Home className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500 mb-4">No rooms found</p>
                    <Button onClick={openAddDialog}>
                      <Plus className="mr-2 h-4 w-4" /> Add Room
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="occupied">
            <Card>
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                  </div>
                ) : rooms.filter(room => room.status === 'occupied').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms
                      .filter(room => room.status === 'occupied')
                      .map((room) => (
                        <Card key={room.id} className="border border-blue-100">
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
                            <p className="text-sm mb-2"><span className="font-medium">Capacity:</span> {room.occupied || 0}/{room.capacity}</p>
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
                            <Button variant="outline" size="sm" className="w-full" onClick={() => openEditDialog(room)}>
                              Manage Room
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    }
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40">
                    <Users className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500">No occupied rooms found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="available">
            <Card>
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                  </div>
                ) : rooms.filter(room => room.status === 'available').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {rooms
                      .filter(room => room.status === 'available')
                      .map((room) => (
                        <Card key={room.id} className="border border-green-100">
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
                              onClick={() => {
                                setTargetRoomId(room.id);
                                setShowBulkAssignDialog(true);
                              }}
                            >
                              Assign Students
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    }
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40">
                    <Home className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500">No available rooms found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Room Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
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
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddRoom}>Add Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
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
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditRoom}>Save Changes</Button>
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
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
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

      {/* Bulk Room Assignment Dialog */}
      <Dialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bulk Room Assignment</DialogTitle>
            <DialogDescription>
              Assign multiple students to a room
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div>
              <Label className="block mb-2">1. Select Target Room</Label>
              <Select value={targetRoomId} onValueChange={setTargetRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms
                    .filter(room => room.status !== 'maintenance')
                    .filter(room => room.occupied < room.capacity)
                    .map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.roomNumber} ({room.occupied}/{room.capacity}) - Block {room.block}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>

              {targetRoomId && (
                <div className="mt-4">
                  <div className="rounded-lg border p-4 bg-blue-50">
                    <h4 className="font-medium mb-2">Selected Room Details</h4>
                    {(() => {
                      const room = rooms.find(r => r.id === targetRoomId);
                      if (!room) return <p>Room not found</p>;
                      
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <p><span className="font-medium">Room:</span> {room.roomNumber}</p>
                            <p><span className="font-medium">Block:</span> {room.block}</p>
                            <p><span className="font-medium">Floor:</span> {room.floor}</p>
                            <p><span className="font-medium">Type:</span> {room.type}</p>
                            <p><span className="font-medium">Available:</span> {room.capacity - room.occupied} of {room.capacity}</p>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-sm font-medium mb-1">Current Occupants:</p>
                            {room.studentDetails && room.studentDetails.length > 0 ? (
                              <div className="space-y-1 text-xs">
                                {room.studentDetails.map((student, index) => (
                                  <div key={index} className="p-1 bg-white rounded">
                                    {student.name} ({student.registrationNumber})
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500">No current occupants</p>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>2. Select Students to Assign</Label>
                <p className="text-xs text-gray-500">
                  Selected: {selectedStudents.length} students
                </p>
              </div>
              
              {unassignedStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 border rounded-lg p-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-sm text-center">All students have been assigned rooms.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={fetchStudents}
                  >
                    <RefreshCcw className="h-4 w-4 mr-1" />
                    Refresh List
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg max-h-80 overflow-y-auto">
                  {unassignedStudents.map((student) => (
                    <div 
                      key={student.id} 
                      className={`p-3 border-b flex items-center justify-between last:border-b-0 ${
                        selectedStudents.includes(student.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id={`student-${student.id}`} 
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => handleStudentSelection(student.id)}
                        />
                        <div>
                          <label 
                            htmlFor={`student-${student.id}`} 
                            className="font-medium cursor-pointer"
                          >
                            {student.name}
                          </label>
                          <p className="text-xs text-gray-500">
                            {student.registrationNumber ? `ID: ${student.registrationNumber}` : 'No ID'}
                            {student.department ? ` • ${student.department}` : ''}
                            {student.year ? ` • Year ${student.year}` : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                Only students without room assignments are shown.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkAssignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkAssign}
              disabled={!targetRoomId || selectedStudents.length === 0}
            >
              Assign Students
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Room Members Dialog */}
      <Dialog open={showViewMembersDialog} onOpenChange={setShowViewMembersDialog}>
        <DialogContent>
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
                  {getStatusBadge(selectedRoom.status)}
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
                  <h3 className="font-medium mb-2">Students ({(selectedRoom as RoomWithStudents)?.studentDetails?.length || 0})</h3>
                  
                  {(selectedRoom as RoomWithStudents)?.studentDetails && (selectedRoom as RoomWithStudents)?.studentDetails?.length > 0 ? (
                    <div className="space-y-2">
                      {(selectedRoom as RoomWithStudents).studentDetails?.map((student, index) => (
                        <div key={index} className="bg-gray-50 border rounded p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{student.name}</h4>
                              <p className="text-xs text-gray-500">{student.registrationNumber || 'No ID'}</p>
                            </div>
                            <Badge variant="outline">{student.year ? `Year ${student.year}` : 'No Year'}</Badge>
                          </div>
                          <div className="mt-2 text-sm">
                            <p><span className="text-gray-500">Email:</span> {student.email}</p>
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
            <Button onClick={() => setShowViewMembersDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ManageRooms;
