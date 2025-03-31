
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your hostel assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userDetails } = useAuth();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateResponse = (query: string): string => {
    query = query.toLowerCase();
    
    // Basic responses based on keywords
    if (query.includes('room') && (query.includes('book') || query.includes('reserve'))) {
      return "You can book a room by going to the Room Booking page from your dashboard. You'll need to select an available room and confirm your booking.";
    }
    
    if (query.includes('fee') || query.includes('payment')) {
      return "Fee payment can be done through the Fee Payment section. You can view your current dues and pay online using various payment methods.";
    }
    
    if (query.includes('complaint') || query.includes('issue') || query.includes('problem')) {
      return "To submit a complaint, navigate to the My Complaints section from your dashboard. Describe your issue, and our team will address it as soon as possible.";
    }
    
    if (query.includes('wifi') || query.includes('internet')) {
      return "WiFi access is available throughout the hostel. The network name is 'HostelNet', and the password is provided in your welcome kit. If you're having connection issues, please submit a complaint.";
    }
    
    if (query.includes('food') || query.includes('meal') || query.includes('dining')) {
      return "Meal timings: Breakfast (7-9 AM), Lunch (12-2 PM), and Dinner (7-9 PM). The weekly menu is available on the notifications page.";
    }
    
    if (query.includes('laundry')) {
      return "Laundry services are available on the ground floor. Operating hours: 8 AM to 8 PM. You can submit your clothes with your room number tag.";
    }
    
    if (query.includes('visitor') || query.includes('guest')) {
      return "Visitors are allowed from 9 AM to 8 PM. All visitors must register at the reception desk.";
    }
    
    if (query.includes('rule') || query.includes('regulation') || query.includes('policy')) {
      return "Hostel rules include: no smoking/alcohol, maintaining silence during study hours (8-10 PM), and keeping your room clean. You can find the complete rulebook in the Settings section.";
    }
    
    if (query.includes('hi') || query.includes('hello') || query.includes('hey')) {
      return `Hello ${userDetails?.name || 'there'}! How can I assist you today?`;
    }
    
    if (query.includes('thank')) {
      return "You're welcome! If you have any other questions, feel free to ask.";
    }
    
    // Default response
    return "I'm not sure about that. You can ask me about room booking, fee payments, complaints, WiFi, meals, laundry, visitors, or hostel rules.";
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages([...messages, userMessage]);
    setMessage('');
    
    // Simulate bot response after a short delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: generateResponse(message),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 600);
  };

  return (
    <>
      {/* Chatbot toggle button */}
      <Button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </Button>

      {/* Chatbot dialog */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 md:w-96 shadow-xl flex flex-col h-96 z-50">
          <div className="bg-primary text-primary-foreground p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <h3 className="font-medium">Hostel Assistant</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-primary-foreground hover:bg-primary/80">
              <X size={18} />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div 
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send size={18} />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </>
  );
};

export default ChatBot;
