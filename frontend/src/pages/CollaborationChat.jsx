import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { FaArrowLeft, FaPaperPlane, FaPaperclip } from 'react-icons/fa';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const CollaborationChat = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  
  // Initialize Socket.IO connection
  useEffect(() => {
    socketRef.current = io('http://localhost:3000', {
      withCredentials: true
    });
    
    // Join the chat room for this issue
    socketRef.current.emit('join-chat', issueId);
    
    // Listen for incoming messages
    socketRef.current.on('receive-message', (data) => {
      // Ensure the message has the correct structure
      if (data && data.message) {
        setMessages(prevMessages => [...prevMessages, data.message]);
      }
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [issueId]);
  
  // Fetch messages and participants
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch issue details
        const issueRes = await axios.get(`http://localhost:3000/api/v1/issues/getIssue/${issueId}`, {
          withCredentials: true
        });
        
        if (issueRes.data.success) {
          setIssue(issueRes.data.data);
        }
        
        // Fetch chat messages
        const messagesRes = await axios.get(`http://localhost:3000/api/v1/chat/${issueId}`, {
          withCredentials: true
        });
        
        if (messagesRes.data.success) {
          setMessages(messagesRes.data.data);
        }
        
        // Fetch participants
        try {
          const participantsRes = await axios.get(`http://localhost:3000/api/v1/chat/${issueId}/participants`, {
            withCredentials: true
          });
          
          if (participantsRes.data.success) {
            setParticipants(participantsRes.data.data);
          }
        } catch (error) {
          console.error('Error fetching participants:', error);
          // Don't show error toast for participants, just continue with empty list
          setParticipants([]);
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
        toast.error('Failed to load chat data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [issueId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      const res = await axios.post(
        `http://localhost:3000/api/v1/chat/${issueId}`,
        { message: newMessage },
        { withCredentials: true }
      );
      
      if (res.data.success) {
        // Emit the message through Socket.IO
        socketRef.current.emit('send-message', {
          issueId,
          message: res.data.data
        });
        
        // Clear the input field
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow p-4 flex items-center">
        <button 
          onClick={() => navigate(`/issues/${issueId}`)}
          className="mr-4 text-gray-600 hover:text-gray-800"
        >
          <FaArrowLeft />
        </button>
        <div>
          <h1 className="text-xl font-semibold">Collaboration Chat</h1>
          <p className="text-sm text-gray-600">{issue?.title}</p>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Participants Sidebar */}
        <div className="w-64 bg-white shadow p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4">Participants</h2>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div 
                key={participant.id} 
                className="p-2 rounded bg-gray-50"
              >
                <p className="font-medium">{participant.name}</p>
                <p className="text-xs text-gray-500">{participant.role}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message._id}
                    className={`flex ${message.sender && message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-xs p-3 rounded-lg ${
                        message.sender && message.sender._id === user._id 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white text-gray-800'
                      }`}
                    >
                      {message.sender && message.sender._id !== user._id && (
                        <p className="text-xs font-medium mb-1">{message.sender.name}</p>
                      )}
                      <p>{message.message}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
            <div className="flex items-center">
              <button 
                type="button" 
                className="text-gray-500 hover:text-gray-700 mr-2"
              >
                <FaPaperclip />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="submit"
                className="ml-2 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600"
              >
                <FaPaperPlane />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CollaborationChat; 