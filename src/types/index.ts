
// User types
export interface User {
  id: string;
  email: string;
  role: 'student' | 'admin';
  name: string;
  profilePicture?: string;
}

// Room types
export interface Room {
  id: string;
  roomNumber: string;
  capacity: number;
  occupied: number;
  floor: number;
  block: string;
  type: 'single' | 'double' | 'triple';
  amenities: string[];
  status: 'available' | 'occupied' | 'maintenance';
}

// Fee types
export interface Fee {
  id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paymentDate?: string;
  transactionId?: string;
}

// Complaint types
export interface Complaint {
  id: string;
  studentId: string;
  roomNumber: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  resolvedAt?: string;
}

// Announcement types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: string;
  important: boolean;
}

// Student specific types
export interface Student extends User {
  role: 'student';
  roomId?: string;
  studentId: string;
  course: string;
  year: number;
  contactNumber: string;
  parentContact: string;
  address: string;
}

// Admin specific types
export interface Admin extends User {
  role: 'admin';
  staffId: string;
  department: string;
  contactNumber: string;
}
