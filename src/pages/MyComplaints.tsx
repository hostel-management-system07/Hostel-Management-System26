
import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Complaint } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ClipboardPenLine, Clock, AlertCircle } from 'lucide-react';
import ChatBot from '@/components/ChatBot';

const MyComplaints: React.FC = () => {
  const { userDetails } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    description: '',
    category: 'maintenance',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [userDetails?.id]);

  const fetchComplaints = async () => {
    if (!userDetails?.id) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'complaints'),
        where('studentId', '==', userDetails.id)
      );
      const querySnapshot = await getDocs(q);
      
      const complaintsData: Complaint[] = [];
      querySnapshot.forEach((doc) => {
        complaintsData.push({ 
          id: doc.id, 
          ...doc.data() 
        } as Complaint);
      });
      
      // If no complaints found, create sample data
      if (complaintsData.length === 0 && userDetails.id) {
        const sampleComplaint = {
          studentId: userDetails.id,
          roomNumber: '101',
          title: 'Water heater not working',
          description: 'The water heater in my bathroom has stopped working. Please fix ASAP.',
          category: 'maintenance',
          priority: 'high',
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        
        const docRef = await addDoc(collection(db, 'complaints'), sampleComplaint);
        complaintsData.push({
          id: docRef.id,
          ...sampleComplaint
        } as Complaint);
      }
      
      setComplaints(complaintsData);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast({
        title: 'Error',
        description: 'Failed to load complaints data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userDetails?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to submit a complaint',
        variant: 'destructive',
      });
      return;
    }
    
    if (!newComplaint.title || !newComplaint.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const complaintData = {
        studentId: userDetails.id,
        studentName: userDetails.name || '',
        roomNumber: '101', // This would come from user's room assignment
        title: newComplaint.title,
        description: newComplaint.description,
        category: newComplaint.category,
        priority: newComplaint.priority,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'complaints'), complaintData);
      
      // Add to student's complaints list
      setComplaints([...complaints, { id: docRef.id, ...complaintData } as Complaint]);
      
      // Create a notification for admins
      await addDoc(collection(db, 'notifications'), {
        title: 'New Complaint Submitted',
        message: `${userDetails.name} has submitted a new ${newComplaint.priority} priority complaint: ${newComplaint.title}`,
        type: 'complaint',
        createdAt: serverTimestamp(),
        read: false
      });
      
      toast({
        title: 'Success',
        description: 'Your complaint has been submitted successfully',
      });
      
      // Reset form
      setNewComplaint({
        title: '',
        description: '',
        category: 'maintenance',
        priority: 'medium' as 'low' | 'medium' | 'high',
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit complaint',
        variant: 'destructive',
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500 hover:bg-red-600">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-500 hover:bg-green-600">Low</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-500 hover:bg-green-600">Resolved</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Complaints</h1>
            <p className="text-gray-500">Submit and track your maintenance requests</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <ClipboardPenLine className="mr-2 h-4 w-4" /> Submit New Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>New Complaint</DialogTitle>
                <DialogDescription>
                  Fill in the details of your complaint below. We'll attend to it as soon as possible.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitComplaint}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="title" className="text-sm font-medium">Issue Title</label>
                    <Input 
                      id="title" 
                      placeholder="Brief description of the issue" 
                      value={newComplaint.title}
                      onChange={(e) => setNewComplaint({...newComplaint, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="category" className="text-sm font-medium">Category</label>
                    <Select 
                      value={newComplaint.category}
                      onValueChange={(value) => setNewComplaint({...newComplaint, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="cleanliness">Cleanliness</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="priority" className="text-sm font-medium">Priority</label>
                    <Select 
                      value={newComplaint.priority}
                      onValueChange={(value: any) => setNewComplaint({...newComplaint, priority: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="description" className="text-sm font-medium">Detailed Description</label>
                    <Textarea 
                      id="description" 
                      placeholder="Provide a detailed description of the issue" 
                      value={newComplaint.description}
                      onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                      rows={4}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit Complaint</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Submitted Complaints</CardTitle>
            <CardDescription>
              Track the status of your maintenance requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
              </div>
            ) : complaints.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">
                        {complaint.title}
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{complaint.description}</p>
                      </TableCell>
                      <TableCell className="capitalize">{complaint.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3 text-gray-500" />
                          <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(complaint.priority)}</TableCell>
                      <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 space-y-3">
                <AlertCircle className="h-10 w-10 text-gray-400" />
                <p className="text-gray-500">No complaints submitted yet</p>
                <Button onClick={() => setIsDialogOpen(true)}>Submit a Complaint</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ChatBot />
    </DashboardLayout>
  );
};

export default MyComplaints;
