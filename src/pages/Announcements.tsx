
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  orderBy
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Pencil, 
  Bell, 
  Trash2, 
  Megaphone, 
  Calendar, 
  Check, 
  AlertTriangle
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Announcement } from '@/types';

interface AnnouncementType extends Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  important: boolean;
  createdAt: string;
  updatedAt?: string;
}

const Announcements: React.FC = () => {
  const { userDetails } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<AnnouncementType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<AnnouncementType | null>(null);
  const [announcementToEdit, setAnnouncementToEdit] = useState<AnnouncementType | null>(null);

  // Form state for adding/editing announcement
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    important: false
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const announcementsData: AnnouncementType[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        announcementsData.push({
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          createdBy: data.createdBy || 'Admin',
          important: data.important || false,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
        });
      });
      
      // If no announcements found, create sample data
      if (announcementsData.length === 0) {
        const sampleAnnouncements = [
          {
            title: 'Hostel Maintenance Schedule',
            content: 'The hostel will undergo maintenance work next weekend. Please ensure your rooms are accessible for maintenance staff on Saturday between 10 AM and 4 PM.',
            createdBy: userDetails?.name || 'Admin',
            important: true,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            title: 'New Mess Menu',
            content: 'We are pleased to announce that the mess menu has been updated based on student feedback. The new menu will be effective from next Monday.',
            createdBy: userDetails?.name || 'Admin',
            important: false,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            title: 'Hostel Day Celebrations',
            content: 'Annual Hostel Day celebrations will be held on the 15th of next month. All students are requested to register for various events and competitions by the end of this week.',
            createdBy: userDetails?.name || 'Admin',
            important: false,
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        
        for (const announcement of sampleAnnouncements) {
          await addDoc(collection(db, 'announcements'), {
            ...announcement,
            createdAt: serverTimestamp()
          });
        }
        
        // Re-fetch to get the sample data with IDs
        return fetchAnnouncements();
      }
      
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load announcements',
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

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({
      ...formData,
      important: checked
    });
  };

  const openAddDialog = () => {
    setFormData({
      title: '',
      content: '',
      important: false
    });
    setShowAddDialog(true);
  };

  const openEditDialog = (announcement: AnnouncementType) => {
    setAnnouncementToEdit(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      important: announcement.important
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (announcement: AnnouncementType) => {
    setAnnouncementToDelete(announcement);
    setShowDeleteDialog(true);
  };

  const handleAddAnnouncement = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const announcementData = {
        title: formData.title,
        content: formData.content,
        important: formData.important,
        createdBy: userDetails?.name || 'Admin',
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'announcements'), announcementData);
      
      // Create a global notification for all students
      await addDoc(collection(db, 'notifications'), {
        title: formData.important ? 'Important Announcement' : 'New Announcement',
        message: formData.title,
        type: 'announcement',
        global: true,
        createdAt: serverTimestamp(),
        read: false
      });
      
      const newAnnouncement = { 
        id: docRef.id, 
        title: formData.title,
        content: formData.content,
        important: formData.important,
        createdBy: userDetails?.name || 'Admin',
        createdAt: new Date().toISOString()
      };
      
      setAnnouncements([newAnnouncement, ...announcements]);
      
      toast({
        title: 'Success',
        description: 'Announcement has been published',
      });
      
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish announcement',
        variant: 'destructive',
      });
    }
  };

  const handleEditAnnouncement = async () => {
    if (!announcementToEdit) return;
    
    if (!formData.title || !formData.content) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await updateDoc(doc(db, 'announcements', announcementToEdit.id), {
        title: formData.title,
        content: formData.content,
        important: formData.important,
        updatedAt: serverTimestamp()
      });
      
      // Update the announcements list
      const updatedAnnouncements = announcements.map(announcement =>
        announcement.id === announcementToEdit.id
          ? { 
              ...announcement, 
              title: formData.title,
              content: formData.content,
              important: formData.important,
              updatedAt: new Date().toISOString()
            }
          : announcement
      );
      
      setAnnouncements(updatedAnnouncements);
      
      toast({
        title: 'Success',
        description: 'Announcement has been updated',
      });
      
      setShowEditDialog(false);
      setAnnouncementToEdit(null);
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to update announcement',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'announcements', announcementToDelete.id));
      
      setAnnouncements(announcements.filter(a => a.id !== announcementToDelete.id));
      
      toast({
        title: 'Success',
        description: 'Announcement has been deleted',
      });
      
      setShowDeleteDialog(false);
      setAnnouncementToDelete(null);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive',
      });
    }
  };

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout requiredRole={userDetails?.role === 'admin' ? 'admin' : undefined}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Announcements</h1>
            <p className="text-gray-500">
              {userDetails?.role === 'admin' 
                ? 'Manage and publish hostel announcements' 
                : 'View hostel announcements and updates'}
            </p>
          </div>
          {userDetails?.role === 'admin' && (
            <Button onClick={openAddDialog}>
              <Megaphone className="mr-2 h-4 w-4" /> New Announcement
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {userDetails?.role === 'admin' ? 'Publish Announcements' : 'Hostel Announcements'}
            </CardTitle>
            <CardDescription>
              {userDetails?.role === 'admin' 
                ? 'Keep students informed about hostel updates and events'
                : 'Stay updated with the latest hostel news and events'}
            </CardDescription>
            <div className="relative w-full md:w-64 mt-4">
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
              </div>
            ) : filteredAnnouncements.length > 0 ? (
              <div className="space-y-4">
                {filteredAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className={`
                    ${announcement.important ? 'border-red-300' : 'border-gray-200'} 
                    relative overflow-hidden
                  `}>
                    {announcement.important && (
                      <div className="absolute top-0 right-0">
                        <Badge className="bg-red-500 rounded-bl-lg rounded-tr-lg rounded-tl-none rounded-br-none">
                          Important
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle>{announcement.title}</CardTitle>
                        {userDetails?.role === 'admin' && (
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditDialog(announcement)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openDeleteDialog(announcement)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString() : 'Unknown date'}
                        {" • "}
                        <span>{announcement.createdBy}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-line">{announcement.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40">
                <Bell className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500">No announcements found</p>
                {userDetails?.role === 'admin' && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={openAddDialog}
                  >
                    Create your first announcement
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Announcement Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
            <DialogDescription>
              Create a new announcement for hostel students
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter announcement title"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                placeholder="Enter announcement content"
                rows={5}
                value={formData.content}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="important" 
                checked={formData.important}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="important" className="font-medium cursor-pointer">
                Mark as important
              </Label>
              {formData.important && (
                <span className="text-xs text-red-500">
                  (This will highlight the announcement and send urgent notifications)
                </span>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAnnouncement}>
              Publish Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Announcement Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>
              Update the announcement details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                name="content"
                rows={5}
                value={formData.content}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="edit-important" 
                checked={formData.important}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="edit-important" className="font-medium cursor-pointer">
                Mark as important
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAnnouncement}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Announcement Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {announcementToDelete && (
            <div className="py-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <AlertTriangle className="h-5 w-5 text-gray-500" />
                <div>
                  <h4 className="font-medium">{announcementToDelete.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {announcementToDelete.content}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAnnouncement}>
              Delete Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Announcements;
