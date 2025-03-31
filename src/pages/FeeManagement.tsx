
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { 
  Search, 
  Send, 
  AlertCircle,
  CreditCard,
  DollarSign,
  Calendar,
  Users,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Fee } from '@/types';

interface FeeRecord extends Fee {
  studentName?: string;
  studentEmail?: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  roomNumber?: string;
  course?: string;
  year?: string;
}

const FeeManagement: React.FC = () => {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [filteredFees, setFilteredFees] = useState<FeeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddFeeDialog, setShowAddFeeDialog] = useState(false);
  const [showSendReminderDialog, setShowSendReminderDialog] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const { toast } = useToast();

  // Form state for adding fee
  const [formData, setFormData] = useState({
    amount: 5000,
    dueDate: '',
    studentId: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchFees();
    fetchStudents();
  }, []);

  useEffect(() => {
    let filtered = [...fees];
    
    if (searchTerm) {
      filtered = filtered.filter(
        fee =>
          fee.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fee.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(fee => fee.status === statusFilter);
    }
    
    setFilteredFees(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchTerm, statusFilter, fees]);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'fees'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const feesData: FeeRecord[] = [];
      querySnapshot.forEach((doc) => {
        feesData.push({
          id: doc.id,
          ...doc.data()
        } as FeeRecord);
      });
      
      // If no fees found, create sample data
      if (feesData.length === 0) {
        // First fetch some students to create fee records for
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const studentsSnapshot = await getDocs(studentsQuery);
        
        const studentsList: Student[] = [];
        studentsSnapshot.forEach(doc => {
          const data = doc.data();
          studentsList.push({
            id: doc.id,
            name: data.name || 'Student',
            email: data.email || 'student@example.com',
            roomNumber: data.roomNumber,
            course: data.course,
            year: data.year
          });
        });
        
        // If no students found, create a couple of sample students
        if (studentsList.length === 0) {
          const sample1 = {
            name: 'John Doe',
            email: 'john@example.com',
            role: 'student',
            createdAt: serverTimestamp()
          };
          
          const sample2 = {
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'student',
            createdAt: serverTimestamp()
          };
          
          const student1Ref = await addDoc(collection(db, 'users'), sample1);
          const student2Ref = await addDoc(collection(db, 'users'), sample2);
          
          studentsList.push({
            id: student1Ref.id,
            name: sample1.name,
            email: sample1.email
          });
          
          studentsList.push({
            id: student2Ref.id,
            name: sample2.name,
            email: sample2.email
          });
        }
        
        // Create sample fee records
        const currentDate = new Date();
        
        // Due date for next month
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        // Due date for last month (overdue)
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        // Create fee records for each student
        for (const student of studentsList) {
          // Current month fee (paid)
          await addDoc(collection(db, 'fees'), {
            studentId: student.id,
            studentName: student.name,
            studentEmail: student.email,
            amount: 5000,
            dueDate: currentDate.toISOString(),
            status: 'paid',
            paymentDate: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            transactionId: 'TXN' + Math.floor(Math.random() * 1000000),
            createdAt: serverTimestamp(),
          });
          
          // Next month fee (pending)
          await addDoc(collection(db, 'fees'), {
            studentId: student.id,
            studentName: student.name,
            studentEmail: student.email,
            amount: 5000,
            dueDate: nextMonth.toISOString(),
            status: 'pending',
            createdAt: serverTimestamp(),
          });
          
          // Add an overdue fee for one student
          if (student === studentsList[0]) {
            await addDoc(collection(db, 'fees'), {
              studentId: student.id,
              studentName: student.name,
              studentEmail: student.email,
              amount: 5000,
              dueDate: lastMonth.toISOString(),
              status: 'overdue',
              createdAt: serverTimestamp(),
            });
          }
        }
        
        // Re-fetch to get the sample data with IDs
        return fetchFees();
      }
      
      setFees(feesData);
      setFilteredFees(feesData);
    } catch (error) {
      console.error('Error fetching fees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load fee records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
      const studentsSnapshot = await getDocs(studentsQuery);
      
      const studentsList: Student[] = [];
      studentsSnapshot.forEach(doc => {
        const data = doc.data();
        studentsList.push({
          id: doc.id,
          name: data.name || 'Student',
          email: data.email || 'student@example.com',
          roomNumber: data.roomNumber,
          course: data.course,
          year: data.year
        });
      });
      
      setStudents(studentsList);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'amount' ? Number(value) : value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (name === 'studentId') {
      setSelectedStudentId(value);
    }
  };

  const handleAddFee = async () => {
    if (!formData.studentId || !formData.dueDate || formData.amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields correctly',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const selectedStudent = students.find(s => s.id === formData.studentId);
      
      if (!selectedStudent) {
        toast({
          title: 'Error',
          description: 'Selected student not found',
          variant: 'destructive',
        });
        return;
      }
      
      const feeData = {
        studentId: formData.studentId,
        studentName: selectedStudent.name,
        studentEmail: selectedStudent.email,
        amount: formData.amount,
        dueDate: new Date(formData.dueDate).toISOString(),
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'fees'), feeData);
      
      // Add notification for student
      await addDoc(collection(db, 'notifications'), {
        title: 'New Fee Added',
        message: `A new fee of ₹${formData.amount} has been added to your account with due date ${new Date(formData.dueDate).toLocaleDateString()}`,
        type: 'fee',
        userId: formData.studentId,
        createdAt: serverTimestamp(),
        read: false
      });
      
      const newFee = { 
        id: docRef.id, 
        ...feeData,
        createdAt: new Date().toISOString()
      } as FeeRecord;
      
      setFees([newFee, ...fees]);
      
      toast({
        title: 'Success',
        description: `Fee record added for ${selectedStudent.name}`,
      });
      
      setShowAddFeeDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error adding fee record:', error);
      toast({
        title: 'Error',
        description: 'Failed to add fee record',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      amount: 5000,
      dueDate: '',
      studentId: ''
    });
    setSelectedStudentId('');
  };

  const openAddFeeDialog = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const formattedDate = nextMonth.toISOString().split('T')[0];
    
    setFormData({
      amount: 5000,
      dueDate: formattedDate,
      studentId: ''
    });
    
    setShowAddFeeDialog(true);
  };

  const openSendReminderDialog = () => {
    setShowSendReminderDialog(true);
  };

  const handleSendReminders = async () => {
    try {
      // Get all pending and overdue fees
      const pendingFees = fees.filter(fee => 
        fee.status === 'pending' || fee.status === 'overdue'
      );
      
      // Create notifications for each student
      for (const fee of pendingFees) {
        await addDoc(collection(db, 'notifications'), {
          title: fee.status === 'overdue' ? 'Urgent: Overdue Fee' : 'Fee Payment Reminder',
          message: fee.status === 'overdue' 
            ? `Your fee payment of ₹${fee.amount} is overdue. Please clear your dues immediately to avoid penalties.`
            : `Reminder: Your fee payment of ₹${fee.amount} is due on ${new Date(fee.dueDate).toLocaleDateString()}. Please make the payment on time.`,
          type: 'fee',
          userId: fee.studentId,
          createdAt: serverTimestamp(),
          read: false
        });
      }
      
      toast({
        title: 'Reminders Sent',
        description: `Fee reminders sent to ${pendingFees.length} student(s)`,
      });
      
      setShowSendReminderDialog(false);
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast({
        title: 'Error',
        description: 'Failed to send fee reminders',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = async (feeId: string) => {
    try {
      await updateDoc(doc(db, 'fees', feeId), {
        status: 'paid',
        paymentDate: new Date().toISOString(),
        transactionId: 'MANUAL-' + Math.floor(Math.random() * 1000000),
      });
      
      // Update the fees list
      const updatedFees = fees.map(fee =>
        fee.id === feeId
          ? { 
              ...fee, 
              status: 'paid',
              paymentDate: new Date().toISOString(),
              transactionId: 'MANUAL-' + Math.floor(Math.random() * 1000000)
            }
          : fee
      );
      
      setFees(updatedFees);
      
      // Find the fee to get student details
      const fee = fees.find(f => f.id === feeId);
      
      if (fee) {
        // Add notification for student
        await addDoc(collection(db, 'notifications'), {
          title: 'Fee Payment Recorded',
          message: `Your fee payment of ₹${fee.amount} has been recorded by the admin.`,
          type: 'fee',
          userId: fee.studentId,
          createdAt: serverTimestamp(),
          read: false
        });
      }
      
      toast({
        title: 'Payment Recorded',
        description: 'The fee has been marked as paid',
      });
    } catch (error) {
      console.error('Error marking fee as paid:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsOverdue = async (feeId: string) => {
    try {
      await updateDoc(doc(db, 'fees', feeId), {
        status: 'overdue',
      });
      
      // Update the fees list
      const updatedFees = fees.map(fee =>
        fee.id === feeId
          ? { ...fee, status: 'overdue' }
          : fee
      );
      
      setFees(updatedFees);
      
      // Find the fee to get student details
      const fee = fees.find(f => f.id === feeId);
      
      if (fee) {
        // Add notification for student
        await addDoc(collection(db, 'notifications'), {
          title: 'Fee Payment Overdue',
          message: `Your fee payment of ₹${fee.amount} is now overdue. Please make the payment immediately to avoid penalties.`,
          type: 'fee',
          userId: fee.studentId,
          createdAt: serverTimestamp(),
          read: false
        });
      }
      
      toast({
        title: 'Status Updated',
        description: 'The fee has been marked as overdue',
      });
    } catch (error) {
      console.error('Error marking fee as overdue:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    }
  };

  const getFeeStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500 hover:bg-red-600">Overdue</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
    }
  };

  // Statistics
  const totalFees = fees.length;
  const paidFees = fees.filter(fee => fee.status === 'paid').length;
  const pendingFees = fees.filter(fee => fee.status === 'pending').length;
  const overdueFees = fees.filter(fee => fee.status === 'overdue').length;
  
  const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const collectedAmount = fees.filter(fee => fee.status === 'paid')
    .reduce((sum, fee) => sum + fee.amount, 0);
  const pendingAmount = fees.filter(fee => fee.status !== 'paid')
    .reduce((sum, fee) => sum + fee.amount, 0);
    
  const collectionRate = totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0;

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFees = filteredFees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFees.length / itemsPerPage);

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fee Management</h1>
            <p className="text-gray-500">Track and manage hostel fee payments</p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={openSendReminderDialog}>
              <Send className="mr-2 h-4 w-4" /> Send Reminders
            </Button>
            <Button onClick={openAddFeeDialog}>
              <CreditCard className="mr-2 h-4 w-4" /> Add Fee
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Collection Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(collectionRate)}%</div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full" 
                  style={{ width: `${collectionRate}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ₹{collectedAmount} of ₹{totalAmount}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Paid Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{paidFees}</div>
              <p className="text-xs text-gray-500 mt-1">Amount: ₹{collectedAmount}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pending Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pendingFees}</div>
              <p className="text-xs text-gray-500 mt-1">Due soon</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Overdue Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{overdueFees}</div>
              <p className="text-xs text-gray-500 mt-1">Need attention</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fee Records</CardTitle>
            <CardDescription>
              Manage student fee payments and dues
            </CardDescription>
            <div className="flex items-center justify-between mt-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by student..."
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
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
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
            ) : currentFees.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Fee Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentFees.map(fee => (
                      <TableRow key={fee.id}>
                        <TableCell>
                          <div className="font-medium">{fee.studentName}</div>
                          <div className="text-sm text-gray-500">{fee.studentEmail}</div>
                        </TableCell>
                        <TableCell>₹{fee.amount}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3 text-gray-500" />
                            <span>{new Date(fee.dueDate).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getFeeStatusBadge(fee.status)}</TableCell>
                        <TableCell>
                          {fee.paymentDate 
                            ? new Date(fee.paymentDate).toLocaleDateString()
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {fee.transactionId || '-'}
                        </TableCell>
                        <TableCell>
                          {fee.status === 'paid' ? (
                            <Button variant="outline" size="sm" className="w-full">
                              <Download className="h-3 w-3 mr-1" /> Receipt
                            </Button>
                          ) : fee.status === 'pending' ? (
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleMarkAsPaid(fee.id)}
                              >
                                Mark Paid
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleMarkAsOverdue(fee.id)}
                              >
                                Mark Overdue
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleMarkAsPaid(fee.id)}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <p className="text-sm text-gray-500">
                      Page {currentPage} of {totalPages}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-40">
                <DollarSign className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500">No fee records found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Fee Dialog */}
      <Dialog open={showAddFeeDialog} onOpenChange={setShowAddFeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Fee</DialogTitle>
            <DialogDescription>
              Create a new fee record for a student
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student</Label>
              <Select 
                value={formData.studentId} 
                onValueChange={(value) => handleSelectChange('studentId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} - {student.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Fee Amount (₹)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="1"
                value={formData.amount}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFeeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFee}>
              Add Fee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminder Dialog */}
      <Dialog open={showSendReminderDialog} onOpenChange={setShowSendReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Fee Reminders</DialogTitle>
            <DialogDescription>
              Send payment reminders to students with pending or overdue fees
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <div>
                <h4 className="font-medium">Send Fee Reminders</h4>
                <p className="text-sm text-gray-600">
                  This will send notifications to {pendingFees + overdueFees} students with pending or overdue fees.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendReminderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendReminders}>
              Send Reminders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FeeManagement;
