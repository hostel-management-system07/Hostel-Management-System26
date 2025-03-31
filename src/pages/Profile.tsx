
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  Home, 
  GraduationCap, 
  Book, 
  Shield,
  CalendarDays,
  MapPin
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import ChatBot from '@/components/ChatBot';

const Profile: React.FC = () => {
  const { userDetails, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    course: '',
    year: '',
    studentId: '',
    parentName: '',
    parentContact: '',
    bloodGroup: '',
  });

  useEffect(() => {
    fetchUserDetails();
  }, [userDetails?.id]);

  const fetchUserDetails = async () => {
    if (!userDetails?.id) return;
    
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', userDetails.id));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          course: userData.course || '',
          year: userData.year || '',
          studentId: userData.studentId || '',
          parentName: userData.parentName || '',
          parentContact: userData.parentContact || '',
          bloodGroup: userData.bloodGroup || '',
        });
      } else {
        // If no additional user data found, set defaults
        setFormData({
          name: userDetails.name || '',
          email: userDetails.email || '',
          phone: '',
          address: '',
          course: 'B.Tech Computer Science',
          year: '2',
          studentId: 'ST' + Math.floor(1000 + Math.random() * 9000),
          parentName: '',
          parentContact: '',
          bloodGroup: '',
        });
        
        // Save default data
        await updateDoc(doc(db, 'users', userDetails.id), {
          name: userDetails.name || '',
          email: userDetails.email || '',
          course: 'B.Tech Computer Science',
          year: '2',
          studentId: 'ST' + Math.floor(1000 + Math.random() * 9000),
        });
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    if (!userDetails?.id) return;
    
    try {
      // Update in Firestore
      await updateDoc(doc(db, 'users', userDetails.id), {
        ...formData
      });
      
      // Update in Auth context
      if (updateUserProfile) {
        updateUserProfile({
          name: formData.name
        });
      }
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved',
      });
      
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-gray-500">Manage your personal information</p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Your basic details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-2xl bg-blue-500 text-white">
                    {getInitials(formData.name)}
                  </AvatarFallback>
                </Avatar>
                
                <h2 className="text-xl font-bold">{formData.name}</h2>
                <p className="text-gray-500">{formData.email}</p>
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm mt-2">
                  Student
                </div>
                
                <div className="w-full mt-6 space-y-4">
                  <div className="flex items-start space-x-3">
                    <GraduationCap className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Course</p>
                      <p className="font-medium">{formData.course}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CalendarDays className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Year</p>
                      <p className="font-medium">{formData.year}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Student ID</p>
                      <p className="font-medium">{formData.studentId}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>
                  {editing ? 'Edit your information below' : 'View and manage your student profile'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic">
                  <TabsList className="mb-4">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="academic">Academic</TabsTrigger>
                    <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        {editing ? (
                          <div className="flex">
                            <User className="h-5 w-5 text-gray-500 mr-2 mt-2" />
                            <Input
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                            />
                          </div>
                        ) : (
                          <div className="flex">
                            <User className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-gray-800">{formData.name}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        {editing ? (
                          <div className="flex">
                            <Mail className="h-5 w-5 text-gray-500 mr-2 mt-2" />
                            <Input
                              id="email"
                              name="email"
                              value={formData.email}
                              readOnly
                              disabled
                            />
                          </div>
                        ) : (
                          <div className="flex">
                            <Mail className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-gray-800">{formData.email}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        {editing ? (
                          <div className="flex">
                            <Phone className="h-5 w-5 text-gray-500 mr-2 mt-2" />
                            <Input
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="Enter your phone number"
                            />
                          </div>
                        ) : (
                          <div className="flex">
                            <Phone className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-gray-800">
                              {formData.phone || 'Not provided'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        {editing ? (
                          <div className="flex">
                            <Home className="h-5 w-5 text-gray-500 mr-2 mt-2" />
                            <Input
                              id="address"
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              placeholder="Enter your address"
                            />
                          </div>
                        ) : (
                          <div className="flex">
                            <Home className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-gray-800">
                              {formData.address || 'Not provided'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="academic" className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="course">Course</Label>
                        {editing ? (
                          <div className="flex">
                            <Book className="h-5 w-5 text-gray-500 mr-2 mt-2" />
                            <Input
                              id="course"
                              name="course"
                              value={formData.course}
                              onChange={handleInputChange}
                              placeholder="Enter your course"
                            />
                          </div>
                        ) : (
                          <div className="flex">
                            <Book className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-gray-800">{formData.course || 'Not provided'}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        {editing ? (
                          <div className="flex">
                            <CalendarDays className="h-5 w-5 text-gray-500 mr-2 mt-2" />
                            <Input
                              id="year"
                              name="year"
                              value={formData.year}
                              onChange={handleInputChange}
                              placeholder="Enter your year"
                            />
                          </div>
                        ) : (
                          <div className="flex">
                            <CalendarDays className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-gray-800">{formData.year || 'Not provided'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="emergency" className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="parentName">Parent/Guardian Name</Label>
                        {editing ? (
                          <div className="flex">
                            <User className="h-5 w-5 text-gray-500 mr-2 mt-2" />
                            <Input
                              id="parentName"
                              name="parentName"
                              value={formData.parentName}
                              onChange={handleInputChange}
                              placeholder="Enter parent/guardian name"
                            />
                          </div>
                        ) : (
                          <div className="flex">
                            <User className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-gray-800">
                              {formData.parentName || 'Not provided'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="parentContact">Emergency Contact</Label>
                        {editing ? (
                          <div className="flex">
                            <Phone className="h-5 w-5 text-gray-500 mr-2 mt-2" />
                            <Input
                              id="parentContact"
                              name="parentContact"
                              value={formData.parentContact}
                              onChange={handleInputChange}
                              placeholder="Enter emergency contact number"
                            />
                          </div>
                        ) : (
                          <div className="flex">
                            <Phone className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-gray-800">
                              {formData.parentContact || 'Not provided'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bloodGroup">Blood Group</Label>
                        {editing ? (
                          <div className="flex">
                            <MapPin className="h-5 w-5 text-gray-500 mr-2 mt-2" />
                            <Input
                              id="bloodGroup"
                              name="bloodGroup"
                              value={formData.bloodGroup}
                              onChange={handleInputChange}
                              placeholder="Enter your blood group"
                            />
                          </div>
                        ) : (
                          <div className="flex">
                            <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-gray-800">
                              {formData.bloodGroup || 'Not provided'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                {editing && (
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile}>
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <ChatBot />
    </DashboardLayout>
  );
};

export default Profile;
