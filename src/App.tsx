
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RoomBooking from "./pages/RoomBooking";
import NotFound from "./pages/NotFound";

// Placeholder components for routes we'll implement later
const ManageRooms = () => <div>Manage Rooms Page - Coming Soon</div>;
const ManageStudents = () => <div>Manage Students Page - Coming Soon</div>;
const Complaints = () => <div>Complaints Page - Coming Soon</div>;
const FeeManagement = () => <div>Fee Management Page - Coming Soon</div>;
const Announcements = () => <div>Announcements Page - Coming Soon</div>;
const Settings = () => <div>Settings Page - Coming Soon</div>;

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/room-booking" element={<RoomBooking />} />
            
            {/* Admin routes */}
            <Route path="/manage-rooms" element={<ManageRooms />} />
            <Route path="/manage-students" element={<ManageStudents />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/fee-management" element={<FeeManagement />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/settings" element={<Settings />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
