
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, query, where, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserX, Mail, Phone, Home, GraduationCap } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { createUserNotification } from '@/utils/notificationUtils';

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roomId?: string;
  roomNumber?: string;
  course?: string;
  year?: string;
  joinedAt: string;
  status: 'active' | 'inactive';
}

interface Room {
  id: string;
  roomNumber: string;
  capacity: number;
  occupied: number;
  floor: number;
  block: string;
  type: string;
  status: 'available' | 'occupied' | 'maintenance';
}

const ManageStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRoomAssignDialog, setShowRoomAssignDialog] = useState(false);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [studentToAssign, setStudentToAssign] = useState<Student | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const { toast } = useToast();
  const { userDetails } = useAuth();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const snapshot = await getDocs(q);
        
        const studentsData: Student[] = [];
        
        for (const userDoc of snapshot.docs) {
          const userData = userDoc.data();
          
          // Get the student's room information if available
          let roomNumber = '';
          if (userData.roomId) {
            try {
              const roomDoc = await getDoc(doc(db, 'rooms', userData.roomId));
              if (roomDoc.exists()) {
                roomNumber = roomDoc.data().roomNumber;
              }
            } catch (error) {
              console.error("Error fetching room data:", error);
            }
          }
          
          studentsData.push({
            id: userDoc.id,
            name: userData.name || 'No Name',
            email: userData.email || 'No Email',
            phone: userData.phone || 'Not provided',
            roomId: userData.roomId || '',
            roomNumber: roomNumber,
            course: userData.course || 'Not specified',
            year: userData.year || 'Not specified',
            joinedAt: userData.createdAt || new Date().toISOString(),
            status: userData.status || 'active',
          });
        }
        
        setStudents(studentsData);
        setFilteredStudents(studentsData);
      } catch (error) {
        console.error("Error fetching students:", error);
        toast({
          title: "Error",
          description: "Failed to load student data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch available rooms
    const fetchRooms = async () => {
      try {
        const q = query(collection(db, 'rooms'), where('status', '==', 'available'));
        const snapshot = await getDocs(q);
        
        const roomsData: Room[] = [];
        snapshot.forEach((doc) => {
          roomsData.push({ id: doc.id, ...doc.data() } as Room);
        });
        
        setAvailableRooms(roomsData);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };

    fetchStudents();
    fetchRooms();
  }, [toast]);

  useEffect(() => {
    const results = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.roomNumber && student.roomNumber.includes(searchTerm))
    );
    setFilteredStudents(results);
  }, [searchTerm, students]);

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    try {
      // Delete from users collection
      await deleteDoc(doc(db, 'users', studentToDelete.id));
      
      // If student has a room, update the room occupancy
      if (studentToDelete.roomId) {
        const roomRef = doc(db, 'rooms', studentToDelete.roomId);
        const roomDoc = await getDoc(roomRef);
        
        if (roomDoc.exists()) {
          const roomData = roomDoc.data();
          await updateDoc(roomRef, {
            occupied: Math.max(0, (roomData.occupied || 1) - 1),
            status: roomData.occupied <= 1 ? 'available' : 'occupied'
          });
        }
      }
      
      // Update the UI
      setStudents(students.filter(s => s.id !== studentToDelete.id));
      setFilteredStudents(filteredStudents.filter(s => s.id !== studentToDelete.id));
      
      toast({
        title: "Success",
        description: `Student ${studentToDelete.name} has been removed`,
      });
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setStudentToDelete(null);
    }
  };

  const openDeleteDialog = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteDialog(true);
  };

  const openRoomAssignDialog = (student: Student) => {
    setStudentToAssign(student);
    setShowRoomAssignDialog(true);
  };

  const handleAssignRoom = async () => {
    if (!studentToAssign || !selectedRoom) return;
    
    try {
      // Get room data
      const roomRef = doc(db, 'rooms', selectedRoom);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        throw new Error('Room not found');
      }
      
      const roomData = roomDoc.data();
      
      // Check if room is at capacity
      if (roomData.occupied >= roomData.capacity) {
        toast({
          title: "Error",
          description: "This room is already at full capacity",
          variant: "destructive",
        });
        return;
      }
      
      // If student already has a room, update old room first
      if (studentToAssign.roomId) {
        const oldRoomRef = doc(db, 'rooms', studentToAssign.roomId);
        const oldRoomDoc = await getDoc(oldRoomRef);
        
        if (oldRoomDoc.exists()) {
          const oldRoomData = oldRoomDoc.data();
          await updateDoc(oldRoomRef, {
            occupied: Math.max(0, (oldRoomData.occupied || 1) - 1),
            status: oldRoomData.occupied <= 1 ? 'available' : 'occupied'
          });
        }
      }
      
      // Update room occupancy
      await updateDoc(roomRef, {
        occupied: (roomData.occupied || 0) + 1,
        status: 'occupied'
      });
      
      // Update student's room assignment
      await updateDoc(doc(db, 'users', studentToAssign.id), {
        roomId: selectedRoom
      });
      
      // Send notification to student
      await createUserNotification(studentToAssign.id, {
        title: "Room Assignment",
        message: `You have been assigned to room ${roomData.roomNumber}`,
        type: "room",
      });
      
      // Update local state
      const updatedStudents = students.map(student => 
        student.id === studentToAssign.id 
          ? { ...student, roomId: selectedRoom, roomNumber: roomData.roomNumber }
          : student
      );
      
      setStudents(updatedStudents);
      setFilteredStudents(updatedStudents.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.roomNumber && student.roomNumber.includes(searchTerm))
      ));
      
      toast({
        title: "Success",
        description: `${studentToAssign.name} has been assigned to room ${roomData.roomNumber}`,
      });
      
      // Close dialog and reset state
      setShowRoomAssignDialog(false);
      setSelectedRoom('');
      setStudentToAssign(null);
      
    } catch (error) {
      console.error("Error assigning room:", error);
      toast({
        title: "Error",
        description: "Failed to assign room to student",
        variant: "destructive",
      });
    }
  };

  const handleBulkRoomAssignment = async () => {
    toast({
      title: "Feature in Progress",
      description: "Bulk room assignment feature is coming soon",
    });
    setBulkAssignDialogOpen(false);
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody) {
      toast({
        title: "Error",
        description: "Please provide both subject and message",
        variant: "destructive",
      });
      return;
    }
    
    setSendingEmail(true);
    try {
      // Create notifications for all students
      for (const student of students) {
        await createUserNotification(student.id, {
          title: emailSubject,
          message: emailBody,
          type: "announcement",
        });
      }
      
      // Add an announcement that will appear in the announcements section
      await updateDoc(doc(db, 'announcements', 'latest'), {
        title: emailSubject,
        content: emailBody,
        createdBy: userDetails?.name || 'Admin',
        createdAt: new Date().toISOString(),
        important: emailSubject.toLowerCase().includes('urgent') || emailSubject.toLowerCase().includes('important'),
      }).catch(() => {
        // If document doesn't exist, create it
        const announcementsCollection = collection(db, 'announcements');
        return addDoc(announcementsCollection, {
          title: emailSubject,
          content: emailBody,
          createdBy: userDetails?.name || 'Admin',
          createdAt: new Date().toISOString(),
          important: emailSubject.toLowerCase().includes('urgent') || emailSubject.toLowerCase().includes('important'),
        });
      });
      
      toast({
        title: "Success",
        description: `Message sent to ${students.length} students`,
      });
      
      // Reset form and close dialog
      setEmailSubject('');
      setEmailBody('');
      setEmailDialogOpen(false);
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: "Failed to send message to students",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const renderStudentTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>Course/Year</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.name}</TableCell>
              <TableCell>{student.email}</TableCell>
              <TableCell>{student.roomNumber || 'Not Assigned'}</TableCell>
              <TableCell>
                {student.course}, {student.year}
              </TableCell>
              <TableCell>{new Date(student.joinedAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge 
                  variant={student.status === 'active' ? 'default' : 'secondary'}
                  className={
                    student.status === 'active' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-gray-500 hover:bg-gray-600'
                  }
                >
                  {student.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openRoomAssignDialog(student)}
                  >
                    <Home className="h-4 w-4 mr-1" /> Assign Room
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => openDeleteDialog(student)}
                  >
                    <UserX className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
              {isLoading ? 'Loading students...' : 'No students found'}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
  
  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manage Students</h1>
            <p className="text-gray-500">View and manage student records</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Student Directory</CardTitle>
                <CardDescription>
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} registered
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderStudentTable()}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-500" />
                Student Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Students:</span>
                  <span className="font-medium">{students.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">With Room:</span>
                  <span className="font-medium">
                    {students.filter(s => s.roomId).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Without Room:</span>
                  <span className="font-medium">
                    {students.filter(s => !s.roomId).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                Communication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full mb-2" onClick={() => setEmailDialogOpen(true)}>
                Send Mass Email
              </Button>
              <Button variant="outline" className="w-full">
                Send Fee Reminder
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-500" />
                Room Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full mb-2" onClick={() => setBulkAssignDialogOpen(true)}>
                Bulk Room Assignment
              </Button>
              <Button variant="outline" className="w-full">
                Room Availability
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Student Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Student Removal</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {studentToDelete?.name}? This action cannot be undone.
              {studentToDelete?.roomId && (
                <p className="mt-2 text-amber-600">
                  Note: This student currently has a room assigned (Room {studentToDelete?.roomNumber}).
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteStudent}>
              Remove Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Assignment Dialog */}
      <Dialog open={showRoomAssignDialog} onOpenChange={setShowRoomAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Room to {studentToAssign?.name}</DialogTitle>
            <DialogDescription>
              Select a room to assign to this student.
              {studentToAssign?.roomId && (
                <p className="mt-2 text-amber-600">
                  Note: This student is currently assigned to Room {studentToAssign?.roomNumber}.
                  Assigning a new room will update their assignment.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="room-select">Available Rooms</Label>
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger id="room-select">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.roomNumber} - Block {room.block}, Floor {room.floor} ({room.type})
                      </SelectItem>
                    ))}
                    {availableRooms.length === 0 && (
                      <SelectItem value="no-rooms" disabled>No available rooms</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoomAssignDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleAssignRoom} 
              disabled={!selectedRoom || selectedRoom === 'no-rooms'}
            >
              Assign Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Room Assignment Dialog */}
      <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Room Assignment</DialogTitle>
            <DialogDescription>
              Automatically assign rooms to students without room assignments.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {students.filter(s => !s.roomId).length} students without room assignments.
              </p>
              <p className="text-sm text-gray-500">
                {availableRooms.length} available rooms.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleBulkRoomAssignment}
              disabled={availableRooms.length === 0 || students.filter(s => !s.roomId).length === 0}
            >
              Assign Rooms
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mass Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Send Message to All Students</DialogTitle>
            <DialogDescription>
              Compose a message to be sent to all {students.length} students.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="Enter subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email-body">Message</Label>
              <textarea
                id="email-body"
                placeholder="Enter your message..."
                rows={5}
                className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleSendEmail}
              disabled={sendingEmail || !emailSubject || !emailBody}
            >
              {sendingEmail ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ManageStudents;
