
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RoomBooking from "./pages/RoomBooking";
import NotFound from "./pages/NotFound";
import ManageStudents from "./pages/ManageStudents";
import ManageAdmins from "./pages/ManageAdmins";
import ManageRooms from "./pages/ManageRooms";
import Complaints from "./pages/Complaints";
import FeeManagement from "./pages/FeeManagement";
import Announcements from "./pages/Announcements";
import Settings from "./pages/Settings";
import MyComplaints from "./pages/MyComplaints";
import FeePayment from "./pages/FeePayment";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Place TooltipProvider after AuthProvider */}
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/room-booking" element={<RoomBooking />} />
            
            {/* Student routes */}
            <Route path="/my-complaints" element={<MyComplaints />} />
            <Route path="/fee-payment" element={<FeePayment />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Admin routes */}
            <Route path="/manage-rooms" element={<ManageRooms />} />
            <Route path="/manage-students" element={<ManageStudents />} />
            <Route path="/manage-admins" element={<ManageAdmins />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/fee-management" element={<FeeManagement />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/settings" element={<Settings />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
