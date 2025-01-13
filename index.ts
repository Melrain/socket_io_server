import { createRoom, getRoom, getRoomByHost } from "./lib/room.action.js";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { Request, Response } from "express";
import Room from "./database/room.model.js";
import { connectToDatabase } from "./lib/connectToDatabase.js";
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

await connectToDatabase();

// socket io
io.on("connection", (socket) => {
  Room.watch().on("change", (change) => {
    console.log(change.fullDocument);
    socket.emit(
      `${JSON.parse(JSON.stringify(change.fullDocument._id))}`,
      change.fullDocument
    );
  });
  // join room
  socket.on("join-room", async ({ room, walletAddress }) => {
    // 加入房间
    console.log("join room:", room, walletAddress);

    const findRoomRes = await getRoom({ roomId: room });
    if (findRoomRes.code !== 200) {
      console.log("room not found");
      socket.emit("join-room", { code: 400, message: "room not found" });
      return;
    }
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

  // 创建房间
  socket.on(
    "create-room",
    async (data: {
      isPlaying: boolean;
      name: string;
      host: string;
      blindSize: number;
      maxSeats: number;
      minBuyIn: number;
      maxBuyIn: number;
      deck: string[];
      players: string[];
    }) => {
      const getRoomRes = await getRoomByHost({ host: data.host });
      if (getRoomRes.code === 200) {
        console.log(`${data.host} already have a room`);
        socket.emit("create-room", {
          code: 400,
          message: `${data.host} already have a room`,
        });
        return;
      } else {
        const createRoomRes = await createRoom(data);
        if (createRoomRes.code !== 200) {
          console.log("create room failed");
          socket.emit("create-room", {
            code: 400,
            message: "create room failed",
          });
          return;
        }
        socket.emit("create-room", {
          code: 200,
          message: "create room success",
        });
      }
    }
  );
});

// database watch

// io.on("connection", (socket) => {
//   socket.emit(
//     `${JSON.parse(JSON.stringify(change.fullDocument._id))}`,
//     change.fullDocument
//   );
// });
// 这段代码是用来监听特定Document的变化
// const pipeline = [
//   {
//     $match: {
//       available: true,
//       language: "English",
//     },
//   },
// ];

// const changeStream = Trainer.watch(pipeline, { fullDocument: 'updateLookup' });
// console.log(changeStream);

const PORT = 8080;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
