
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
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
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  MessageCircle,
  Users,
  User,
  Wrench
} from 'lucide-react';
import { Complaint } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const Complaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [complaintDetail, setComplaintDetail] = useState<Complaint | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [assignStaffDialog, setAssignStaffDialog] = useState(false);
  const [resolution, setResolution] = useState('');
  const [maintenanceStaff, setMaintenanceStaff] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [searchTerm, statusFilter, complaints]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'complaints'),
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
      
      // If no complaints found, create sample data
      if (complaintsData.length === 0) {
        const sampleComplaints = [
          {
            studentId: 'student1',
            studentName: 'John Doe',
            roomNumber: '101',
            title: 'Leaking tap in bathroom',
            description: 'The bathroom tap has been leaking for two days now. Water is getting wasted.',
            category: 'plumbing',
            status: 'pending',
            priority: 'medium',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            studentId: 'student2',
            studentName: 'Jane Smith',
            roomNumber: '203',
            title: 'Broken window lock',
            description: 'The lock on the window is broken and cannot be secured properly. This is a security concern.',
            category: 'maintenance',
            status: 'in-progress',
            priority: 'high',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            assignedTo: 'Maintenance Staff 1',
          },
          {
            studentId: 'student3',
            studentName: 'Mike Johnson',
            roomNumber: '305',
            title: 'Wi-Fi connectivity issues',
            description: 'The Wi-Fi signal is very weak in my room. I cannot connect properly for online classes.',
            category: 'internet',
            status: 'resolved',
            priority: 'medium',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            resolvedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            resolution: 'Installed a Wi-Fi repeater in the hallway near room 305 to improve signal strength.',
          }
        ];
        
        for (const complaint of sampleComplaints) {
          await addDoc(collection(db, 'complaints'), {
            ...complaint,
            createdAt: serverTimestamp()
          });
        }
        
        // Re-fetch to get the sample data with IDs
        return fetchComplaints();
      }
      
      setComplaints(complaintsData);
      setFilteredComplaints(complaintsData);
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

  const filterComplaints = () => {
    let filtered = [...complaints];
    
    if (searchTerm) {
      filtered = filtered.filter(
        complaint =>
          complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          complaint.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          complaint.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(complaint => complaint.status === statusFilter);
    }
    
    setFilteredComplaints(filtered);
  };

  const viewComplaintDetails = (complaint: Complaint) => {
    setComplaintDetail(complaint);
    setShowDetailDialog(true);
  };

  const openAssignDialog = (complaint: Complaint) => {
    setComplaintDetail(complaint);
    setMaintenanceStaff('');
    setAssignStaffDialog(true);
  };

  const handleAssignStaff = async () => {
    if (!complaintDetail || !maintenanceStaff) return;
    
    try {
      await updateDoc(doc(db, 'complaints', complaintDetail.id), {
        status: 'in-progress',
        assignedTo: maintenanceStaff,
        updatedAt: new Date().toISOString()
      });
      
      // Update the complaints list
      const updatedComplaints = complaints.map(complaint =>
        complaint.id === complaintDetail.id
          ? { ...complaint, status: 'in-progress', assignedTo: maintenanceStaff }
          : complaint
      );
      
      setComplaints(updatedComplaints);
      
      // Add a notification for the student
      await addDoc(collection(db, 'notifications'), {
        title: 'Complaint Update',
        message: `Your complaint regarding "${complaintDetail.title}" is now being handled by ${maintenanceStaff}.`,
        type: 'complaint',
        userId: complaintDetail.studentId,
        createdAt: serverTimestamp(),
        read: false
      });
      
      toast({
        title: 'Staff Assigned',
        description: `${maintenanceStaff} has been assigned to handle this complaint`,
      });
      
      setAssignStaffDialog(false);
    } catch (error) {
      console.error('Error assigning staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign maintenance staff',
        variant: 'destructive',
      });
    }
  };

  const handleResolveComplaint = async () => {
    if (!complaintDetail || !resolution) return;
    
    try {
      await updateDoc(doc(db, 'complaints', complaintDetail.id), {
        status: 'resolved',
        resolution: resolution,
        resolvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Update the complaints list
      const updatedComplaints = complaints.map(complaint =>
        complaint.id === complaintDetail.id
          ? { 
              ...complaint, 
              status: 'resolved', 
              resolution: resolution,
              resolvedAt: new Date().toISOString()
            }
          : complaint
      );
      
      setComplaints(updatedComplaints);
      
      // Add a notification for the student
      await addDoc(collection(db, 'notifications'), {
        title: 'Complaint Resolved',
        message: `Your complaint regarding "${complaintDetail.title}" has been resolved.`,
        type: 'complaint',
        userId: complaintDetail.studentId,
        createdAt: serverTimestamp(),
        read: false
      });
      
      toast({
        title: 'Complaint Resolved',
        description: 'The complaint has been marked as resolved',
      });
      
      setShowDetailDialog(false);
    } catch (error) {
      console.error('Error resolving complaint:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve complaint',
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

  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    // First, sort by status (pending first, then in-progress, then resolved)
    const statusOrder = { 'pending': 0, 'in-progress': 1, 'resolved': 2 };
    const statusDiff = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
    
    if (statusDiff !== 0) return statusDiff;
    
    // Then sort by priority (high first, then medium, then low)
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    // Finally sort by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Statistics
  const totalComplaints = complaints.length;
  const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
  const inProgressComplaints = complaints.filter(c => c.status === 'in-progress').length;
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Complaints Management</h1>
            <p className="text-gray-500">Handle student maintenance requests and complaints</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalComplaints}</div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pendingComplaints}</div>
              <p className="text-xs text-gray-500 mt-1">Require attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{inProgressComplaints}</div>
              <p className="text-xs text-gray-500 mt-1">Being addressed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{resolvedComplaints}</div>
              <p className="text-xs text-gray-500 mt-1">Successfully completed</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Complaints Directory</CardTitle>
            <CardDescription>
              Manage and track student complaints and maintenance requests
            </CardDescription>
            <div className="flex items-center justify-between mt-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search complaints..."
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
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
            ) : sortedComplaints.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedComplaints.map(complaint => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">
                        <div className="max-w-xs truncate">{complaint.title}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{complaint.studentName || 'N/A'}</TableCell>
                      <TableCell>{complaint.roomNumber || 'N/A'}</TableCell>
                      <TableCell className="capitalize">{complaint.category}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3 text-gray-500" />
                          <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(complaint.priority)}</TableCell>
                      <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewComplaintDetails(complaint)}
                          >
                            View
                          </Button>
                          {complaint.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openAssignDialog(complaint)}
                            >
                              Assign
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-40">
                <MessageCircle className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500">No complaints found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complaint Details Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Complaint Details</DialogTitle>
          </DialogHeader>
          {complaintDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Submitted By</p>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <p>{complaintDetail.studentName || 'Unknown'}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Room Number</p>
                  <div className="flex items-center">
                    <Home className="h-4 w-4 mr-2 text-gray-500" />
                    <p>{complaintDetail.roomNumber || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div>{getStatusBadge(complaintDetail.status)}</div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p className="capitalize">{complaintDetail.category}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Priority</p>
                  <div>{getPriorityBadge(complaintDetail.priority)}</div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Date Submitted</p>
                  <p>{new Date(complaintDetail.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-medium text-gray-500">Issue Title</p>
                <p className="text-base font-semibold">{complaintDetail.title}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Description</p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="whitespace-pre-line">{complaintDetail.description}</p>
                </div>
              </div>
              
              {complaintDetail.assignedTo && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Assigned To</p>
                  <div className="flex items-center">
                    <Wrench className="h-4 w-4 mr-2 text-blue-500" />
                    <p>{complaintDetail.assignedTo}</p>
                  </div>
                </div>
              )}
              
              {complaintDetail.status === 'resolved' && complaintDetail.resolution && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Resolution</p>
                  <div className="bg-green-50 p-4 rounded-md">
                    <p className="whitespace-pre-line">{complaintDetail.resolution}</p>
                    {complaintDetail.resolvedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Resolved on {new Date(complaintDetail.resolvedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {complaintDetail.status !== 'resolved' && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-medium text-gray-500">Resolution Notes</p>
                  <Textarea
                    placeholder="Enter resolution details..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            {complaintDetail?.status !== 'resolved' && (
              <div className="flex space-x-2">
                {complaintDetail?.status === 'pending' && (
                  <Button onClick={() => {
                    setShowDetailDialog(false);
                    openAssignDialog(complaintDetail);
                  }}>
                    Assign Staff
                  </Button>
                )}
                <Button 
                  variant="default" 
                  disabled={!resolution}
                  onClick={handleResolveComplaint}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Staff Dialog */}
      <Dialog open={assignStaffDialog} onOpenChange={setAssignStaffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Maintenance Staff</DialogTitle>
            <DialogDescription>
              Assign a maintenance staff member to handle this complaint
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {complaintDetail && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="issue">Issue</Label>
                  <p id="issue" className="font-medium">{complaintDetail.title}</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="staff">Maintenance Staff</Label>
                  <Select value={maintenanceStaff} onValueChange={setMaintenanceStaff}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maintenance Staff 1">Maintenance Staff 1</SelectItem>
                      <SelectItem value="Maintenance Staff 2">Maintenance Staff 2</SelectItem>
                      <SelectItem value="Plumbing Specialist">Plumbing Specialist</SelectItem>
                      <SelectItem value="Electrical Technician">Electrical Technician</SelectItem>
                      <SelectItem value="Carpentry Specialist">Carpentry Specialist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignStaffDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignStaff} disabled={!maintenanceStaff}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Complaints;
