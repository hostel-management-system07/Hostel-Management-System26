
import { Student } from './student';

export interface RoomType {
  id: string;
  roomNumber: string;
  capacity: number;
  occupied: number;
  floor: number;
  block: string;
  type: 'single' | 'double' | 'triple';
  amenities: string[];
  status: 'available' | 'occupied' | 'maintenance';
  students?: string[];
}

export interface RoomWithStudents extends RoomType {
  studentDetails?: Student[];
}
