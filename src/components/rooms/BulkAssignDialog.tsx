
import React, { useState, useEffect } from 'react';
import { serverTimestamp, updateDoc, doc, addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCcw, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { RoomWithStudents } from '@/types/room';
import { Student } from '@/types/student';

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: RoomWithStudents[];
  onStudentsAssigned: () => void;
  initialRoomId?: string;
}

const BulkAssignDialog: React.FC<BulkAssignDialogProps> = ({ 
  open, 
  onOpenChange, 
  rooms,
  onStudentsAssigned,
  initialRoomId = ''
}) => {
  const { toast } = useToast();
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [targetRoomId, setTargetRoomId] = useState<string>('');
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);

  // Set initial room ID when opened
  useEffect(() => {
    if (open && initialRoomId) {
      setTargetRoomId(initialRoomId);
    }
  }, [open, initialRoomId]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      if (!initialRoomId) {
        setTargetRoomId('');
      }
      setSelectedStudents([]);
    }
  }, [open, initialRoomId]);

  // Fetch students when dialog opens
  useEffect(() => {
    if (open) {
      fetchUnassignedStudents();
    }
  }, [open]);

  const fetchUnassignedStudents = async () => {
    try {
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsList: Student[] = [];
      
      studentsSnapshot.forEach((doc) => {
        studentsList.push({ id: doc.id, ...doc.data() } as Student);
      });
      
      // Filter unassigned students
      const unassignedList = studentsList.filter(student => !student.roomId);
      setUnassignedStudents(unassignedList);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load unassigned students",
        variant: "destructive",
      });
    }
  };

  const handleStudentSelection = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
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
      
      // Notify parent component to refresh data
      onStudentsAssigned();
      
      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning rooms:', error);
      toast({
        title: "Error",
        description: "Failed to assign rooms",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  onClick={fetchUnassignedStudents}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
  );
};

export default BulkAssignDialog;
