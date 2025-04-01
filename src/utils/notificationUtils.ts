
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface NotificationData {
  title: string;
  message: string;
  type: string;
  global?: boolean;
  userId?: string;
  read?: boolean;
  link?: string;
}

// Create notification for a specific user
export const createUserNotification = async (userId: string, data: Omit<NotificationData, 'userId'>) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...data,
      userId,
      createdAt: serverTimestamp(),
      read: false
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Create global notification for all users
export const createGlobalNotification = async (data: Omit<NotificationData, 'global' | 'userId'>) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...data,
      global: true,
      createdAt: serverTimestamp(),
      read: false
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating global notification:', error);
    throw error;
  }
};

// Create a fee notification that appears in both notifications and announcements
export const createFeeNotification = async (data: Omit<NotificationData, 'global' | 'userId'>) => {
  try {
    // Create global notification
    await createGlobalNotification(data);
    
    // Create announcement
    await addDoc(collection(db, 'announcements'), {
      title: data.title,
      content: data.message,
      important: data.title.toLowerCase().includes('urgent') || data.title.toLowerCase().includes('important'),
      createdBy: 'Finance Department',
      createdAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating fee notification:', error);
    throw error;
  }
};

// Create notification from student complaint
export const createComplaintNotification = async (complaint: any) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      title: 'New Student Complaint',
      message: `${complaint.studentName || 'A student'} from Room ${complaint.roomNumber || 'Unknown'} reported: ${complaint.title}`,
      type: 'complaint',
      global: false,
      role: 'admin', // Only for admins
      createdAt: serverTimestamp(),
      read: false,
      link: `/complaints?id=${complaint.id}`
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating complaint notification:', error);
    throw error;
  }
};
