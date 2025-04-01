
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, query, where, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserX, UserPlus, Shield, User } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface Admin {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'superadmin';
  status: 'active' | 'inactive';
  department?: string;
  createdAt: string;
  lastLogin?: string;
}

const adminFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  phone: z.string().optional(),
  role: z.enum(['admin', 'superadmin']),
  department: z.string().min(1, { message: "Please select a department" }),
  status: z.enum(['active', 'inactive']),
});

type AdminFormValues = z.infer<typeof adminFormSchema>;

const ManageAdmins: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'admin',
      department: '',
      status: 'active',
    },
  });

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', 'in', ['admin', 'superadmin']));
        const snapshot = await getDocs(q);
        
        const adminsData: Admin[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          adminsData.push({
            id: doc.id,
            name: data.name || 'No Name',
            email: data.email || 'No Email',
            phone: data.phone || 'Not provided',
            role: data.role || 'admin',
            status: data.status || 'active',
            department: data.department || 'General',
            createdAt: data.createdAt || new Date().toISOString(),
            lastLogin: data.lastLoginAt || undefined,
          });
        });
        
        setAdmins(adminsData);
        setFilteredAdmins(adminsData);
      } catch (error) {
        console.error("Error fetching admins:", error);
        toast({
          title: "Error",
          description: "Failed to load administrator data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Create sample data if needed
    const createSampleData = async () => {
      const q = query(collection(db, 'users'), where('role', 'in', ['admin', 'superadmin']));
      const snapshot = await getDocs(q);
      
      if (snapshot.size === 0) {
        // Create sample admin
        await addDoc(collection(db, 'users'), {
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          status: 'active',
          department: 'IT',
          createdAt: serverTimestamp(),
        });
        
        // Refetch after adding sample data
        fetchAdmins();
      }
    };

    fetchAdmins();
    createSampleData();
  }, [toast]);

  useEffect(() => {
    const results = admins.filter(admin =>
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.department && admin.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredAdmins(results);
  }, [searchTerm, admins]);

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    
    try {
      // Delete from users collection
      await deleteDoc(doc(db, 'users', adminToDelete.id));
      
      // Update the UI
      setAdmins(admins.filter(a => a.id !== adminToDelete.id));
      setFilteredAdmins(filteredAdmins.filter(a => a.id !== adminToDelete.id));
      
      toast({
        title: "Success",
        description: `Administrator ${adminToDelete.name} has been removed`,
      });
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast({
        title: "Error",
        description: "Failed to delete administrator",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setAdminToDelete(null);
    }
  };

  const openDeleteDialog = (admin: Admin) => {
    setAdminToDelete(admin);
    setShowDeleteDialog(true);
  };

  const handleAddAdmin = async (values: AdminFormValues) => {
    setIsSubmitting(true);
    try {
      // Check if email already exists
      const emailQuery = query(collection(db, 'users'), where('email', '==', values.email));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        toast({
          title: "Error",
          description: "An account with this email already exists",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Add new admin to users collection
      const docRef = await addDoc(collection(db, 'users'), {
        ...values,
        createdAt: serverTimestamp(),
      });
      
      // Update local state
      const newAdmin: Admin = {
        id: docRef.id,
        ...values,
        createdAt: new Date().toISOString(),
      };
      
      setAdmins([...admins, newAdmin]);
      setFilteredAdmins([...filteredAdmins, newAdmin]);
      
      toast({
        title: "Success",
        description: `Administrator ${values.name} has been added`,
      });
      
      // Reset form and close dialog
      form.reset();
      setShowAddDialog(false);
    } catch (error) {
      console.error("Error adding admin:", error);
      toast({
        title: "Error",
        description: "Failed to add administrator",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (admin: Admin, newStatus: 'active' | 'inactive') => {
    try {
      await updateDoc(doc(db, 'users', admin.id), {
        status: newStatus
      });
      
      // Update local state
      const updatedAdmins = admins.map(a => 
        a.id === admin.id ? { ...a, status: newStatus } : a
      );
      
      setAdmins(updatedAdmins);
      setFilteredAdmins(updatedAdmins.filter(admin =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (admin.department && admin.department.toLowerCase().includes(searchTerm.toLowerCase()))
      ));
      
      toast({
        title: "Success",
        description: `Status updated for ${admin.name}`,
      });
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast({
        title: "Error",
        description: "Failed to update administrator status",
        variant: "destructive",
      });
    }
  };

  const renderAdminTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredAdmins.length > 0 ? (
          filteredAdmins.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell className="font-medium">{admin.name}</TableCell>
              <TableCell>{admin.email}</TableCell>
              <TableCell>{admin.department}</TableCell>
              <TableCell>
                <Badge variant={admin.role === 'superadmin' ? 'default' : 'outline'}>
                  {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={admin.status === 'active' ? 'default' : 'secondary'}
                  className={
                    admin.status === 'active' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-gray-500 hover:bg-gray-600'
                  }
                >
                  {admin.status}
                </Badge>
              </TableCell>
              <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(admin, admin.status === 'active' ? 'inactive' : 'active')}
                  >
                    {admin.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => openDeleteDialog(admin)}
                  >
                    <UserX className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
              {isLoading ? 'Loading administrators...' : 'No administrators found'}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
  
  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manage Administrators</h1>
            <p className="text-gray-500">View and manage administrator accounts</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Add Administrator
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Administrator Directory</CardTitle>
                <CardDescription>
                  {filteredAdmins.length} administrator{filteredAdmins.length !== 1 ? 's' : ''} registered
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search administrators..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderAdminTable()}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Administrator Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Administrators:</span>
                  <span className="font-medium">{admins.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Super Admins:</span>
                  <span className="font-medium">
                    {admins.filter(a => a.role === 'superadmin').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Active Administrators:</span>
                  <span className="font-medium">
                    {admins.filter(a => a.status === 'active').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Departments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from(new Set(admins.map(admin => admin.department))).map((department) => (
                  <div key={department} className="flex justify-between">
                    <span className="text-gray-500">{department}:</span>
                    <span className="font-medium">
                      {admins.filter(a => a.department === department).length}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Admin Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Administrator Removal</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {adminToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAdmin}>
              Remove Administrator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) form.reset();
      }}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add New Administrator</DialogTitle>
            <DialogDescription>
              Create a new administrator account. They will receive account credentials via email.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddAdmin)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="HR">HR</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Administrator'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ManageAdmins;
