
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from 'firebase/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserCircle2, Mail, Phone, MapPin, BookOpen, User, Calendar, Pencil, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChatBot from '@/components/ChatBot';

interface StudentProfile {
  name: string;
  email: string;
  profilePicture?: string;
  contactNumber?: string;
  alternateContact?: string;
  parentContact?: string;
  address?: string;
  course?: string;
  year?: number;
  dateOfBirth?: string;
  bloodGroup?: string;
  about?: string;
  joinedAt?: string;
}

const Profile: React.FC = () => {
  const { userDetails, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<StudentProfile>({
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<StudentProfile>({
    name: '',
    email: '',
    contactNumber: '',
    alternateContact: '',
    parentContact: '',
    address: '',
    course: '',
    year: 1,
    dateOfBirth: '',
    bloodGroup: '',
    about: '',
  });
  
  useEffect(() => {
    if (userDetails?.id) {
      fetchUserProfile();
    }
  }, [userDetails?.id]);

  const fetchUserProfile = async () => {
    if (!userDetails?.id) return;
    
    setLoading(true);
    try {
      const docRef = doc(db, 'users', userDetails.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const profileData: StudentProfile = {
          name: userData.name || userDetails.name || '',
          email: userDetails.email || '',
          profilePicture: userData.profilePicture || '',
          contactNumber: userData.contactNumber || '',
          alternateContact: userData.alternateContact || '',
          parentContact: userData.parentContact || '',
          address: userData.address || '',
          course: userData.course || '',
          year: userData.year || 1,
          dateOfBirth: userData.dateOfBirth || '',
          bloodGroup: userData.bloodGroup || '',
          about: userData.about || '',
          joinedAt: userData.createdAt || new Date().toISOString(),
        };
        
        setProfile(profileData);
        setEditForm(profileData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditToggle = () => {
    setEditing(!editing);
    if (!editing) {
      setEditForm(profile);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveProfile = async () => {
    if (!userDetails?.id) return;
    
    setSaving(true);
    try {
      const userData = {
        name: editForm.name,
        contactNumber: editForm.contactNumber,
        alternateContact: editForm.alternateContact,
        parentContact: editForm.parentContact,
        address: editForm.address,
        course: editForm.course,
        year: editForm.year,
        dateOfBirth: editForm.dateOfBirth,
        bloodGroup: editForm.bloodGroup,
        about: editForm.about,
      };
      
      // Update in Firestore
      await updateUserProfile(userData);
      
      // Also update Auth profile if name changed
      if (auth.currentUser && editForm.name !== profile.name) {
        await updateProfile(auth.currentUser, {
          displayName: editForm.name
        });
      }
      
      // Update local state
      setProfile(prev => ({ ...prev, ...userData }));
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-gray-500">
              View and update your personal information
            </p>
          </div>
          <Button onClick={handleEditToggle} variant={editing ? "outline" : "default"}>
            {editing ? "Cancel" : <><Pencil className="mr-1 h-4 w-4" /> Edit Profile</>}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-32 w-32">
                    {profile.profilePicture ? (
                      <AvatarImage src={profile.profilePicture} alt={profile.name} />
                    ) : (
                      <AvatarFallback className="text-4xl bg-blue-100 text-blue-600">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
                <CardTitle className="text-2xl">{profile.name}</CardTitle>
                <CardDescription className="flex items-center justify-center">
                  <Mail className="h-4 w-4 mr-1" /> {profile.email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.contactNumber && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p>{profile.contactNumber}</p>
                      </div>
                    </div>
                  )}
                  
                  {profile.address && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p>{profile.address}</p>
                      </div>
                    </div>
                  )}
                  
                  {profile.course && (
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Course</p>
                        <p>{profile.course}, Year {profile.year}</p>
                      </div>
                    </div>
                  )}
                  
                  {profile.joinedAt && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Joined</p>
                        <p>{new Date(profile.joinedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {editing ? (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Edit Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal details below
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={editForm.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactNumber">Contact Number</Label>
                        <Input
                          id="contactNumber"
                          name="contactNumber"
                          value={editForm.contactNumber || ''}
                          onChange={handleInputChange}
                          placeholder="Your contact number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alternateContact">Alternate Contact</Label>
                        <Input
                          id="alternateContact"
                          name="alternateContact"
                          value={editForm.alternateContact || ''}
                          onChange={handleInputChange}
                          placeholder="Alternate contact number"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="parentContact">Parent's Contact</Label>
                      <Input
                        id="parentContact"
                        name="parentContact"
                        value={editForm.parentContact || ''}
                        onChange={handleInputChange}
                        placeholder="Parent's contact number"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        name="address"
                        value={editForm.address || ''}
                        onChange={handleInputChange}
                        placeholder="Your permanent address"
                        rows={3}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="course">Course</Label>
                        <Input
                          id="course"
                          name="course"
                          value={editForm.course || ''}
                          onChange={handleInputChange}
                          placeholder="Your course of study"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <select 
                          id="year"
                          name="year"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={editForm.year || '1'}
                          onChange={(e) => setEditForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        >
                          <option value="1">First Year</option>
                          <option value="2">Second Year</option>
                          <option value="3">Third Year</option>
                          <option value="4">Fourth Year</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          value={editForm.dateOfBirth || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bloodGroup">Blood Group</Label>
                        <Input
                          id="bloodGroup"
                          name="bloodGroup"
                          value={editForm.bloodGroup || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., O+, A-, B+"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="about">About Me</Label>
                      <Textarea
                        id="about"
                        name="about"
                        value={editForm.about || ''}
                        onChange={handleInputChange}
                        placeholder="Tell us a bit about yourself"
                        rows={4}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleEditToggle} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Your personal details and information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium">Contact Information</h3>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                        <div>
                          <p className="text-sm text-gray-500">Email Address</p>
                          <p>{profile.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Contact Number</p>
                          <p>{profile.contactNumber || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Alternate Contact</p>
                          <p>{profile.alternateContact || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Parent's Contact</p>
                          <p>{profile.parentContact || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium">Address</h3>
                      <p className="mt-2">{profile.address || 'No address provided'}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium">Academic Information</h3>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                        <div>
                          <p className="text-sm text-gray-500">Course</p>
                          <p>{profile.course || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Year</p>
                          <p>{profile.year ? ordinalSuffix(profile.year) + ' Year' : 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium">Personal Information</h3>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                        <div>
                          <p className="text-sm text-gray-500">Date of Birth</p>
                          <p>{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Blood Group</p>
                          <p>{profile.bloodGroup || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {profile.about && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-lg font-medium">About Me</h3>
                          <p className="mt-2">{profile.about}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleEditToggle} className="ml-auto">
                    <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        )}
      </div>
      <ChatBot />
    </DashboardLayout>
  );
};

// Helper function for ordinal numbers (1st, 2nd, 3rd, etc.)
function ordinalSuffix(i: number): string {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) {
    return i + "st";
  }
  if (j === 2 && k !== 12) {
    return i + "nd";
  }
  if (j === 3 && k !== 13) {
    return i + "rd";
  }
  return i + "th";
}

export default Profile;
