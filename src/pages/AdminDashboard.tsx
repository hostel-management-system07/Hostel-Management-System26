
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Home, CreditCard, Clipboard, Bell, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AdminDashboard: React.FC = () => {
  const { userDetails } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    pendingComplaints: 0,
    pendingFees: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Get total students count
        const studentsSnapshot = await getCountFromServer(collection(db, 'students'));
        
        // Get rooms stats
        const roomsSnapshot = await getDocs(collection(db, 'rooms'));
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
        const pendingComplaintsSnapshot = await getCountFromServer(pendingComplaintsQuery);
        
        // Get pending fees count
        const pendingFeesQuery = query(
          collection(db, 'fees'),
          where('status', 'in', ['pending', 'overdue'])
        );
        const pendingFeesSnapshot = await getCountFromServer(pendingFeesQuery);

        setStats({
          totalStudents: studentsSnapshot.data().count,
          totalRooms,
          occupiedRooms,
          pendingComplaints: pendingComplaintsSnapshot.data().count,
          pendingFees: pendingFeesSnapshot.data().count
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {userDetails?.name}</h1>
          <p className="text-gray-500">Admin Dashboard Overview</p>
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
                    <Button size="sm" variant="outline">Assign Staff</Button>
                    <Button size="sm" variant="ghost">Dismiss</Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Bell className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Fee Collection Period</h4>
                  <p className="text-sm text-gray-600">Monthly fee collection period starts tomorrow</p>
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" variant="outline">Send Reminders</Button>
                    <Button size="sm" variant="ghost">Dismiss</Button>
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
