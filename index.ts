import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { Request, Response } from "express";
const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // 允许的源
    methods: ["GET", "POST"],
  },
  connectionStateRecovery: {},
});

app.get("/", (req: Request, res: Response) => {
  const { username } = req.query;
  if (username !== "melrain") {
    res.status(401).send("You are not authorized to access this resource");
  }
  res.send("Hello World!");
});

// socket io
io.on("connection", (socket) => {
  // join room
  socket.on("join-room", async ({ room, walletAddress }) => {
    // 加入房间
    console.log("join room:", room, walletAddress);
  });

  socket.on("disconnect", (data) => {
    console.log("user disconnected");
    // 离开房间
  });

  // chat message
  socket.on("message", (data) => {
    const { room, message } = data;
    console.log("room:", room, "message:", message);
    // 发送消息
  });
});

const PORT = 8080;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
