import {
  createRoom,
  getAllRooms,
  getRoom,
  getRoomByHost,
} from "./lib/room.action.js";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { Request, Response } from "express";
import Room from "./database/room.model.js";
import { connectToDatabase } from "./lib/connectToDatabase.js";
import express from "express";
import { availableParallelism } from "node:os";
import cluster from "node:cluster";
import { createAdapter, setupPrimary } from "@socket.io/cluster-adapter";
import { createServer } from "node:http";
import "dotenv/config";

// async function main() {
//   const app = express();
//   app.use(cors());
//   const server = http.createServer(app);

//   const io = new Server(server, {
//     cors: {
//       origin: "http://localhost:3000", // 允许的源
//       methods: ["GET", "POST"],
//     },
//     connectionStateRecovery: {},
//   });

//   // room watch
//   await connectToDatabase().then(() => {
//     Room.watch().on("change", (change) => {
//       console.log(change.fullDocument);
//       io.emit(
//         `${JSON.parse(JSON.stringify(change.fullDocument._id))}`,
//         change.fullDocument
//       );
//     });
//   });

//   io.on("connection", (socket) => {
//     // database watch

//     // get all rooms
//     socket.on("get-all-rooms", async () => {
//       const rooms = await getAllRooms();
//       if (rooms.code === 200) {
//         socket.emit("got-all-rooms", JSON.parse(JSON.stringify(rooms)));
//       }
//     });
//     // join room
//     socket.on("join-room", async ({ room, walletAddress }) => {
//       // 加入房间
//       console.log("join room:", room, walletAddress);

//       const findRoomRes = await getRoom({ roomId: room });
//       if (findRoomRes.code !== 200) {
//         console.log("room not found");
//         socket.emit("join-room", { code: 400, message: "room not found" });
//         return;
//       }
//       socket.emit("join-room", JSON.parse(JSON.stringify(findRoomRes)));
//     });

//     socket.on("disconnect", (data) => {
//       console.log("user disconnected");
//       // 离开房间
//     });

//     // chat message
//     socket.on("message", (data) => {
//       const { room, message } = data;
//       console.log("room:", room, "message:", message);
//       // 发送消息
//     });

//     // 创建房间
//     socket.on(
//       "create-room",
//       async (data: {
//         isPlaying: boolean;
//         name: string;
//         host: string;
//         blindSize: number;
//         maxSeats: number;
//         minBuyIn: number;
//         maxBuyIn: number;
//         deck: string[];
//         players: string[];
//       }) => {
//         const getRoomRes = await getRoomByHost({ host: data.host });
//         if (getRoomRes.code === 200) {
//           console.log(`${data.host} already have a room`);
//           socket.emit("create-room", {
//             code: 400,
//             message: `${data.host} already have a room`,
//           });
//           return;
//         } else {
//           const createRoomRes = await createRoom(data);
//           if (createRoomRes.code !== 200) {
//             console.log("create room failed");
//             socket.emit("create-room", {
//               code: 400,
//               message: "create room failed",
//             });
//             return;
//           }
//           socket.emit("create-room", {
//             code: 200,
//             message: "create room success",
//             room: JSON.parse(JSON.stringify(createRoomRes.room)),
//           });
//         }
//       }
//     );
//   });

//   try {
//     server.listen(8080, () => {
//       console.log("Server is running on 8080");
//     });
//   } catch (error) {
//     console.error("Failed to start the server", error);
//   }
// }

// main().catch((err) => console.error(err));

if (cluster.isPrimary) {
  const numCPUs = availableParallelism();
  // create one worker per available core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({
      PORT: Number(process.env.PORT) + i,
    });
  }

  // set up the adapter on the primary thread
  setupPrimary();
} else {
  const app = express();
  app.use(cors());
  const server = createServer(app);
  const io = new Server(server, {
    connectionStateRecovery: {},
    cors: {
      origin: "http://localhost:3000", // 允许的源
      methods: ["GET", "POST"],
      credentials: true,
    },
    // set up the adapter on each worker thread
    adapter: createAdapter(),
  });
  await connectToDatabase().then(() => {
    Room.watch().on("change", (change) => {
      console.log(change.fullDocument);
      io.emit(
        `${JSON.parse(JSON.stringify(change.fullDocument._id))}`,
        change.fullDocument
      );
    });
  });

  io.on("connection", (socket) => {
    // database watch

    // get all rooms
    socket.on("get-all-rooms", async () => {
      const rooms = await getAllRooms();
      if (rooms.code === 200) {
        socket.emit("got-all-rooms", JSON.parse(JSON.stringify(rooms)));
      }
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
      socket.emit("join-room", JSON.parse(JSON.stringify(findRoomRes)));
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
            room: JSON.parse(JSON.stringify(createRoomRes.room)),
          });
        }
      }
    );
  });
  // each worker will listen on a distinct port
  const port = process.env.PORT;

  server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
  });
}
