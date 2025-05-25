const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

app.use(cors());

const server = http.createServer(app);

// Update the origin to include your Vercel frontend URL
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://your-vercel-frontend.vercel.app'],
    methods: ['GET', 'POST']
  }
});

// ✅ Root route to test backend
app.get('/', (req, res) => {
  res.send('Chatbot backend is running ✅');
});

// In-memory storage for messages (per room)
const roomMessages = {}; // { roomId: [ { messageData } ] }

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // When a user joins a room
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User with ID: ${socket.id} joined room: ${room}`);

    // Filter messages from the last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const filteredMessages = (roomMessages[room] || []).filter(
      (msg) => msg.timestamp > sevenDaysAgo
    );

    // Send those to the new user only
    socket.emit('load_previous_messages', filteredMessages);
  });

  // When a message is sent
  socket.on('send_message', (data) => {
    const messageWithTimestamp = {
      ...data,
      timestamp: Date.now()
    };

    // Save message to the room's array
    if (!roomMessages[data.room]) {
      roomMessages[data.room] = [];
    }

    roomMessages[data.room].push(messageWithTimestamp);

    // Emit to everyone *except* sender
    socket.to(data.room).emit('receive_message', messageWithTimestamp);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
  });
});

// Use the PORT environment variable provided by Render
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
