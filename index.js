const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Allowed origins: localhost for dev + your Vercel frontend URL
const allowedOrigins = [
  "http://localhost:3000",
  "https://chatbot-frontend-xyz1.vercel.app"
];

// CORS middleware with origin logging for debugging
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("CORS Origin:", origin); // Log origin to see incoming requests
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Setup Socket.IO server with matching CORS config
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("send_message", (data) => {
    console.log("Received message:", data);
    // Broadcast the message to all other connected clients except sender
    socket.broadcast.emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Simple test endpoint
app.get("/", (req, res) => {
  res.send("Chatbot backend running.");
});

// Healthcheck endpoint for Render or uptime checks
app.get("/healthcheck", (req, res) => {
  res.json({ status: "ok" });
});

// Catch-all 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).send("Route not found");
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed Origins: ${allowedOrigins.join(", ")}`);
});
