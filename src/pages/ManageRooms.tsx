
import React, { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Plus, Users, Search } from 'lucide-react';
import { RoomWithStudents } from '@/types/room';
import AddRoomDialog from '@/components/rooms/AddRoomDialog';
import EditRoomDialog from '@/components/rooms/EditRoomDialog';
import DeleteRoomDialog from '@/components/rooms/DeleteRoomDialog';
import BulkAssignDialog from '@/components/rooms/BulkAssignDialog';
import ViewMembersDialog from '@/components/rooms/ViewMembersDialog';
import RoomsList from '@/components/rooms/RoomsList';
import RoomCard from '@/components/rooms/RoomCard';

const ManageRooms: React.FC = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<RoomWithStudents[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [showViewMembersDialog, setShowViewMembersDialog] = useState(false);
  
  const [selectedRoom, setSelectedRoom] = useState<RoomWithStudents | null>(null);
  const [initialRoomId, setInitialRoomId] = useState<string>('');

  useEffect(() => {
    fetchRooms();
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
        const roomData = roomDoc.data() as RoomWithStudents;
        
        // Get students assigned to this room
        const studentsList: any[] = [];
        if (roomData.students && roomData.students.length > 0) {
          for (const studentId of roomData.students) {
            const studentDoc = await getDoc(doc(db, 'students', studentId));
            if (studentDoc.exists()) {
              studentsList.push({ id: studentDoc.id, ...studentDoc.data() });
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

  const handleRoomAdded = (newRoom: RoomWithStudents) => {
    setRooms([...rooms, newRoom]);
  };

  const handleRoomUpdated = (updatedRoom: RoomWithStudents) => {
    setRooms(rooms.map(room => 
      room.id === updatedRoom.id ? updatedRoom : room
    ));
  };

  const handleRoomDeleted = (roomId: string) => {
    setRooms(rooms.filter(room => room.id !== roomId));
  };

  const openAddDialog = () => {
    setShowAddDialog(true);
  };
  
  const openEditDialog = (room: RoomWithStudents) => {
    setSelectedRoom(room);
    setShowEditDialog(true);
  };
  
  const openDeleteDialog = (room: RoomWithStudents) => {
    setSelectedRoom(room);
    setShowDeleteDialog(true);
  };
  
  const openBulkAssignDialog = (roomId?: string) => {
    if (roomId) {
      setInitialRoomId(roomId);
    } else {
      setInitialRoomId('');
    }
    setShowBulkAssignDialog(true);
  };
  
  const openViewMembersDialog = (room: RoomWithStudents) => {
    setSelectedRoom(room);
    setShowViewMembersDialog(true);
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
            <Button variant="outline" onClick={() => openBulkAssignDialog()}>
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
                  <RoomsList 
                    rooms={filteredRooms}
                    onEditRoom={openEditDialog}
                    onDeleteRoom={openDeleteDialog}
                    onViewMembers={openViewMembersDialog}
                  />
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
                        <RoomCard 
                          key={room.id} 
                          room={room}
                          onManage={openEditDialog}
                          cardType="occupied"
                        />
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
                        <RoomCard 
                          key={room.id} 
                          room={room}
                          onManage={openEditDialog}
                          cardType="available"
                          onAssignStudents={(roomId) => openBulkAssignDialog(roomId)}
                        />
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

      {/* Dialogs */}
      <AddRoomDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onRoomAdded={handleRoomAdded}
      />

      <EditRoomDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog}
        selectedRoom={selectedRoom as any}
        onRoomUpdated={handleRoomUpdated}
      />

      <DeleteRoomDialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog}
        selectedRoom={selectedRoom}
        onRoomDeleted={handleRoomDeleted}
      />

      <BulkAssignDialog 
        open={showBulkAssignDialog} 
        onOpenChange={setShowBulkAssignDialog}
        rooms={rooms}
        onStudentsAssigned={fetchRooms}
        initialRoomId={initialRoomId}
      />

      <ViewMembersDialog 
        open={showViewMembersDialog} 
        onOpenChange={setShowViewMembersDialog}
        selectedRoom={selectedRoom}
      />
    </DashboardLayout>
  );
};

export default ManageRooms;
