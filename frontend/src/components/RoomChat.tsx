"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface RoomChatProps {
  roomId: string;
  currentUserEmail: string;
  currentUserName: string;
}

export default function RoomChat({ roomId, currentUserEmail, currentUserName }: RoomChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/chat/${roomId}?email=${encodeURIComponent(currentUserEmail)}`
      );
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, currentUserEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempMessage = newMessage;
    setNewMessage("");

    // Optimistic UI update
    setMessages(prev => [
      ...prev,
      {
        _id: Math.random().toString(),
        sender_email: currentUserEmail,
        sender_name: currentUserName,
        message: tempMessage,
        createdAt: new Date().toISOString(),
      }
    ]);

    try {
      await axios.post(`http://localhost:5000/api/chat/${roomId}`, {
        email: currentUserEmail,
        name: currentUserName,
        message: tempMessage,
      });
      // Silent fetch to sync the real ID/timestamp
      fetchMessages();
    } catch (err) {
      console.error("Failed to send", err);
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white border text-left border-slate-200 shadow-sm rounded-[2rem] overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Room Chat</h3>
          <p className="text-xs text-slate-500">Only you and your roommates can see this.</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
            <p>Say hello to your new roommates!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => {
                const isMe = msg.sender_email === currentUserEmail;
                const showHeader = idx === 0 || messages[idx - 1].sender_email !== msg.sender_email;

                return (
                  <motion.div
                    key={msg._id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx("flex flex-col w-full text-left", isMe ? "items-end" : "items-start")}
                  >
                    {showHeader && (
                      <span className="text-xs font-semibold text-slate-500 mb-1 ml-1 mr-1">
                        {isMe ? "You" : msg.sender_name}
                      </span>
                    )}
                    <div
                      className={clsx(
                        "max-w-[80%] px-4 py-2.5 rounded-2xl relative",
                        isMe
                          ? "bg-blue-600 text-white rounded-tr-sm"
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
                      )}
                    >
                      <p className="text-[15px] leading-relaxed">{msg.message}</p>
                      <span
                        className={clsx(
                          "text-[10px] mt-1 block text-right",
                          isMe ? "text-blue-200" : "text-slate-400"
                        )}
                      >
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            className="w-full bg-slate-100 outline-none border border-transparent focus:border-blue-300 focus:bg-white transition-all rounded-full py-3 pl-5 pr-14 text-slate-800 placeholder:text-slate-400"
            placeholder="Type a message..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 transition-colors rounded-full flex items-center justify-center "
          >
            <Send className="w-4 h-4 text-white -ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
