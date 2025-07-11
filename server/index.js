const express = require("express");
const socketIo = require("socket.io");
const { createServer } = require("http");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const secretKeyJWT = "asdasdsadasdasdasdsa";
const port = 5000;

const app = express();
const server = createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.get("/ping", (req, res) => {
  res.send("Hello World pong!");
});

app.get("/login", (req, res) => {
  const token = jwt.sign({ _id: "asdasjdhkasdasdas" }, secretKeyJWT);

  res
    .cookie("token", token, { 
      httpOnly: true, 
      secure: false, // Changed to false for development (HTTP)
      sameSite: "lax" // Changed from "none" to "lax" for development
    })
    .json({
      message: "Login Success",
    });
});

io.use((socket, next) => {
  cookieParser()(socket.request, socket.request.res || {}, (err) => {
    if (err) return next(err);

    const token = socket.request.cookies.token;
    if (!token) return next(new Error("Authentication Error"));

    try {
      const decoded = jwt.verify(token, secretKeyJWT);
      socket.user = decoded; // Store user info in socket
      next();
    } catch (error) {
      next(new Error("Invalid Token"));
    }
  });
});

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);

  socket.on("message", ({ room, message }) => {
    console.log({ room, message });
    // Also emit to the sender so they can see their own message
    socket.to(room).emit("receive-message", message);
    socket.emit("receive-message", message); // Add this line to show message to sender
  });

  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`User joined room ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});