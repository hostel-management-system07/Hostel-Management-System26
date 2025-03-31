
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Lock, 
  UserCog, 
  Mail, 
  Smartphone, 
  RefreshCw,
  EyeOff,
  Download,
  Database
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ChatBot from '@/components/ChatBot';

const Settings: React.FC = () => {
  const { userDetails, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isStudent, setIsStudent] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  
  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    hostelName: 'University Hostel',
    contactEmail: 'admin@universityhostel.com',
    contactPhone: '+91 9876543210',
    address: '123 University Road, College Town',
    currency: 'INR'
  });
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    enableFeeReminders: true,
    enableAnnouncementNotifications: true,
    reminderDays: 3
  });
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    showStudentContacts: false,
    showRoomDetails: true,
    allowStudentPhotos: true,
    dataRetentionMonths: 12
  });

  useEffect(() => {
    if (userDetails) {
      setIsStudent(userDetails.role === 'student');
      fetchSettings();
    }
  }, [userDetails]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
      
      if (settingsDoc.exists()) {
        setGeneralSettings(settingsDoc.data() as any);
      } else {
        // Create default settings if they don't exist
        await updateDoc(doc(db, 'settings', 'general'), generalSettings);
      }
      
      const notificationsDoc = await getDoc(doc(db, 'settings', 'notifications'));
      if (notificationsDoc.exists()) {
        setNotificationSettings(notificationsDoc.data() as any);
      } else {
        await updateDoc(doc(db, 'settings', 'notifications'), notificationSettings);
      }
      
      const privacyDoc = await getDoc(doc(db, 'settings', 'privacy'));
      if (privacyDoc.exists()) {
        setPrivacySettings(privacyDoc.data() as any);
      } else {
        await updateDoc(doc(db, 'settings', 'privacy'), privacySettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (setting: string, checked: boolean, type: 'notification' | 'privacy') => {
    if (type === 'notification') {
      setNotificationSettings(prev => ({ ...prev, [setting]: checked }));
    } else {
      setPrivacySettings(prev => ({ ...prev, [setting]: checked }));
    }
  };

  const handleSelectChange = (setting: string, value: string, type: 'notification' | 'privacy') => {
    if (type === 'notification') {
      setNotificationSettings(prev => ({ ...prev, [setting]: Number(value) }));
    } else {
      setPrivacySettings(prev => ({ ...prev, [setting]: Number(value) }));
    }
  };

  const handleSaveSettings = async (type: 'general' | 'notification' | 'privacy') => {
    try {
      let data;
      let settingName;
      
      switch (type) {
        case 'general':
          data = generalSettings;
          settingName = 'General';
          await updateDoc(doc(db, 'settings', 'general'), data);
          break;
        case 'notification':
          data = notificationSettings;
          settingName = 'Notification';
          await updateDoc(doc(db, 'settings', 'notifications'), data);
          break;
        case 'privacy':
          data = privacySettings;
          settingName = 'Privacy';
          await updateDoc(doc(db, 'settings', 'privacy'), data);
          break;
      }
      
      toast({
        title: 'Settings Saved',
        description: `${settingName} settings have been updated successfully`,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  const handleCreateBackup = async () => {
    setBackupInProgress(true);
    try {
      // Simulate backup creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const backupData = {
        timestamp: new Date().toISOString(),
        createdBy: userDetails?.name || 'Admin',
        status: 'completed',
        size: '2.4 MB',
        includedCollections: ['users', 'rooms', 'complaints', 'fees', 'notifications', 'announcements']
      };
      
      await addDoc(collection(db, 'backups'), {
        ...backupData,
        createdAt: serverTimestamp()
      });
      
      toast({
        title: 'Backup Created',
        description: 'Database backup has been created successfully',
      });
      
      setShowBackupDialog(false);
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: 'Error',
        description: 'Failed to create backup',
        variant: 'destructive',
      });
    } finally {
      setBackupInProgress(false);
    }
  };

  const handlePasswordReset = () => {
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      return;
    }
    
    // Simulate password reset email
    toast({
      title: 'Password Reset Email Sent',
      description: `Instructions to reset password have been sent to ${email}`,
    });
    
    setPasswordResetDialogOpen(false);
    setEmail('');
    setEmailError('');
  };

  const renderSettingsTabs = () => {
    if (isStudent) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCog className="mr-2 h-5 w-5 text-blue-500" />
              Account Settings
            </CardTitle>
            <CardDescription>Manage your student account preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Notification Preferences</h3>
                <Separator />
                
                <div className="grid gap-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={notificationSettings.enableEmailNotifications} 
                      onCheckedChange={(checked) => handleSwitchChange('enableEmailNotifications', checked, 'notification')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="fee-reminders">Fee Reminders</Label>
                      <p className="text-sm text-gray-500">Get reminders about upcoming fee payments</p>
                    </div>
                    <Switch 
                      id="fee-reminders" 
                      checked={notificationSettings.enableFeeReminders} 
                      onCheckedChange={(checked) => handleSwitchChange('enableFeeReminders', checked, 'notification')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="announcement-notifications">Announcement Notifications</Label>
                      <p className="text-sm text-gray-500">Receive hostel announcements</p>
                    </div>
                    <Switch 
                      id="announcement-notifications" 
                      checked={notificationSettings.enableAnnouncementNotifications} 
                      onCheckedChange={(checked) => handleSwitchChange('enableAnnouncementNotifications', checked, 'notification')}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Privacy Settings</h3>
                <Separator />
                
                <div className="grid gap-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-contact">Share Contact Details</Label>
                      <p className="text-sm text-gray-500">Allow other students to see your contact information</p>
                    </div>
                    <Switch 
                      id="show-contact" 
                      checked={privacySettings.showStudentContacts} 
                      onCheckedChange={(checked) => handleSwitchChange('showStudentContacts', checked, 'privacy')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-photos">Allow Photos</Label>
                      <p className="text-sm text-gray-500">Allow your photos to be used in hostel publications</p>
                    </div>
                    <Switch 
                      id="allow-photos" 
                      checked={privacySettings.allowStudentPhotos} 
                      onCheckedChange={(checked) => handleSwitchChange('allowStudentPhotos', checked, 'privacy')}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Account Security</h3>
                <Separator />
                
                <div className="pt-2">
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setPasswordResetDialogOpen(true)}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Reset Password
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={() => handleSaveSettings('notification')}>
              Save Preferences
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return (
      <Tabs defaultValue="general">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy & Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage basic hostel information and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hostelName">Hostel Name</Label>
                <Input
                  id="hostelName"
                  name="hostelName"
                  value={generalSettings.hostelName}
                  onChange={handleGeneralSettingChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      value={generalSettings.contactEmail}
                      onChange={handleGeneralSettingChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <div className="flex items-center">
                    <Smartphone className="h-4 w-4 mr-2 text-gray-500" />
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      value={generalSettings.contactPhone}
                      onChange={handleGeneralSettingChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Hostel Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={generalSettings.address}
                  onChange={handleGeneralSettingChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={generalSettings.currency}
                  onValueChange={(value) => setGeneralSettings({...generalSettings, currency: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="GBP">British Pound (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={() => handleSaveSettings('general')}>
                Save General Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how notifications are sent to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Send notifications via email</p>
                </div>
                <Switch 
                  id="emailNotifications" 
                  checked={notificationSettings.enableEmailNotifications}
                  onCheckedChange={(checked) => handleSwitchChange('enableEmailNotifications', checked, 'notification')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smsNotifications">SMS Notifications</Label>
                  <p className="text-sm text-gray-500">Send important alerts via SMS</p>
                </div>
                <Switch 
                  id="smsNotifications" 
                  checked={notificationSettings.enableSMSNotifications}
                  onCheckedChange={(checked) => handleSwitchChange('enableSMSNotifications', checked, 'notification')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="feeReminders">Fee Payment Reminders</Label>
                  <p className="text-sm text-gray-500">Send reminders for upcoming fee payments</p>
                </div>
                <Switch 
                  id="feeReminders" 
                  checked={notificationSettings.enableFeeReminders}
                  onCheckedChange={(checked) => handleSwitchChange('enableFeeReminders', checked, 'notification')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="announcementNotifications">Announcement Notifications</Label>
                  <p className="text-sm text-gray-500">Notify students about new announcements</p>
                </div>
                <Switch 
                  id="announcementNotifications" 
                  checked={notificationSettings.enableAnnouncementNotifications}
                  onCheckedChange={(checked) => handleSwitchChange('enableAnnouncementNotifications', checked, 'notification')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reminderDays">Fee Reminder Days</Label>
                <p className="text-sm text-gray-500">Send fee reminders this many days before due date</p>
                <Select 
                  value={notificationSettings.reminderDays.toString()}
                  onValueChange={(value) => handleSelectChange('reminderDays', value, 'notification')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day before</SelectItem>
                    <SelectItem value="3">3 days before</SelectItem>
                    <SelectItem value="5">5 days before</SelectItem>
                    <SelectItem value="7">7 days before</SelectItem>
                    <SelectItem value="14">14 days before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={() => handleSaveSettings('notification')}>
                Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Data Settings</CardTitle>
              <CardDescription>
                Manage privacy controls and data handling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showStudentContacts">Show Student Contact Info</Label>
                  <p className="text-sm text-gray-500">Allow students to see each other's contact information</p>
                </div>
                <Switch 
                  id="showStudentContacts" 
                  checked={privacySettings.showStudentContacts}
                  onCheckedChange={(checked) => handleSwitchChange('showStudentContacts', checked, 'privacy')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showRoomDetails">Show Room Assignment Details</Label>
                  <p className="text-sm text-gray-500">Display which students are assigned to which rooms</p>
                </div>
                <Switch 
                  id="showRoomDetails" 
                  checked={privacySettings.showRoomDetails}
                  onCheckedChange={(checked) => handleSwitchChange('showRoomDetails', checked, 'privacy')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowStudentPhotos">Allow Student Photos</Label>
                  <p className="text-sm text-gray-500">Allow student photos in the system</p>
                </div>
                <Switch 
                  id="allowStudentPhotos" 
                  checked={privacySettings.allowStudentPhotos}
                  onCheckedChange={(checked) => handleSwitchChange('allowStudentPhotos', checked, 'privacy')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dataRetention">Data Retention Period</Label>
                <p className="text-sm text-gray-500">How long to keep student data after they leave</p>
                <Select 
                  value={privacySettings.dataRetentionMonths.toString()}
                  onValueChange={(value) => handleSelectChange('dataRetentionMonths', value, 'privacy')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select retention period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="36">36 months</SelectItem>
                    <SelectItem value="60">5 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-4 space-y-4">
                <h3 className="font-medium text-gray-800">Data Management</h3>
                <div className="flex flex-col space-y-2">
                  <Button variant="outline" onClick={() => setShowBackupDialog(true)}>
                    <Database className="mr-2 h-4 w-4" /> Create Database Backup
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={() => handleSaveSettings('privacy')}>
                Save Privacy Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <SettingsIcon className="h-6 w-6 text-blue-500 mr-2" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-gray-500">Manage your account and system preferences</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          </div>
        ) : (
          renderSettingsTabs()
        )}
      </div>

      {/* Database Backup Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Database Backup</DialogTitle>
            <DialogDescription>
              This will create a backup of all system data for safekeeping
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <RefreshCw className="h-5 w-5 text-blue-500" />
                <div>
                  <h4 className="font-medium">Database Backup</h4>
                  <p className="text-sm text-gray-600">
                    This will back up all system data including users, rooms, fees, and complaints.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupDialog(false)} disabled={backupInProgress}>
              Cancel
            </Button>
            <Button onClick={handleCreateBackup} disabled={backupInProgress}>
              {backupInProgress ? (
                <>
                  <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                  Creating Backup...
                </>
              ) : (
                <>Create Backup</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordResetDialogOpen} onOpenChange={setPasswordResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Your Password</DialogTitle>
            <DialogDescription>
              Enter your email address to receive a password reset link
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
              />
              {emailError && <p className="text-sm text-red-500">{emailError}</p>}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordReset}>
              Send Reset Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isStudent && <ChatBot />}
    </DashboardLayout>
  );
};

export default Settings;
