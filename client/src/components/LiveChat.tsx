import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
  };
}

export default function LiveChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { data: initialMessages } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    retry: false,
  });

  // Initialize messages
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages.reverse()); // Reverse to show newest at bottom
    }
  }, [initialMessages]);

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
      setWs(socket);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chat") {
        setMessages(prev => [...prev, data.message]);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setWs(null);
    };

    return () => {
      socket.close();
    };
  }, []);

  // Auto scroll to bottom only when user sends a message or initially loads
  useEffect(() => {
    if (messages.length > 0) {
      // Only auto-scroll if user is near the bottom of the chat
      const container = messagesEndRef.current?.parentElement;
      if (container) {
        const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
        if (isNearBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !ws || !user) return;

    ws.send(JSON.stringify({
      type: "chat",
      userId: user.id,
      message: message.trim(),
    }));

    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const getDisplayName = (user: any) => {
    if (user.firstName) {
      return user.firstName + (user.lastName ? ` ${user.lastName.charAt(0)}.` : '');
    }
    return user.email?.split('@')[0] || 'Anonymous';
  };

  const getAvatarUrl = (user: any) => {
    return user.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=50&h=50";
  };

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <h3 className="text-3xl font-bold text-center mb-12">Live Community Chat</h3>
        
        <div className="max-w-4xl mx-auto">
          <Card className="glass-effect overflow-hidden">
            <div className="bg-gradient-to-r from-[hsl(220,91%,57%)] to-[hsl(258,90%,66%)] p-4">
              <h4 className="text-lg font-semibold flex items-center">
                <MessageCircle className="mr-2 h-5 w-5" />
                Global Chat - {ws ? 'Connected' : 'Connecting...'}
              </h4>
            </div>
            
            <CardContent className="p-0">
              {/* Messages */}
              <div 
                className="h-96 p-4 overflow-y-auto space-y-3 custom-scrollbar"
                data-testid="chat-messages-container"
              >
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className="flex items-start space-x-3"
                    data-testid={`chat-message-${msg.id}`}
                  >
                    <img
                      src={getAvatarUrl(msg.user)}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                      data-testid={`img-avatar-${msg.id}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span 
                          className="font-semibold text-[hsl(220,91%,57%)]"
                          data-testid={`text-username-${msg.id}`}
                        >
                          {getDisplayName(msg.user)}
                        </span>
                        <span 
                          className="text-xs text-[hsl(215,13%,45%)]"
                          data-testid={`text-timestamp-${msg.id}`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p 
                        className="text-[hsl(215,13%,45%)]"
                        data-testid={`text-message-${msg.id}`}
                      >
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))}
                
                {messages.length === 0 && (
                  <div className="text-center text-[hsl(215,13%,45%)] py-8">
                    No messages yet. Be the first to say hello! 👋
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input */}
              <div className="p-4 border-t border-[hsl(220,91%,57%)]/20">
                <div className="flex space-x-3">
                  <Input
                    type="text"
                    placeholder={user ? "Type your message..." : "Sign in to chat"}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={!ws || !user}
                    className="flex-1 bg-[hsl(240,18%,8%)]/50 border-[hsl(220,91%,57%)]/20 text-white placeholder-[hsl(215,13%,45%)]"
                    data-testid="input-chat-message"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!message.trim() || !ws || !user}
                    className="bg-gradient-to-r from-[hsl(220,91%,57%)] to-[hsl(258,90%,66%)] hover:shadow-lg hover:shadow-[hsl(220,91%,57%)]/25 transition-all duration-300"
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
