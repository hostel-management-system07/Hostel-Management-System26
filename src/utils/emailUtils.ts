
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface EmailData {
  recipients: string[];
  subject: string;
  message: string;
  senderId?: string;
  senderName?: string;
  attachment?: string;
}

// Function to send mass emails
export const sendMassEmail = async (emailData: EmailData) => {
  try {
    // In a real application, you would integrate with an email service provider
    // For this simulation, we'll create a record in Firestore and also create notifications
    
    // Create an email record
    const emailRecord = await addDoc(collection(db, 'emails'), {
      ...emailData,
      sent: true,
      sentAt: serverTimestamp(),
    });
    
    // Create notifications for each recipient
    for (const recipient of emailData.recipients) {
      await addDoc(collection(db, 'notifications'), {
        userId: recipient,
        title: emailData.subject,
        message: `${emailData.senderName || 'Admin'} sent you an email: ${emailData.message.substring(0, 50)}${emailData.message.length > 50 ? '...' : ''}`,
        type: 'email',
        createdAt: serverTimestamp(),
        read: false
      });
    }
    
    // Also create a global notification for announcements if it's from fee management
    if (emailData.subject.toLowerCase().includes('fee') || 
        emailData.message.toLowerCase().includes('payment') || 
        emailData.message.toLowerCase().includes('fee')) {
      
      await addDoc(collection(db, 'announcements'), {
        title: emailData.subject,
        content: emailData.message,
        important: emailData.subject.toLowerCase().includes('urgent') || emailData.subject.toLowerCase().includes('important'),
        createdBy: emailData.senderName || 'Admin',
        createdAt: serverTimestamp()
      });
    }
    
    return { success: true, emailId: emailRecord.id };
  } catch (error) {
    console.error('Error sending mass email:', error);
    throw error;
  }
};

// Function to send individual email
export const sendEmail = async (emailData: EmailData) => {
  try {
    // Similar to above but for a single recipient
    const emailRecord = await addDoc(collection(db, 'emails'), {
      ...emailData,
      sent: true,
      sentAt: serverTimestamp(),
    });
    
    // Create notification for the recipient
    if (emailData.recipients.length > 0) {
      await addDoc(collection(db, 'notifications'), {
        userId: emailData.recipients[0],
        title: emailData.subject,
        message: `${emailData.senderName || 'Admin'} sent you an email: ${emailData.message.substring(0, 50)}${emailData.message.length > 50 ? '...' : ''}`,
        type: 'email',
        createdAt: serverTimestamp(),
        read: false
      });
    }
    
    return { success: true, emailId: emailRecord.id };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
