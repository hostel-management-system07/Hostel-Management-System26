
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Receipt, 
  FileText, 
  DollarSign,
  Banknote
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Fee } from '@/types';
import ChatBot from '@/components/ChatBot';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

const paymentMethods: PaymentMethod[] = [
  { id: 'card', name: 'Credit/Debit Card', description: 'Pay securely with your card', icon: CreditCard },
  { id: 'netbanking', name: 'Net Banking', description: 'Direct bank transfer', icon: DollarSign },
  { id: 'upi', name: 'UPI', description: 'Pay instantly with UPI', icon: Banknote },
];

const FeePayment: React.FC = () => {
  const { userDetails } = useAuth();
  const { toast } = useToast();
  const [feeDetails, setFeeDetails] = useState<Fee | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    fetchFeeDetails();
  }, [userDetails?.id]);

  const fetchFeeDetails = async () => {
    if (!userDetails?.id) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'fees'),
        where('studentId', '==', userDetails.id)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const feeData = querySnapshot.docs[0].data();
        setFeeDetails({
          id: querySnapshot.docs[0].id,
          ...feeData
        } as Fee);
        
        // Fetch payment history
        const paymentHistoryQuery = query(
          collection(db, 'payments'),
          where('studentId', '==', userDetails.id)
        );
        const paymentHistorySnapshot = await getDocs(paymentHistoryQuery);
        const history = paymentHistorySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPaymentHistory(history);
      } else {
        // Create sample fee data if none exists
        const currentDate = new Date();
        const dueDate = new Date(currentDate);
        dueDate.setMonth(dueDate.getMonth() + 1);
        
        const feeData = {
          studentId: userDetails.id,
          studentName: userDetails.name,
          amount: 5000,
          dueDate: dueDate.toISOString(),
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        
        const docRef = await addDoc(collection(db, 'fees'), feeData);
        setFeeDetails({
          id: docRef.id,
          ...feeData
        } as Fee);
        
        // Create a sample payment history
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const samplePayment = {
          studentId: userDetails.id,
          amount: 5000,
          paymentDate: lastMonth.toISOString(),
          transactionId: 'TXN' + Math.floor(Math.random() * 1000000),
          paymentMethod: 'card',
          status: 'completed'
        };
        
        const paymentRef = await addDoc(collection(db, 'payments'), samplePayment);
        setPaymentHistory([{
          id: paymentRef.id,
          ...samplePayment
        }]);
      }
    } catch (error) {
      console.error('Error fetching fee details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load fee details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = () => {
    setIsPaymentDialogOpen(true);
    setPaymentSuccess(false);
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod || !feeDetails) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update fee status
      if (feeDetails.id) {
        await updateDoc(doc(db, 'fees', feeDetails.id), {
          status: 'paid',
          paymentDate: new Date().toISOString()
        });
      }
      
      // Create payment record
      const transactionId = 'TXN' + Math.floor(Math.random() * 1000000);
      const paymentData = {
        studentId: userDetails?.id,
        amount: feeDetails.amount,
        paymentDate: new Date().toISOString(),
        transactionId: transactionId,
        paymentMethod: selectedPaymentMethod,
        status: 'completed'
      };
      
      await addDoc(collection(db, 'payments'), paymentData);
      
      // Update local state
      setFeeDetails({
        ...feeDetails,
        status: 'paid',
        paymentDate: new Date().toISOString(),
        transactionId: transactionId
      });
      
      setPaymentHistory([
        {
          id: 'new-payment',
          ...paymentData
        },
        ...paymentHistory
      ]);
      
      // Send notification
      await addDoc(collection(db, 'notifications'), {
        title: 'Fee Payment Successful',
        message: `Your hostel fee payment of ₹${feeDetails.amount} is successful. Transaction ID: ${transactionId}`,
        userId: userDetails?.id,
        createdAt: serverTimestamp(),
        read: false
      });
      
      setPaymentSuccess(true);
      
      toast({
        title: 'Payment Successful',
        description: `Your payment of ₹${feeDetails.amount} has been processed successfully`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Payment Failed',
        description: 'There was an error processing your payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const closeDialog = () => {
    setIsPaymentDialogOpen(false);
    setSelectedPaymentMethod(null);
    if (paymentSuccess) {
      fetchFeeDetails(); // Refresh data after successful payment
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

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fee Payment</h1>
            <p className="text-gray-500">Manage your hostel fee payments</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          </div>
        ) : feeDetails ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Fee Status */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Current Fee Status</CardTitle>
                <CardDescription>
                  Your hostel fee details and payment status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Status</p>
                      <div className="flex items-center">
                        {getFeeStatusBadge(feeDetails.status)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="text-2xl font-bold">₹{feeDetails.amount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Due Date</p>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                        <p>{new Date(feeDetails.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  {feeDetails.status === 'paid' ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-700">Payment Completed</h4>
                        <p className="text-sm text-green-600">
                          Payment was received on {new Date(feeDetails.paymentDate || '').toLocaleDateString()}. 
                          Transaction ID: {feeDetails.transactionId}
                        </p>
                      </div>
                    </div>
                  ) : feeDetails.status === 'overdue' ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-700">Payment Overdue</h4>
                        <p className="text-sm text-red-600">
                          Your payment was due on {new Date(feeDetails.dueDate).toLocaleDateString()}. 
                          Please pay immediately to avoid penalties.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-700">Payment Pending</h4>
                        <p className="text-sm text-yellow-600">
                          Please complete your payment before {new Date(feeDetails.dueDate).toLocaleDateString()} 
                          to avoid late fees.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                {feeDetails.status !== 'paid' && (
                  <Button className="w-full" onClick={handleInitiatePayment}>
                    <CreditCard className="mr-2 h-4 w-4" /> Pay Now
                  </Button>
                )}
                {feeDetails.status === 'paid' && (
                  <Button variant="outline" className="w-full">
                    <Receipt className="mr-2 h-4 w-4" /> Download Receipt
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Fee Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Fee Policy</CardTitle>
                <CardDescription>
                  Important information about fees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-medium">Payment Schedule</h3>
                    <p className="text-gray-500">Fees are due on the 5th of each month</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Late Payment</h3>
                    <p className="text-gray-500">A 5% penalty is applied for payments made after the due date</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Refund Policy</h3>
                    <p className="text-gray-500">No refunds are provided for the current month</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full">
                  <FileText className="mr-2 h-4 w-4" /> View Full Policy
                </Button>
              </CardFooter>
            </Card>

            {/* Payment History */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  Record of your previous fee payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="pb-2 font-medium">Transaction ID</th>
                          <th className="pb-2 font-medium">Date</th>
                          <th className="pb-2 font-medium">Amount</th>
                          <th className="pb-2 font-medium">Payment Method</th>
                          <th className="pb-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((payment) => (
                          <tr key={payment.id} className="border-b">
                            <td className="py-3">{payment.transactionId}</td>
                            <td className="py-3">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                            <td className="py-3">₹{payment.amount}</td>
                            <td className="py-3 capitalize">{payment.paymentMethod}</td>
                            <td className="py-3">
                              <Badge className="bg-green-500 hover:bg-green-600">
                                {payment.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No payment history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No Fee Information</h3>
            <p className="mt-2 text-gray-500">
              There are currently no fee details available for your account
            </p>
          </div>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          {!paymentSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle>Make Payment</DialogTitle>
                <DialogDescription>
                  Complete your hostel fee payment of ₹{feeDetails?.amount}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <p className="font-medium text-sm">Select Payment Method</p>
                <div className="grid grid-cols-1 gap-3">
                  {paymentMethods.map((method) => (
                    <div 
                      key={method.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPaymentMethod === method.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => handlePaymentMethodSelect(method.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          selectedPaymentMethod === method.id ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <method.icon className={`h-5 w-5 ${
                            selectedPaymentMethod === method.id ? 'text-blue-500' : 'text-gray-500'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-medium">{method.name}</h4>
                          <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleProcessPayment} 
                  disabled={!selectedPaymentMethod || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>Pay ₹{feeDetails?.amount}</>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">Payment Successful</DialogTitle>
              </DialogHeader>
              <div className="py-6 flex flex-col items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-xl font-semibold">Thank You!</p>
                <p className="text-gray-500 text-center mt-2">
                  Your payment of ₹{feeDetails?.amount} has been processed successfully.
                </p>
                <div className="bg-gray-50 w-full p-4 rounded-lg mt-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-medium">{feeDetails?.transactionId || 'TXN' + Math.floor(Math.random() * 1000000)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={closeDialog} className="w-full">Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <ChatBot />
    </DashboardLayout>
  );
};

export default FeePayment;
