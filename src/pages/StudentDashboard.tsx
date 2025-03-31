import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, CreditCard, Clipboard, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChatBot from '@/components/ChatBot';

const StudentDashboard: React.FC = () => {
  const { userDetails } = useAuth();
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [feeStatus, setFeeStatus] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (userDetails?.id) {
        try {
          const studentDoc = await getDoc(doc(db, 'students', userDetails.id));
          if (studentDoc.exists() && studentDoc.data().roomId) {
            const roomDoc = await getDoc(doc(db, 'rooms', studentDoc.data().roomId));
            if (roomDoc.exists()) {
              setRoomInfo(roomDoc.data());
            }
          }

          const feeQuery = query(
            collection(db, 'fees'),
            where('studentId', '==', userDetails.id)
          );
          const feeSnapshot = await getDocs(feeQuery);
          if (!feeSnapshot.empty) {
            const feeData = feeSnapshot.docs[0].data();
            setFeeStatus(feeData);
          }

          const complaintQuery = query(
            collection(db, 'complaints'),
            where('studentId', '==', userDetails.id)
          );
          const complaintSnapshot = await getDocs(complaintQuery);
          const complaintList: any[] = [];
          complaintSnapshot.forEach((doc) => {
            complaintList.push({ id: doc.id, ...doc.data() });
          });
          setComplaints(complaintList);

        } catch (error) {
          console.error('Error fetching student data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStudentData();
  }, [userDetails?.id]);

  const getFeeStatusColor = () => {
    if (!feeStatus) return 'bg-gray-200';
    switch (feeStatus.status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-200';
    }
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {userDetails?.name}</h1>
          <p className="text-gray-500">Here's your hostel dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Home className="w-5 h-5 mr-2 text-blue-500" />
                Room Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : roomInfo ? (
                <div>
                  <p className="text-3xl font-bold">{roomInfo.roomNumber}</p>
                  <p className="text-gray-500">Block {roomInfo.block}, Floor {roomInfo.floor}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {roomInfo.type} room • {roomInfo.occupied}/{roomInfo.capacity} occupied
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-3">No room assigned yet</p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/room-booking">Book a Room</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
                Fee Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : feeStatus ? (
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${getFeeStatusColor()}`}></span>
                    <span className="font-medium capitalize">{feeStatus.status}</span>
                  </div>
                  <p className="text-3xl font-bold mt-2">₹{feeStatus.amount}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Due: {new Date(feeStatus.dueDate).toLocaleDateString()}
                  </p>
                  {feeStatus.status !== 'paid' && (
                    <Button className="w-full mt-3" size="sm" asChild>
                      <Link to="/fee-payment">Pay Now</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No fee information available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Clipboard className="w-5 h-5 mr-2 text-blue-500" />
                Complaints
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : complaints.length > 0 ? (
                <div>
                  <p className="font-medium">{complaints.length} Active Complaints</p>
                  <ul className="mt-2 space-y-2">
                    {complaints.slice(0, 2).map((complaint) => (
                      <li key={complaint.id} className="text-sm">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${
                            complaint.status === 'resolved' ? 'bg-green-500' : 
                            complaint.status === 'in-progress' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></span>
                          <span className="truncate">{complaint.title}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                    <Link to="/my-complaints">View All</Link>
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-3">No complaints submitted</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/my-complaints">New Complaint</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Bell className="w-5 h-5 mr-2 text-blue-500" />
                Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">No new announcements</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link to="/notifications">View All</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>
                Access common features quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center" asChild>
                  <Link to="/room-booking">
                    <Home className="h-5 w-5 mb-1" />
                    <span>Book a Room</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center" asChild>
                  <Link to="/fee-payment">
                    <CreditCard className="h-5 w-5 mb-1" />
                    <span>Pay Fees</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center" asChild>
                  <Link to="/my-complaints">
                    <Clipboard className="h-5 w-5 mb-1" />
                    <span>Submit Complaint</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center" asChild>
                  <Link to="/notifications">
                    <Bell className="h-5 w-5 mb-1" />
                    <span>Notifications</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent interactions with the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4 py-1">
                  <p className="text-sm font-medium">Logged into the system</p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
                <div className="border-l-4 border-gray-200 pl-4 py-1">
                  <p className="text-sm font-medium">Account created</p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ChatBot />
    </DashboardLayout>
  );
};

export default StudentDashboard;
