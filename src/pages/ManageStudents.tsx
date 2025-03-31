
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';
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

const ManageStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

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
              const roomDoc = await getDocs(
                query(collection(db, 'rooms'), where('id', '==', userData.roomId))
              );
              if (!roomDoc.empty) {
                roomNumber = roomDoc.docs[0].data().roomNumber;
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

    fetchStudents();
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
        // Here you would update the room status
        // This would depend on your room structure
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
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => openDeleteDialog(student)}
                >
                  <UserX className="h-4 w-4 mr-1" /> Remove
                </Button>
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
              <Button className="w-full mb-2">
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
              <Button className="w-full mb-2">
                Bulk Room Assignment
              </Button>
              <Button variant="outline" className="w-full">
                Room Availability
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

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
    </DashboardLayout>
  );
};

export default ManageStudents;
