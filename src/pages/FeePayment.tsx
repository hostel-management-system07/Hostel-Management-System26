
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FeeRecord } from '@/types';
import { CreditCard, Check, AlertTriangle, CalendarClock, Receipt, CreditCardIcon, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import ChatBot from '@/components/ChatBot';

const FeePayment: React.FC = () => {
  const { userDetails } = useAuth();
  const { toast } = useToast();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    upiId: '',
    bankName: '',
  });
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (userDetails?.id) {
      fetchStudentFees();
    }
  }, [userDetails?.id]);

  const fetchStudentFees = async () => {
    if (!userDetails?.id) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'fees'),
        where('studentId', '==', userDetails.id),
        orderBy('dueDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const feesData: FeeRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        feesData.push({
          id: doc.id,
          ...doc.data()
        } as FeeRecord);
      });
      
      // Create sample data if none exists
      if (feesData.length === 0) {
        const currentDate = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(currentDate.getMonth() + 1);
        
        const sampleFees: FeeRecord[] = [
          {
            id: "sample1",
            studentId: userDetails.id,
            amount: 5000,
            dueDate: nextMonth.toISOString(),
            status: 'pending',
            studentName: userDetails.name
          },
          {
            id: "sample2",
            studentId: userDetails.id,
            amount: 5000,
            dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 15).toISOString(),
            status: 'paid',
            studentName: userDetails.name,
            paymentDate: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 12).toISOString(),
            transactionId: "TXN" + Math.floor(100000 + Math.random() * 900000)
          }
        ];
        
        setFees(sampleFees);
      } else {
        setFees(feesData);
      }
    } catch (error) {
      console.error("Error fetching fees:", error);
      toast({
        title: "Error",
        description: "Failed to load fee information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentInitiate = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setShowPaymentDialog(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedFee) return;
    
    // Validate form based on payment method
    if (paymentMethod === 'card') {
      if (!paymentDetails.cardNumber || !paymentDetails.cardName || !paymentDetails.expiryDate || !paymentDetails.cvv) {
        toast({
          title: "Error",
          description: "Please fill in all card details",
          variant: "destructive",
        });
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!paymentDetails.upiId) {
        toast({
          title: "Error",
          description: "Please enter your UPI ID",
          variant: "destructive",
        });
        return;
      }
    } else if (paymentMethod === 'netbanking') {
      if (!paymentDetails.bankName) {
        toast({
          title: "Error",
          description: "Please select your bank",
          variant: "destructive",
        });
        return;
      }
    }
    
    setProcessing(true);
    
    try {
      // Generate a transaction ID
      const txnId = "TXN" + Math.floor(100000 + Math.random() * 900000);
      setTransactionId(txnId);
      
      // In a real application, we would process the payment here
      // For demo purposes, we'll simulate a successful payment after a delay
      setTimeout(async () => {
        // Update fee status in Firestore
        if (selectedFee.id !== 'sample1' && selectedFee.id !== 'sample2') {
          await updateDoc(doc(db, 'fees', selectedFee.id), {
            status: 'paid',
            paymentDate: new Date().toISOString(),
            transactionId: txnId
          });
        }
        
        // Update local state
        const updatedFees = fees.map(fee => 
          fee.id === selectedFee.id
            ? { 
                ...fee, 
                status: 'paid',
                paymentDate: new Date().toISOString(),
                transactionId: txnId
              }
            : fee
        );
        
        setFees(updatedFees);
        
        // Create a notification
        if (userDetails?.id) {
          await addDoc(collection(db, 'notifications'), {
            title: 'Payment Successful',
            message: `Your payment of ₹${selectedFee.amount} has been successfully processed. Transaction ID: ${txnId}`,
            type: 'fee',
            userId: userDetails.id,
            createdAt: serverTimestamp(),
            read: false
          });
        }
        
        // Close payment dialog and show success dialog
        setShowPaymentDialog(false);
        setShowSuccessDialog(true);
        setProcessing(false);
        
        // Reset payment details
        setPaymentDetails({
          cardNumber: '',
          cardName: '',
          expiryDate: '',
          cvv: '',
          upiId: '',
          bankName: '',
        });
      }, 2000);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  const pendingFees = fees.filter(fee => fee.status === 'pending' || fee.status === 'overdue');
  const paidFees = fees.filter(fee => fee.status === 'paid');
  
  const totalPendingAmount = pendingFees.reduce((sum, fee) => sum + fee.amount, 0);

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fee Payment</h1>
            <p className="text-gray-500">
              Pay your hostel fees and view payment history
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-2xl">Fee Summary</CardTitle>
                  <CardDescription>
                    Overview of your hostel fee payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col justify-between p-6 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="space-y-1">
                        <p className="text-sm text-blue-700 font-medium">Total Pending</p>
                        <p className="text-3xl font-bold">₹{totalPendingAmount}</p>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-blue-600">
                          {pendingFees.length} pending payment{pendingFees.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-between p-6 bg-green-50 rounded-lg border border-green-100">
                      <div className="space-y-1">
                        <p className="text-sm text-green-700 font-medium">Last Payment</p>
                        {paidFees.length > 0 ? (
                          <>
                            <p className="text-3xl font-bold">₹{paidFees[0].amount}</p>
                            <p className="text-sm text-green-600">
                              {new Date(paidFees[0].paymentDate || '').toLocaleDateString()}
                            </p>
                          </>
                        ) : (
                          <p className="text-lg font-medium">No payments yet</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-between p-6 bg-yellow-50 rounded-lg border border-yellow-100">
                      <div className="space-y-1">
                        <p className="text-sm text-yellow-700 font-medium">Next Due Date</p>
                        {pendingFees.length > 0 ? (
                          <>
                            <p className="text-3xl font-bold">
                              {format(new Date(pendingFees[0].dueDate), 'MMM dd')}
                            </p>
                            <p className="text-sm text-yellow-600">
                              ₹{pendingFees[0].amount} due
                            </p>
                          </>
                        ) : (
                          <p className="text-lg font-medium">No pending dues</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {pendingFees.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                      Pending Payments
                    </CardTitle>
                    <CardDescription>
                      Fees that need to be paid
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fee Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingFees.map((fee) => (
                          <TableRow key={fee.id}>
                            <TableCell>Hostel Fee</TableCell>
                            <TableCell className="font-medium">₹{fee.amount}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <CalendarClock className="mr-1 h-4 w-4 text-gray-500" />
                                <span>{format(new Date(fee.dueDate), 'MMM dd, yyyy')}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {fee.status === 'overdue' ? (
                                <Badge className="bg-red-500 hover:bg-red-600">Overdue</Badge>
                              ) : (
                                <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handlePaymentInitiate(pendingFees[0])}
                    >
                      Pay Now
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Check className="h-5 w-5 mr-2 text-green-500" />
                      All Caught Up!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-6">
                    <div className="bg-green-100 p-3 rounded-full mb-4">
                      <Check className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">No Pending Fees</h3>
                    <p className="text-gray-500 text-center">
                      You have no pending fee payments at the moment. Thank you for staying up to date!
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Receipt className="h-5 w-5 mr-2 text-blue-500" />
                    Payment History
                  </CardTitle>
                  <CardDescription>
                    Your previous payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paidFees.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date Paid</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Transaction ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paidFees.map((fee) => (
                          <TableRow key={fee.id}>
                            <TableCell>
                              {format(new Date(fee.paymentDate || ''), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="font-medium">₹{fee.amount}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {fee.transactionId}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Receipt className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-gray-500">No payment history available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Complete your fee payment securely
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedFee && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 font-medium">Payment Details</p>
                <p className="text-2xl font-bold my-1">₹{selectedFee.amount}</p>
                <p className="text-sm text-blue-700">Due Date: {format(new Date(selectedFee.dueDate), 'MMM dd, yyyy')}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <Label className="text-base">Select Payment Method</Label>
                <RadioGroup 
                  className="grid grid-cols-3 gap-4 mt-2" 
                  value={paymentMethod}
                  onValueChange={(value: 'card' | 'upi' | 'netbanking') => setPaymentMethod(value)}
                >
                  <div>
                    <RadioGroupItem value="card" id="card" className="peer sr-only" />
                    <Label
                      htmlFor="card"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <CreditCardIcon className="mb-2 h-5 w-5" />
                      Card
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="upi" id="upi" className="peer sr-only" />
                    <Label
                      htmlFor="upi"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="mb-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="14" x="2" y="5" rx="2" />
                        <line x1="2" x2="22" y1="10" y2="10" />
                      </svg>
                      UPI
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="netbanking" id="netbanking" className="peer sr-only" />
                    <Label
                      htmlFor="netbanking"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="mb-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="14" x="2" y="5" rx="2" />
                        <line x1="6" x2="6" y1="9" y2="9.01" />
                        <line x1="10" x2="10" y1="9" y2="9.01" />
                        <line x1="14" x2="14" y1="9" y2="9.01" />
                        <line x1="18" x2="18" y1="9" y2="9.01" />
                        <line x1="6" x2="6" y1="13" y2="13.01" />
                        <line x1="18" x2="18" y1="13" y2="13.01" />
                        <line x1="10" x2="14" y1="13" y2="13" />
                      </svg>
                      Net Banking
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-number">Card Number</Label>
                    <Input
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      value={paymentDetails.cardNumber}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-name">Name on Card</Label>
                    <Input
                      id="card-name"
                      placeholder="John Doe"
                      value={paymentDetails.cardName}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, cardName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={paymentDetails.expiryDate}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, expiryDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={paymentDetails.cvv}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {paymentMethod === 'upi' && (
                <div className="space-y-2">
                  <Label htmlFor="upi-id">UPI ID</Label>
                  <Input
                    id="upi-id"
                    placeholder="username@upi"
                    value={paymentDetails.upiId}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })}
                  />
                </div>
              )}
              
              {paymentMethod === 'netbanking' && (
                <div className="space-y-2">
                  <Label htmlFor="bank">Select Bank</Label>
                  <select 
                    id="bank"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={paymentDetails.bankName}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                  >
                    <option value="">Select your bank</option>
                    <option value="sbi">State Bank of India</option>
                    <option value="hdfc">HDFC Bank</option>
                    <option value="icici">ICICI Bank</option>
                    <option value="axis">Axis Bank</option>
                    <option value="pnb">Punjab National Bank</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit} disabled={processing}>
              {processing ? 'Processing...' : `Pay ₹${selectedFee?.amount || 0}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Successful</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">Thank You!</h3>
            <p className="text-gray-500 text-center mb-4">
              Your payment has been processed successfully.
            </p>
            <div className="bg-gray-50 w-full p-4 rounded-lg">
              <p className="font-medium">Transaction Details:</p>
              <div className="flex justify-between mt-2">
                <span className="text-gray-500">Amount:</span>
                <span className="font-medium">₹{selectedFee?.amount}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">Transaction ID:</span>
                <span className="font-medium">{transactionId}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">Date:</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ChatBot />
    </DashboardLayout>
  );
};

export default FeePayment;
