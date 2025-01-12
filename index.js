import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // 允许的源
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  if (req.query.name !== "melrain") {
    io.emit("message", "Unauthorized access");
    return res.status(401).send({ response: "Unauthorized access" });
  }
  res.send({ response: "Server is up and running." }).status(200);
});

io.on("connection", (socket) => {
  socket.on("leaveRoom", (data) => {
    const { roomId, playerId } = data;
    console.log(`Player ${playerId} left room ${roomId}`);
  });
  socket.on("joinRoom", (data) => {
    const { roomId, walletAddress } = data;
    console.log(`Player ${walletAddress} joined room ${roomId}`);
  });
});

const PORT = 8080;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
