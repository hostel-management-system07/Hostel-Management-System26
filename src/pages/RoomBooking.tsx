"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "../config/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import { collection, getDocs, addDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Room } from "@/types";
import DashboardLayout from "../components/layout/DashboardLayout";

const RoomBooking = () => {
  const { userDetails } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [openDialog, setOpenDialog] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const snapshot = await getDocs(collection(db, "rooms"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Room[];
        setRooms(data);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleRoomRequest = async () => {
    if (!roomName || !department) {
      alert("Please fill all fields");
      return;
    }

    try {
      await addDoc(collection(db, "roomRequests"), {
        name: roomName,
        department,
        requestedBy: userDetails.id,
        status: "Pending",
        createdAt: new Date(),
      });

      setRoomName("");
      setDepartment("");
      setOpenDialog(false);

      toast({
        title: "Request Sent",
        description: "Your room request has been sent to the admin.",
      });
    } catch (error) {
      console.error("Error requesting room:", error);
      alert("Something went wrong");
    }
  };

  if (!userDetails) {
    return (
      <div className="text-center text-xl py-10">
        Please log in to view rooms.
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Room Booking</h1>

          {/* Request Room Dialog */}
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button variant="default">Request a Room</Button>
            </DialogTrigger>
            <DialogContent className="space-y-4">
              <h2 className="text-lg font-semibold">Request a New Room</h2>

              <div className="space-y-2">
                <Label>Student Name</Label>
                <Input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="enter your name"
                />
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Enter Your Department"
                />
              </div>

              <Button onClick={handleRoomRequest}>Submit Request</Button>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="available" className="space-y-4">
          <TabsList>
            <TabsTrigger value="available">Available Rooms</TabsTrigger>
            <TabsTrigger value="booked">Booked Rooms</TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms
                .filter((room) => !room.booked)
                .map((room) => (
                  <Card key={room.id}>
                    <CardContent className="p-4">
                      <h2 className="font-semibold text-lg">{room.name}</h2>
                      <p>Capacity: {room.capacity}</p>
                      <p>Type: {room.type || "General"}</p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="booked">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms
                .filter(
                  (room) => room.booked && room.bookedBy === userDetails.id
                )
                .map((room) => (
                  <Card key={room.id}>
                    <CardContent className="p-4">
                      <h2 className="font-semibold text-lg">{room.name}</h2>
                      <p>Capacity: {room.capacity}</p>
                      <p>Booked by You</p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RoomBooking;
