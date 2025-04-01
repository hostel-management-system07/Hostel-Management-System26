
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  Clipboard, 
  ClipboardCheck, 
  Clock, 
  AlertCircle, 
  MessageCircle,
  CheckCircle,
  PlusCircle
} from 'lucide-react';
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
import { createComplaintNotification } from '@/utils/notificationUtils';

interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: 'pending' | 'in-progress' | 'resolved';
  createdAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  resolution?: string;
}

const MyComplaints: React.FC = () => {
  const { userDetails } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewComplaintDialog, setShowNewComplaintDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'maintenance',
    priority: 'medium'
  });

  useEffect(() => {
    if (userDetails?.id) {
      fetchComplaints();
    }
  }, [userDetails?.id]);

  const fetchComplaints = async () => {
    if (!userDetails?.id) return;

    try {
      setLoading(true);
      
      const q = query(
        collection(db, 'complaints'),
        where('studentId', '==', userDetails.id),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const complaintsData: Complaint[] = [];
      
      querySnapshot.forEach((doc) => {
        complaintsData.push({
          id: doc.id,
          ...doc.data()
        } as Complaint);
      });
      
      setComplaints(complaintsData);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast({
        title: 'Error',
        description: 'Failed to load complaints',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmitComplaint = async () => {
    if (!formData.title || !formData.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    if (!userDetails?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to submit a complaint',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Get user's room information
      let roomNumber = 'Unknown';
      if (userDetails.roomId) {
        const roomQuery = query(collection(db, 'rooms'), where('id', '==', userDetails.roomId));
        const roomSnapshot = await getDocs(roomQuery);
        if (!roomSnapshot.empty) {
          roomNumber = roomSnapshot.docs[0].data().roomNumber || 'Unknown';
        }
      }
      
      const complaintData = {
        studentId: userDetails.id,
        studentName: userDetails.name || 'Unknown',
        roomNumber,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: 'pending' as 'pending' | 'in-progress' | 'resolved',
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'complaints'), complaintData);
      
      // Create notification for admin
      await createComplaintNotification({
        ...complaintData,
        id: docRef.id
      });
      
      const newComplaint = {
        id: docRef.id,
        ...complaintData
      };
      
      setComplaints([newComplaint, ...complaints]);
      
      toast({
        title: 'Success',
        description: 'Your complaint has been submitted successfully',
      });
      
      setShowNewComplaintDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit complaint',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'maintenance',
      priority: 'medium'
    });
  };

  const viewComplaintDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500">Resolved</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="outline" className="border-red-500 text-red-500">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="border-green-500 text-green-500">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maintenance':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'furniture':
        return <Clipboard className="w-4 h-4 text-purple-500" />;
      case 'plumbing':
        return <AlertCircle className="w-4 h-4 text-cyan-500" />;
      case 'electrical':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Complaints</h1>
            <p className="text-gray-500">Submit and track your complaints</p>
          </div>
          <Button onClick={() => setShowNewComplaintDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Complaint
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Complaints</CardTitle>
            <CardDescription>
              View the status of your submitted complaints
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
              </div>
            ) : complaints.length > 0 ? (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <div 
                    key={complaint.id}
                    className="border rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => viewComplaintDetails(complaint)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(complaint.category)}
                        <h3 className="font-medium text-lg">{complaint.title}</h3>
                      </div>
                      <div className="flex space-x-2">
                        {getPriorityBadge(complaint.priority)}
                        {getStatusBadge(complaint.status)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{complaint.description}</p>
                    <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </div>
                      <span>
                        {complaint.status === 'in-progress' && `Assigned to: ${complaint.assignedTo}`}
                        {complaint.status === 'resolved' && `Resolved: ${new Date(complaint.resolvedAt || '').toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 space-y-4">
                <ClipboardCheck className="h-12 w-12 text-gray-400" />
                <div className="text-center">
                  <p className="text-gray-500">You haven't submitted any complaints yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowNewComplaintDialog(true)}
                  >
                    Submit a new complaint
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Complaint Dialog */}
      <Dialog open={showNewComplaintDialog} onOpenChange={setShowNewComplaintDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Submit a New Complaint</DialogTitle>
            <DialogDescription>
              Let us know about any issues you're experiencing
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Brief description of the issue"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => handleSelectChange('priority', value)}
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Please provide details about the issue"
                rows={5}
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewComplaintDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitComplaint}>
              Submit Complaint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complaint Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Complaint Details</DialogTitle>
            <DialogDescription>
              View details and status of your complaint
            </DialogDescription>
          </DialogHeader>
          
          {selectedComplaint && (
            <div className="space-y-4 py-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{selectedComplaint.title}</h3>
                <div className="flex space-x-2">
                  {getPriorityBadge(selectedComplaint.priority)}
                  {getStatusBadge(selectedComplaint.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Category:</p>
                  <p className="font-medium capitalize">{selectedComplaint.category}</p>
                </div>
                <div>
                  <p className="text-gray-500">Room Number:</p>
                  <p className="font-medium">{selectedComplaint.roomNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date Submitted:</p>
                  <p className="font-medium">{new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedComplaint.status === 'in-progress' && (
                  <div>
                    <p className="text-gray-500">Assigned To:</p>
                    <p className="font-medium">{selectedComplaint.assignedTo}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-gray-500">Description:</p>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p>{selectedComplaint.description}</p>
                </div>
              </div>
              
              {selectedComplaint.status === 'resolved' && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className="text-gray-500 font-medium">Resolution (Completed on {new Date(selectedComplaint.resolvedAt || '').toLocaleDateString()})</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-md text-green-800">
                    <p>{selectedComplaint.resolution}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MyComplaints;
