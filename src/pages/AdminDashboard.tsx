
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, getCountFromServer, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Home, CreditCard, Clipboard, Bell, AlertCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AdminDashboard: React.FC = () => {
  const { userDetails } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    pendingComplaints: 0,
    pendingFees: 0
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Get total students count
        const studentsCollection = collection(db, 'students');
        const studentsSnapshot = await getDocs(studentsCollection);
        const totalStudents = studentsSnapshot.size;
        
        // Create sample student data if none exists
        if (totalStudents === 0) {
          try {
            await addDoc(collection(db, 'students'), {
              name: 'John Doe',
              email: 'john@example.com',
              roomNumber: '101',
              joiningDate: serverTimestamp(),
              status: 'active'
            });
            
            await addDoc(collection(db, 'students'), {
              name: 'Jane Smith',
              email: 'jane@example.com',
              roomNumber: '102',
              joiningDate: serverTimestamp(),
              status: 'active'
            });
            
            // Refresh the count after adding sample data
            const updatedSnapshot = await getDocs(studentsCollection);
            const updatedTotalStudents = updatedSnapshot.size;
            
            // Create sample rooms
            await addDoc(collection(db, 'rooms'), {
              roomNumber: '101',
              capacity: 2,
              status: 'occupied',
              occupants: ['john@example.com']
            });
            
            await addDoc(collection(db, 'rooms'), {
              roomNumber: '102',
              capacity: 2,
              status: 'occupied',
              occupants: ['jane@example.com']
            });
            
            await addDoc(collection(db, 'rooms'), {
              roomNumber: '103',
              capacity: 2,
              status: 'available',
              occupants: []
            });
            
            // Create sample complaints
            await addDoc(collection(db, 'complaints'), {
              studentName: 'John Doe',
              studentEmail: 'john@example.com',
              roomNumber: '101',
              complaintText: 'The water heater is not working properly',
              status: 'pending',
              createdAt: serverTimestamp()
            });
            
            // Create sample fees records
            await addDoc(collection(db, 'fees'), {
              studentName: 'John Doe',
              studentEmail: 'john@example.com',
              amount: 5000,
              dueDate: new Date(2025, 3, 15),
              status: 'pending',
              createdAt: serverTimestamp()
            });
            
            await addDoc(collection(db, 'fees'), {
              studentName: 'Jane Smith',
              studentEmail: 'jane@example.com',
              amount: 5000,
              dueDate: new Date(2025, 3, 15),
              status: 'pending',
              createdAt: serverTimestamp()
            });
            
            setStats(prevStats => ({
              ...prevStats,
              totalStudents: updatedTotalStudents
            }));
          } catch (error) {
            console.error("Error creating sample data:", error);
          }
        }
        
        // Get rooms stats
        const roomsCollection = collection(db, 'rooms');
        const roomsSnapshot = await getDocs(roomsCollection);
        const totalRooms = roomsSnapshot.size;
        let occupiedRooms = 0;
        roomsSnapshot.forEach(doc => {
          if (doc.data().status === 'occupied') {
            occupiedRooms++;
          }
        });
        
        // Get pending complaints count
        const pendingComplaintsQuery = query(
          collection(db, 'complaints'),
          where('status', '!=', 'resolved')
        );
        const pendingComplaintsSnapshot = await getDocs(pendingComplaintsQuery);
        
        // Get pending fees count
        const pendingFeesQuery = query(
          collection(db, 'fees'),
          where('status', 'in', ['pending', 'overdue'])
        );
        const pendingFeesSnapshot = await getDocs(pendingFeesQuery);

        // Set all the stats
        setStats({
          totalStudents,
          totalRooms,
          occupiedRooms,
          pendingComplaints: pendingComplaintsSnapshot.size,
          pendingFees: pendingFeesSnapshot.size
        });
        
        // Fetch notifications
        const notificationsSnapshot = await getDocs(collection(db, 'notifications'));
        if (notificationsSnapshot.empty) {
          // Add sample notifications if none exist
          await addDoc(collection(db, 'notifications'), {
            title: 'New Student Registration',
            message: 'A new student has registered',
            type: 'info',
            createdAt: serverTimestamp(),
            read: false
          });
          
          await addDoc(collection(db, 'notifications'), {
            title: 'Maintenance Request',
            message: 'Room 204 needs plumbing maintenance',
            type: 'warning',
            createdAt: serverTimestamp(),
            read: false
          });
          
          const updatedNotificationsSnapshot = await getDocs(collection(db, 'notifications'));
          const notificationsData = updatedNotificationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setNotifications(notificationsData);
        } else {
          const notificationsData = notificationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setNotifications(notificationsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast({
          title: "Error",
          description: "Failed to fetch dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [toast]);

  const handleAssignStaff = () => {
    toast({
      title: "Staff Assigned",
      description: "Maintenance staff has been assigned to Room 204",
    });
  };

  const handleDismiss = (alertType: string) => {
    toast({
      title: "Alert Dismissed",
      description: `${alertType} alert has been dismissed`,
    });
  };

  const handleSendReminders = () => {
    toast({
      title: "Reminders Sent",
      description: "Fee payment reminders have been sent to all students",
    });
  };

  const unreadNotificationsCount = notifications.filter(notif => !notif.read).length;

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {userDetails?.name}</h1>
            <p className="text-gray-500">Admin Dashboard Overview</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadNotificationsCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {unreadNotificationsCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex justify-between items-center px-4 py-2 border-b">
                  <h4 className="font-semibold">Notifications</h4>
                  <Button variant="ghost" size="sm">
                    Mark all as read
                  </Button>
                </div>
                {notifications.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notif: any) => (
                      <DropdownMenuItem key={notif.id} className="flex flex-col items-start py-3">
                        <div className="flex w-full justify-between">
                          <span className="font-medium">{notif.title}</span>
                          {!notif.read && <Badge className="ml-2">New</Badge>}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{notif.message}</p>
                      </DropdownMenuItem>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-2 text-sm text-gray-500">No notifications</p>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Students */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-500" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : (
                <div>
                  <p className="text-3xl font-bold">{stats.totalStudents}</p>
                  <p className="text-sm text-gray-500">Registered students</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link to="/manage-students">Manage</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Room Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Home className="w-5 h-5 mr-2 text-blue-500" />
                Room Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : (
                <div>
                  <p className="text-3xl font-bold">{stats.occupiedRooms}/{stats.totalRooms}</p>
                  <p className="text-sm text-gray-500">Rooms occupied</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 mb-3">
                    <div 
                      className="bg-blue-500 h-2.5 rounded-full" 
                      style={{ width: `${stats.totalRooms > 0 ? (stats.occupiedRooms / stats.totalRooms) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/manage-rooms">Manage</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Complaints */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Clipboard className="w-5 h-5 mr-2 text-blue-500" />
                Pending Complaints
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : (
                <div>
                  <p className="text-3xl font-bold">{stats.pendingComplaints}</p>
                  <p className="text-sm text-gray-500">Requiring attention</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3" 
                    asChild
                  >
                    <Link to="/complaints">View All</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fee Collection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
                Fee Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : (
                <div>
                  <p className="text-3xl font-bold">{stats.pendingFees}</p>
                  <p className="text-sm text-gray-500">Pending payments</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link to="/fee-management">Manage</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center" asChild>
                <Link to="/manage-rooms">
                  <Home className="h-5 w-5 mb-2" />
                  <span>Manage Rooms</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center" asChild>
                <Link to="/manage-students">
                  <Users className="h-5 w-5 mb-2" />
                  <span>Manage Students</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center" asChild>
                <Link to="/complaints">
                  <Clipboard className="h-5 w-5 mb-2" />
                  <span>Handle Complaints</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center" asChild>
                <Link to="/announcements">
                  <Bell className="h-5 w-5 mb-2" />
                  <span>Post Announcements</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-amber-500" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Room Maintenance Required</h4>
                  <p className="text-sm text-gray-600">Room 204 needs plumbing maintenance</p>
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" variant="outline" onClick={handleAssignStaff}>
                      Assign Staff
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDismiss("Maintenance")}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Bell className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Fee Collection Period</h4>
                  <p className="text-sm text-gray-600">Monthly fee collection period starts tomorrow</p>
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" variant="outline" onClick={handleSendReminders}>
                      Send Reminders
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDismiss("Fee collection")}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
