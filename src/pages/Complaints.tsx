
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, getDoc } from 'firebase/firestore';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Complaint } from '@/types';
import { ClipboardCheck, Search, Clock, AlertTriangle, CheckCircle, Home } from 'lucide-react';

const Complaints: React.FC = () => {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [assignForm, setAssignForm] = useState({ assignedTo: '' });
  const [resolveForm, setResolveForm] = useState({ resolution: '' });

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    const filtered = complaints.filter(complaint => {
      const matchesSearch = 
        complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (complaint.studentName && complaint.studentName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredComplaints(filtered);
  }, [searchTerm, statusFilter, complaints]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'complaints'));
      
      const complaintsData: Complaint[] = [];
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data() as Complaint;
        
        // If student name is missing, fetch it
        if (!data.studentName && data.studentId) {
          try {
            const studentDoc = await getDoc(doc(db, 'users', data.studentId));
            if (studentDoc.exists()) {
              data.studentName = studentDoc.data().name;
            }
          } catch (error) {
            console.error("Error fetching student name:", error);
          }
        }
        
        complaintsData.push({
          id: doc.id,
          ...data
        } as Complaint);
      }
      
      // Create sample data if none exists
      if (complaintsData.length === 0) {
        const sampleComplaints: Complaint[] = [
          {
            id: "sample1",
            studentId: "student1",
            studentName: "John Doe",
            roomNumber: "101",
            title: "Water heater not working",
            description: "The water heater in my bathroom is not heating water properly.",
            category: "maintenance",
            priority: "high",
            status: "pending",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "sample2",
            studentId: "student2",
            studentName: "Jane Smith",
            roomNumber: "205",
            title: "Leaking ceiling",
            description: "The ceiling in my room is leaking when it rains. Please fix it urgently.",
            category: "maintenance",
            priority: "high",
            status: "in-progress",
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            assignedTo: "Maintenance Team",
          },
          {
            id: "sample3",
            studentId: "student3",
            studentName: "Mike Johnson",
            roomNumber: "310",
            title: "Broken chair",
            description: "One of the chairs in my room is broken and needs replacement.",
            category: "furniture",
            priority: "medium",
            status: "resolved",
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            resolvedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            resolution: "Replaced the broken chair with a new one.",
          }
        ];
        
        setComplaints(sampleComplaints);
        setFilteredComplaints(sampleComplaints);
        setLoading(false);
        return;
      }
      
      // Sort by createdAt date (newest first)
      complaintsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setComplaints(complaintsData);
      setFilteredComplaints(complaintsData);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast({
        title: "Error",
        description: "Failed to load complaints",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedComplaint || !assignForm.assignedTo) return;
    
    try {
      await updateDoc(doc(db, 'complaints', selectedComplaint.id), {
        status: 'in-progress' as 'pending' | 'in-progress' | 'resolved',
        assignedTo: assignForm.assignedTo
      });
      
      // Update state
      const updatedComplaints = complaints.map(complaint => 
        complaint.id === selectedComplaint.id
          ? { 
              ...complaint, 
              status: 'in-progress' as 'pending' | 'in-progress' | 'resolved', 
              assignedTo: assignForm.assignedTo 
            }
          : complaint
      ) as Complaint[];
      
      setComplaints(updatedComplaints);
      
      toast({
        title: "Success",
        description: "Complaint assigned successfully",
      });
      
      setShowAssignDialog(false);
      setAssignForm({ assignedTo: '' });
    } catch (error) {
      console.error("Error assigning complaint:", error);
      toast({
        title: "Error",
        description: "Failed to assign complaint",
        variant: "destructive",
      });
    }
  };

  const handleResolve = async () => {
    if (!selectedComplaint || !resolveForm.resolution) return;
    
    try {
      await updateDoc(doc(db, 'complaints', selectedComplaint.id), {
        status: 'resolved' as 'pending' | 'in-progress' | 'resolved',
        resolution: resolveForm.resolution,
        resolvedAt: new Date().toISOString()
      });
      
      // Update state
      const updatedComplaints = complaints.map(complaint => 
        complaint.id === selectedComplaint.id
          ? { 
              ...complaint, 
              status: 'resolved' as 'pending' | 'in-progress' | 'resolved',
              resolution: resolveForm.resolution,
              resolvedAt: new Date().toISOString()
            }
          : complaint
      ) as Complaint[];
      
      setComplaints(updatedComplaints);
      
      toast({
        title: "Success",
        description: "Complaint marked as resolved",
      });
      
      setShowResolveDialog(false);
      setResolveForm({ resolution: '' });
    } catch (error) {
      console.error("Error resolving complaint:", error);
      toast({
        title: "Error",
        description: "Failed to resolve complaint",
        variant: "destructive",
      });
    }
  };

  const openAssignDialog = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setAssignForm({ assignedTo: complaint.assignedTo || '' });
    setShowAssignDialog(true);
  };

  const openResolveDialog = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setResolveForm({ resolution: complaint.resolution || '' });
    setShowResolveDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500 hover:bg-green-600">Resolved</Badge>;
      default:
        return <Badge>Unknown</Badge>;
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

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Complaints Management</h1>
            <p className="text-gray-500">
              Handle and respond to student complaints
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Complaints</CardTitle>
                <CardDescription>
                  Manage and track student complaints
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search complaints..."
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
            ) : filteredComplaints.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">#{complaint.id.substring(0, 6)}</TableCell>
                      <TableCell>{complaint.roomNumber}</TableCell>
                      <TableCell>{complaint.studentName || 'Unknown'}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{complaint.title}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {complaint.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(complaint.priority)}</TableCell>
                      <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3 text-gray-500" />
                          <span className="text-sm">
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {complaint.status !== 'resolved' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openAssignDialog(complaint)}
                              >
                                Assign
                              </Button>
                              <Button 
                                size="sm" 
                                variant="success"
                                onClick={() => openResolveDialog(complaint)}
                              >
                                Resolve
                              </Button>
                            </>
                          )}
                          {complaint.status === 'resolved' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-green-600 border-green-600"
                              disabled
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Resolved
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
                <AlertTriangle className="h-10 w-10 text-gray-400" />
                <p className="text-gray-500">No complaints found</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-blue-500" />
                Complaints Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Complaints:</span>
                  <span className="font-medium">{complaints.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pending:</span>
                  <span className="font-medium">
                    {complaints.filter(c => c.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">In Progress:</span>
                  <span className="font-medium">
                    {complaints.filter(c => c.status === 'in-progress').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Resolved:</span>
                  <span className="font-medium">
                    {complaints.filter(c => c.status === 'resolved').length}
                  </span>
                </div>
                <div className="pt-2 border-t mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">High Priority:</span>
                    <span className="font-medium text-red-500">
                      {complaints.filter(c => c.priority === 'high' && c.status !== 'resolved').length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Complaint</DialogTitle>
            <DialogDescription>
              Assign this complaint to a staff member or team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Complaint</label>
              <p className="font-medium">{selectedComplaint?.title}</p>
              <p className="text-sm text-gray-500">
                Room {selectedComplaint?.roomNumber} • {selectedComplaint?.studentName}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign To</label>
              <Input
                placeholder="Enter staff name or team"
                value={assignForm.assignedTo}
                onChange={(e) => setAssignForm({ ...assignForm, assignedTo: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign}>
              Assign and Mark In Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Complaint</DialogTitle>
            <DialogDescription>
              Mark this complaint as resolved and provide resolution details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Complaint</label>
              <p className="font-medium">{selectedComplaint?.title}</p>
              <p className="text-sm text-gray-500">
                Room {selectedComplaint?.roomNumber} • {selectedComplaint?.studentName}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resolution Details</label>
              <Textarea
                placeholder="Describe how the issue was resolved"
                rows={4}
                value={resolveForm.resolution}
                onChange={(e) => setResolveForm({ ...resolveForm, resolution: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve}>
              Mark as Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Complaints;
