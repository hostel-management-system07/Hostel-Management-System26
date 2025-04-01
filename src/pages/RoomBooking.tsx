
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Home, Check } from 'lucide-react';

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
}

const RoomBooking: React.FC = () => {
  const { userDetails } = useAuth();
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [availableRooms, setAvailableRooms] = useState<RoomType[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [currentRoom, setCurrentRoom] = useState<RoomType | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const { toast } = useToast();

  // Get unique blocks and floors from rooms
  const blocks = [...new Set(rooms.map(room => room.block))];
  const floors = [...new Set(rooms.map(room => room.floor))].sort((a, b) => a - b);
  const roomTypes = [...new Set(rooms.map(room => room.type))];

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        // Fetch all rooms
        const roomsSnapshot = await getDocs(collection(db, 'rooms'));
        const roomsList: RoomType[] = [];
        roomsSnapshot.forEach((doc) => {
          roomsList.push({ id: doc.id, ...doc.data() } as RoomType);
        });
        setRooms(roomsList);
        
        // Filter available rooms
        const availableRoomsList = roomsList.filter(room => room.status === 'available');
        setAvailableRooms(availableRoomsList);
        
        // Check if student already has a room
        if (userDetails?.id) {
          const studentDoc = await getDoc(doc(db, 'students', userDetails.id));
          if (studentDoc.exists() && studentDoc.data().roomId) {
            const roomId = studentDoc.data().roomId;
            const roomDoc = await getDoc(doc(db, 'rooms', roomId));
            if (roomDoc.exists()) {
              setCurrentRoom(roomDoc.data() as RoomType);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
        toast({
          title: "Error",
          description: "Failed to load rooms. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [userDetails?.id, toast]);

  // Filter rooms based on selection
  const filteredRooms = availableRooms.filter(room => {
    return (
      (selectedBlock === '' || room.block === selectedBlock) &&
      (selectedFloor === '' || room.floor === parseInt(selectedFloor)) &&
      (selectedType === '' || room.type === selectedType)
    );
  });

  const handleBookRoom = async () => {
    if (!selectedRoomId) {
      toast({
        title: "Error",
        description: "Please select a room first",
        variant: "destructive",
      });
      return;
    }

    setBooking(true);
    try {
      // Update room status in Firestore
      await updateDoc(doc(db, 'rooms', selectedRoomId), {
        status: 'occupied',
        occupied: 1,
      });

      // Update student document with room ID
      if (userDetails?.id) {
        await updateDoc(doc(db, 'students', userDetails.id), {
          roomId: selectedRoomId,
        });
      }

      // Find the booked room from the available rooms
      const bookedRoom = availableRooms.find(room => room.id === selectedRoomId);
      setCurrentRoom(bookedRoom || null);

      toast({
        title: "Success",
        description: "Room booked successfully!",
      });
      
      // Remove the booked room from available rooms
      setAvailableRooms(availableRooms.filter(room => room.id !== selectedRoomId));
      setSelectedRoomId('');
    } catch (error) {
      console.error('Error booking room:', error);
      toast({
        title: "Error",
        description: "Failed to book room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBooking(false);
    }
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Room Booking</h1>
          <p className="text-gray-500">Find and book your hostel room</p>
        </div>

        <Tabs defaultValue={currentRoom ? "current" : "book"}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="book" disabled={loading}>Book Room</TabsTrigger>
            <TabsTrigger value="current" disabled={!currentRoom}>Current Room</TabsTrigger>
          </TabsList>
          
          <TabsContent value="book" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Filter Rooms</CardTitle>
                <CardDescription>
                  Select your preferences to find the perfect room
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="block">Block</Label>
                    <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                      <SelectTrigger id="block">
                        <SelectValue placeholder="All Blocks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_blocks">All Blocks</SelectItem>
                        {blocks.map((block) => (
                          <SelectItem key={block} value={block}>{block ? `Block ${block}` : 'Unknown'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="floor">Floor</Label>
                    <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                      <SelectTrigger id="floor">
                        <SelectValue placeholder="All Floors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_floors">All Floors</SelectItem>
                        {floors.map((floor) => (
                          <SelectItem key={floor} value={floor.toString()}>{floor ? `Floor ${floor}` : 'Unknown'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Room Type</Label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_types">All Types</SelectItem>
                        {roomTypes.map((type) => (
                          <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Room List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Available Rooms</CardTitle>
                <CardDescription>
                  Select a room to book
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading available rooms...</p>
                  </div>
                ) : filteredRooms.length > 0 ? (
                  <div className="space-y-4">
                    <RadioGroup value={selectedRoomId} onValueChange={setSelectedRoomId}>
                      {filteredRooms.map((room) => (
                        <div key={room.id} className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${selectedRoomId === room.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
                          <RadioGroupItem value={room.id} id={room.id} className="absolute top-4 right-4" />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h3 className="font-medium text-lg">Room {room.roomNumber}</h3>
                              <p className="text-gray-500 text-sm">Block {room.block}, Floor {room.floor}</p>
                            </div>
                            <div>
                              <p className="text-sm capitalize"><span className="font-medium">Type:</span> {room.type}</p>
                              <p className="text-sm"><span className="font-medium">Capacity:</span> {room.capacity} person{room.capacity > 1 ? 's' : ''}</p>
                            </div>
                            <div>
                              <p className="text-sm"><span className="font-medium">Amenities:</span></p>
                              <p className="text-sm text-gray-600">{room.amenities.join(', ')}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No rooms available matching your filters.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedBlock('');
                        setSelectedFloor('');
                        setSelectedType('');
                      }} 
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  disabled={!selectedRoomId || booking}
                  onClick={handleBookRoom}
                >
                  {booking ? 'Booking...' : 'Book Selected Room'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="current">
            {currentRoom && (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center">
                        <Home className="w-5 h-5 mr-2 text-blue-500" />
                        Room {currentRoom.roomNumber}
                      </CardTitle>
                      <CardDescription>Your current room details</CardDescription>
                    </div>
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center text-sm">
                      <Check className="w-4 h-4 mr-1" />
                      Booked
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Room Details</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span>Block:</span>
                          <span className="font-medium">{currentRoom.block}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Floor:</span>
                          <span className="font-medium">{currentRoom.floor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span className="font-medium capitalize">{currentRoom.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Capacity:</span>
                          <span className="font-medium">{currentRoom.capacity} person{currentRoom.capacity > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Amenities</h3>
                      <div className="mt-2">
                        <ul className="list-disc pl-5 space-y-1">
                          {currentRoom.amenities.map((amenity, index) => (
                            <li key={index} className="text-gray-600">{amenity}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">Request Maintenance</Button>
                  <Button variant="destructive">Request Room Change</Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RoomBooking;
