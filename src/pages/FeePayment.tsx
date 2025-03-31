
import React, { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
} from 'lucide-react';
import { FeeRecord } from '@/types';
import ChatBot from '@/components/ChatBot';

const FeePayment: React.FC = () => {
  const { userDetails } = useAuth();
  const { toast } = useToast();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  useEffect(() => {
    if (userDetails?.id) {
      fetchFees();
    }
  }, [userDetails?.id]);

  const fetchFees = async () => {
    if (!userDetails?.id) return;
    
    setLoading(true);
    try {
      // Query fees for the current student
      const querySnapshot = await getDocs(
        collection(db, 'fees')
      );
      
      const feesData: FeeRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include fees for the current student
        if (data.studentId === userDetails.id) {
          feesData.push({
            id: doc.id,
            ...data
          } as FeeRecord);
        }
      });
      
      // Create sample data if none exists
      if (feesData.length === 0) {
        const sampleFees = [
          {
            id: "fee1",
            studentId: userDetails.id,
            studentName: userDetails.name,
            amount: 5000,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            status: 'pending' as 'pending' | 'paid' | 'overdue'
          },
          {
            id: "fee2",
            studentId: userDetails.id,
            studentName: userDetails.name,
            amount: 5000,
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            status: 'overdue' as 'pending' | 'paid' | 'overdue'
          },
          {
            id: "fee3",
            studentId: userDetails.id,
            studentName: userDetails.name,
            amount: 5000,
            dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
            status: 'paid' as 'pending' | 'paid' | 'overdue',
            paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
            transactionId: "TXNID123456"
          }
        ];
        
        setFees(sampleFees);
        setLoading(false);
        return;
      }
      
      // Sort by due date (closest first)
      feesData.sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
      
      setFees(feesData);
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

  const openPaymentDialog = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setPaymentInfo({
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: ''
    });
    setShowPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedFee) return;
    
    // Validate payment info
    if (!paymentInfo.cardNumber || !paymentInfo.cardName || !paymentInfo.expiryDate || !paymentInfo.cvv) {
      toast({
        title: "Error",
        description: "Please fill all payment details",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Generate a random transaction ID
      const transactionId = "TXN" + Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // In a real app, we would process payment here
      // For now, we'll just mark the fee as paid
      
      // Update the fee record in Firestore
      await addDoc(collection(db, 'transactions'), {
        feeId: selectedFee.id,
        studentId: userDetails?.id,
        amount: selectedFee.amount,
        transactionId: transactionId,
        paymentDate: new Date().toISOString(),
        status: 'successful',
        createdAt: serverTimestamp()
      });
      
      // Update local state
      const updatedFees = fees.map(fee => 
        fee.id === selectedFee.id
          ? { 
              ...fee, 
              status: 'paid' as 'pending' | 'paid' | 'overdue', 
              paymentDate: new Date().toISOString(),
              transactionId: transactionId
            }
          : fee
      );
      
      setFees(updatedFees as FeeRecord[]);
      
      // Add notification
      await addDoc(collection(db, 'notifications'), {
        title: 'Payment Successful',
        message: `Your payment of ₹${selectedFee.amount} has been processed successfully. Transaction ID: ${transactionId}`,
        type: 'fee',
        userId: userDetails?.id,
        createdAt: serverTimestamp(),
        read: false
      });
      
      toast({
        title: "Payment Successful",
        description: `Transaction ID: ${transactionId}`,
      });
      
      setShowPaymentDialog(false);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    }
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
        setFees(updatedFees);
      }
    };

    checkOverdueFees();
  }, [fees]);

  // Calculate statistics
  const totalPaid = fees
    .filter(fee => fee.status === 'paid')
    .reduce((sum, fee) => sum + fee.amount, 0);
    
  const totalPending = fees
    .filter(fee => fee.status === 'pending' || fee.status === 'overdue')
    .reduce((sum, fee) => sum + fee.amount, 0);

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fee Payment</h1>
            <p className="text-gray-500">
              View and pay your hostel fees
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Paid Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{totalPaid}</div>
              <p className="text-sm text-gray-500">
                Total fees paid this semester
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
              <div className="text-3xl font-bold">₹{totalPending}</div>
              <p className="text-sm text-gray-500">
                Total pending fee amount
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fee Records</CardTitle>
            <CardDescription>
              View and pay your pending fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
              </div>
            ) : fees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Info</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">Hostel Fee</p>
                          <p className="text-sm text-gray-500">Semester Payment</p>
                        </div>
                      </TableCell>
                      <TableCell>₹{fee.amount}</TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4 text-gray-500" />
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
                        {fee.status !== 'paid' && (
                          <Button 
                            size="sm" 
                            onClick={() => openPaymentDialog(fee)}
                          >
                            <DollarSign className="mr-1 h-4 w-4" />
                            Pay Now
                          </Button>
                        )}
                        {fee.status === 'paid' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-green-600"
                            disabled
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 space-y-3">
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p className="text-gray-500">No fee records found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Enter your card details to pay the fee
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-sm text-gray-500">Fee Details</p>
              {selectedFee && (
                <div className="mt-2">
                  <p className="font-medium">Hostel Fee - ₹{selectedFee.amount}</p>
                  <p className="text-sm">Due Date: {new Date(selectedFee.dueDate).toLocaleDateString()}</p>
                  <p className="text-sm font-medium mt-2 text-red-600">
                    {selectedFee.status === 'overdue' && 
                      `Overdue by ${Math.abs(getDaysDifference(selectedFee.dueDate))} days`
                    }
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Card Number</label>
              <Input 
                placeholder="1234 5678 9012 3456"
                value={paymentInfo.cardNumber}
                onChange={(e) => setPaymentInfo({...paymentInfo, cardNumber: e.target.value})}
                maxLength={19}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Name on Card</label>
              <Input 
                placeholder="John Doe"
                value={paymentInfo.cardName}
                onChange={(e) => setPaymentInfo({...paymentInfo, cardName: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Date</label>
                <Input 
                  placeholder="MM/YY"
                  value={paymentInfo.expiryDate}
                  onChange={(e) => setPaymentInfo({...paymentInfo, expiryDate: e.target.value})}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CVV</label>
                <Input 
                  placeholder="123"
                  type="password"
                  value={paymentInfo.cvv}
                  onChange={(e) => setPaymentInfo({...paymentInfo, cvv: e.target.value})}
                  maxLength={3}
                />
              </div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-md flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                This is a demo payment form. No real payments will be processed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment}>
              Pay ₹{selectedFee?.amount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ChatBot />
    </DashboardLayout>
  );
};

export default FeePayment;
