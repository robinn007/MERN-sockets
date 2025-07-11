
import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import "./App.css";

// Helper function to get server URL
const getServerUrl = () => {
  if (process.env.REACT_APP_SERVER_URL) {
    return process.env.REACT_APP_SERVER_URL;
  }
  
  // For Codespaces, replace port 3000 with 5000
  if (window.location.hostname.includes('app.github.dev')) {
    return window.location.origin.replace('-3000.app.github.dev', '-5000.app.github.dev');
  }
  
  // For local development
  return 'http://localhost:5000'
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [room, setRoom] = useState("");
  const [socketID, setSocketId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [connectionError, setConnectionError] = useState("");
  
  const socketRef = useRef(null);

  const handleLogin = async () => {
    try {
      const serverUrl = getServerUrl();
      
      const response = await fetch(`${serverUrl}/login`, {
        method: "GET",
        credentials: "include",
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        setConnectionError("");
        initializeSocket();
      } else {
        setConnectionError("Login failed");
      }
    } catch (error) {
      setConnectionError("Login failed: " + error.message);
    }
  };

  const initializeSocket = () => {
    if (socketRef.current) return;

    const serverUrl = getServerUrl();

    socketRef.current = io(serverUrl, {
      withCredentials: true,
    });

    socketRef.current.on("connect", () => {
      setSocketId(socketRef.current.id);
      setConnectionError("");
      console.log("connected", socketRef.current.id);
    });

    socketRef.current.on("receive-message", (data) => {
      console.log("Received message:", data);
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socketRef.current.on("connect_error", (error) => {
      setConnectionError("Connection failed: " + error.message);
      console.error("Connection error:", error);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
      setSocketId("");
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (socketRef.current && message && room) {
      socketRef.current.emit("message", { room, message });
      setMessage("");
    }
  };

  const joinRoomHandler = (e) => {
    e.preventDefault();
    if (socketRef.current && roomName) {
      socketRef.current.emit("join-room", roomName);
      setRoomName("");
    }
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm">
        <Box style={{ marginTop: 32 }}>
          <Typography variant="h4" component="div" gutterBottom>
            Socket.IO Chat
          </Typography>
          <Typography variant="body1" gutterBottom>
            Please login to access the chat
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleLogin}
            style={{ marginTop: 16 }}
          >
            Login
          </Button>
          {connectionError && (
            <Alert severity="error" style={{ marginTop: 16 }}>
              {connectionError}
            </Alert>
          )}
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box style={{ marginTop: 16 }}>
        <Typography variant="h4" component="div" gutterBottom>
          Socket.IO Chat
        </Typography>
        
        <Typography variant="body2" component="div" gutterBottom>
          Socket ID: {socketID}
        </Typography>

        {connectionError && (
          <Alert severity="error" style={{ marginBottom: 16 }}>
            {connectionError}
          </Alert>
        )}

        <Box component="form" onSubmit={joinRoomHandler} style={{ marginBottom: 24 }}>
          <Typography variant="h6">Join Room</Typography>
          <TextField
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            label="Room Name"
            variant="outlined"
            size="small"
            style={{ marginRight: 8 }}
          />
          <Button type="submit" variant="contained" color="primary">
            Join
          </Button>
        </Box>

        <Box component="form" onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
          <Typography variant="h6">Send Message</Typography>
          <TextField
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            label="Message"
            variant="outlined"
            size="small"
            style={{ marginRight: 8, marginBottom: 8 }}
          />
          <TextField
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            label="Room"
            variant="outlined"
            size="small"
            style={{ marginRight: 8, marginBottom: 8 }}
          />
          <Button type="submit" variant="contained" color="primary">
            Send
          </Button>
        </Box>

        <Box>
          <Typography variant="h6">Messages:</Typography>
          <Box style={{ marginTop: 8 }}>
            {messages.map((m, i) => (
              <Paper 
                key={i} 
                style={{ 
                  padding: 8, 
                  marginBottom: 8, 
                  backgroundColor: '#f5f5f5' 
                }}
              >
                <Typography variant="body1" component="div">
                  {m}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default App;