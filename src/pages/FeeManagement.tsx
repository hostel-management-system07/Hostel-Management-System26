
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Filter, 
  Check, 
  AlertTriangle, 
  Clock,
  CalendarClock,
  DollarSign
} from 'lucide-react';
import { FeeRecord } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

const FeeManagement: React.FC = () => {
  const { toast } = useToast();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [filteredFees, setFilteredFees] = useState<FeeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  
  const [feeForm, setFeeForm] = useState({
    studentId: '',
    studentName: '',
    amount: '',
    dueDate: new Date(),
  });
  
  const [paymentForm, setPaymentForm] = useState({
    transactionId: '',
    paymentDate: new Date(),
  });

  useEffect(() => {
    fetchFees();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = [...fees];
    
    if (searchTerm) {
      filtered = filtered.filter(fee => 
        (fee.studentName && fee.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (fee.studentEmail && fee.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        fee.studentId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(fee => fee.status === statusFilter);
    }
    
    setFilteredFees(filtered);
  }, [searchTerm, statusFilter, fees]);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'fees'));
      
      const feesData: FeeRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        feesData.push({
          id: doc.id,
          ...doc.data()
        } as FeeRecord);
      });
      
      // Create sample data if none exists
      if (feesData.length === 0) {
        const sampleFees = [
          {
            id: "fee1",
            studentId: "student1",
            studentName: "John Doe",
            studentEmail: "john@example.com",
            amount: 5000,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            status: 'pending' as 'pending' | 'paid' | 'overdue'
          },
          {
            id: "fee2",
            studentId: "student2",
            studentName: "Jane Smith",
            studentEmail: "jane@example.com",
            amount: 5000,
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            status: 'overdue' as 'pending' | 'paid' | 'overdue'
          },
          {
            id: "fee3",
            studentId: "student3",
            studentName: "Mike Johnson",
            studentEmail: "mike@example.com",
            amount: 5000,
            dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
            status: 'paid' as 'pending' | 'paid' | 'overdue',
            paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
            transactionId: "TXNID123456"
          }
        ];
        
        setFees(sampleFees);
        setFilteredFees(sampleFees);
        setLoading(false);
        return;
      }
      
      // Sort by due date (closest first)
      feesData.sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
      
      setFees(feesData);
      setFilteredFees(feesData);
    } catch (error) {
      console.error("Error fetching fees:", error);
      toast({
        title: "Error",
        description: "Failed to load fee records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFee = async () => {
    if (!feeForm.studentId || !feeForm.studentName || !feeForm.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const feeData = {
        studentId: feeForm.studentId,
        studentName: feeForm.studentName,
        amount: parseInt(feeForm.amount),
        dueDate: feeForm.dueDate.toISOString(),
        status: 'pending' as 'pending' | 'paid' | 'overdue',
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'fees'), feeData);
      
      const newFee: FeeRecord = {
        id: docRef.id,
        ...feeData
      };
      
      setFees([...fees, newFee]);
      
      // Add notification for the student
      await addDoc(collection(db, 'notifications'), {
        title: 'Fee Payment Due',
        message: `You have a fee payment of ₹${feeForm.amount} due on ${format(feeForm.dueDate, 'MMM dd, yyyy')}`,
        type: 'fee',
        userId: feeForm.studentId,
        createdAt: serverTimestamp(),
        read: false
      });
      
      toast({
        title: "Success",
        description: "Fee record added successfully",
      });
      
      // Reset form and close dialog
      setFeeForm({
        studentId: '',
        studentName: '',
        amount: '',
        dueDate: new Date()
      });
      setShowAddDialog(false);
    } catch (error) {
      console.error("Error adding fee:", error);
      toast({
        title: "Error",
        description: "Failed to add fee record",
        variant: "destructive",
      });
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedFee || !paymentForm.transactionId) return;
    
    try {
      await updateDoc(doc(db, 'fees', selectedFee.id), {
        status: 'paid' as 'pending' | 'paid' | 'overdue',
        paymentDate: paymentForm.paymentDate.toISOString(),
        transactionId: paymentForm.transactionId
      });
      
      // Update state
      const updatedFees = fees.map(fee => 
        fee.id === selectedFee.id
          ? { 
              ...fee, 
              status: 'paid' as 'pending' | 'paid' | 'overdue',
              paymentDate: paymentForm.paymentDate.toISOString(),
              transactionId: paymentForm.transactionId
            }
          : fee
      ) as FeeRecord[];
      
      setFees(updatedFees);
      
      // Add notification for the student
      await addDoc(collection(db, 'notifications'), {
        title: 'Payment Confirmed',
        message: `Your payment of ₹${selectedFee.amount} has been received and confirmed.`,
        type: 'fee',
        userId: selectedFee.studentId,
        createdAt: serverTimestamp(),
        read: false
      });
      
      toast({
        title: "Success",
        description: "Fee marked as paid",
      });
      
      setShowMarkPaidDialog(false);
      setPaymentForm({
        transactionId: '',
        paymentDate: new Date()
      });
    } catch (error) {
      console.error("Error marking fee as paid:", error);
      toast({
        title: "Error",
        description: "Failed to update fee status",
        variant: "destructive",
      });
    }
  };

  const handleSendReminder = async (fee: FeeRecord) => {
    try {
      // In a real app, you might send an email here
      // For now, we'll just create a notification
      
      await addDoc(collection(db, 'notifications'), {
        title: 'Fee Payment Reminder',
        message: `This is a reminder that your fee payment of ₹${fee.amount} is due on ${new Date(fee.dueDate).toLocaleDateString()}. Please make the payment as soon as possible.`,
        type: 'fee',
        userId: fee.studentId,
        createdAt: serverTimestamp(),
        read: false
      });
      
      toast({
        title: "Success",
        description: "Reminder sent successfully",
      });
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive",
      });
    }
  };

  const openMarkPaidDialog = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setPaymentForm({
      transactionId: '',
      paymentDate: new Date()
    });
    setShowMarkPaidDialog(true);
  };

  const getFeeStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500 hover:bg-red-600">Overdue</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  const getDaysDifference = (dateStr: string) => {
    const today = new Date();
    const date = new Date(dateStr);
    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Update any overdue fees
  useEffect(() => {
    const checkOverdueFees = () => {
      const today = new Date();
      const updatedFees = fees.map(fee => {
        if (fee.status === 'pending' && new Date(fee.dueDate) < today) {
          return { ...fee, status: 'overdue' as 'pending' | 'paid' | 'overdue' };
        }
        return fee;
      });

      if (JSON.stringify(updatedFees) !== JSON.stringify(fees)) {
        setFees(updatedFees as FeeRecord[]);
      }
    };

    checkOverdueFees();
  }, [fees]);

  // Calculate statistics
  const totalFeesCollected = fees
    .filter(fee => fee.status === 'paid')
    .reduce((sum, fee) => sum + fee.amount, 0);
    
  const totalPendingAmount = fees
    .filter(fee => fee.status === 'pending' || fee.status === 'overdue')
    .reduce((sum, fee) => sum + fee.amount, 0);
  
  const overdueCount = fees.filter(fee => fee.status === 'overdue').length;

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fee Management</h1>
            <p className="text-gray-500">
              Manage student fees and payments
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Fee
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Fees Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{totalFeesCollected}</div>
              <p className="text-sm text-gray-500">
                Total amount collected from students
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{totalPendingAmount}</div>
              <p className="text-sm text-gray-500">
                Total pending fee amount
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Overdue Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overdueCount}</div>
              <p className="text-sm text-gray-500">
                Number of overdue fee payments
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fee Records</CardTitle>
                <CardDescription>
                  View and manage student fee payments
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by student..."
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
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
            ) : filteredFees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Details</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{fee.studentName || "Unknown"}</p>
                          <p className="text-sm text-gray-500">{fee.studentId}</p>
                        </div>
                      </TableCell>
                      <TableCell>₹{fee.amount}</TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center">
                            <CalendarClock className="mr-1 h-4 w-4 text-gray-500" />
                            <span>{new Date(fee.dueDate).toLocaleDateString()}</span>
                          </div>
                          {fee.status === 'pending' && (
                            <p className="text-xs mt-1">
                              {getDaysDifference(fee.dueDate) > 0 ? (
                                <span className="text-yellow-600">
                                  Due in {getDaysDifference(fee.dueDate)} days
                                </span>
                              ) : (
                                <span className="text-red-600">
                                  Due today
                                </span>
                              )}
                            </p>
                          )}
                          {fee.status === 'overdue' && (
                            <p className="text-xs mt-1 text-red-600">
                              Overdue by {Math.abs(getDaysDifference(fee.dueDate))} days
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getFeeStatusBadge(fee.status)}</TableCell>
                      <TableCell>
                        {fee.status === 'paid' ? (
                          <div>
                            <p className="text-xs">
                              <span className="font-medium">Paid on:</span> {new Date(fee.paymentDate || '').toLocaleDateString()}
                            </p>
                            <p className="text-xs">
                              <span className="font-medium">Transaction ID:</span> {fee.transactionId}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not paid yet</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {fee.status !== 'paid' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => openMarkPaidDialog(fee)}
                              >
                                <Check className="mr-1 h-4 w-4" />
                                Mark Paid
                              </Button>
                              
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleSendReminder(fee)}
                              >
                                Send Reminder
                              </Button>
                            </>
                          )}
                          {fee.status === 'paid' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled
                            >
                              <Check className="mr-1 h-4 w-4" />
                              Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 space-y-3">
                <CreditCard className="h-10 w-10 text-gray-400" />
                <p className="text-gray-500">No fee records found</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  Create New Fee Record
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Fee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Fee Record</DialogTitle>
            <DialogDescription>
              Create a new fee record for a student
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="student-id">Student ID</Label>
              <Input
                id="student-id"
                placeholder="Enter student ID"
                value={feeForm.studentId}
                onChange={(e) => setFeeForm({ ...feeForm, studentId: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="student-name">Student Name</Label>
              <Input
                id="student-name"
                placeholder="Enter student name"
                value={feeForm.studentName}
                onChange={(e) => setFeeForm({ ...feeForm, studentName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter fee amount"
                value={feeForm.amount}
                onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Due Date</Label>
              <DatePicker
                date={feeForm.dueDate}
                setDate={(date) => date && setFeeForm({ ...feeForm, dueDate: date })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFee}>
              Add Fee Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Paid Dialog */}
      <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Mark Fee as Paid</DialogTitle>
            <DialogDescription>
              Record payment details for this fee
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Fee Details</Label>
              {selectedFee && (
                <div className="p-4 border rounded-lg">
                  <p><span className="font-medium">Student:</span> {selectedFee.studentName}</p>
                  <p><span className="font-medium">Amount:</span> ₹{selectedFee.amount}</p>
                  <p><span className="font-medium">Due Date:</span> {new Date(selectedFee.dueDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transaction-id">Transaction ID</Label>
              <Input
                id="transaction-id"
                placeholder="Enter payment transaction ID"
                value={paymentForm.transactionId}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <DatePicker
                date={paymentForm.paymentDate}
                setDate={(date) => date && setPaymentForm({ ...paymentForm, paymentDate: date })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkPaidDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkPaid}>
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FeeManagement;
