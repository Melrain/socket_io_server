import { createPlayer } from "./lib/player.action.js";
import {
  createRoom,
  getAllRooms,
  getRoom,
  getRoomByHost,
  updateRoom,
} from "./lib/room.action.js";

import { Server } from "socket.io";
import cors from "cors";

import Room from "./database/room.model.js";
import { connectToDatabase } from "./lib/connectToDatabase.js";
import express, { Request, Response } from "express";
import { availableParallelism } from "node:os";
import cluster from "node:cluster";
import { createAdapter, setupPrimary } from "@socket.io/cluster-adapter";
import { createServer } from "node:http";
import "dotenv/config";
import { socketCode } from "./constants/socketCode.js";

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

  //REST API
  app.get("/", (req: Request, res: Response) => {
    const { name } = req.query;
    if (name !== "melrain") {
      res.send("You are not melrain");
      return;
    }
    res.status(200).send("Hello World");
    return;
  });

  //socket io
  await connectToDatabase().then(() => {
    const processedEvents = new Set();
    Room.watch().on("change", (change) => {
      const eventId = JSON.stringify(change.fullDocument._id); // 事件唯一ID
      console.log("change", JSON.stringify(change.fullDocument._id));
      if (processedEvents.has(eventId)) {
        return; // 如果该事件已经处理过，直接返回
      }
      if (change) {
        io.emit(socketCode.updateALlRooms, change.fullDocument);
        processedEvents.add(eventId); // 将事件标记为已处理
        return;
      }
      console.log(change.fullDocument);
      if (change.operationType === "delete") {
        io.emit(
          `${JSON.parse(JSON.stringify(change.documentKey._id))}_${
            socketCode.updateRoom
          }`,
          change.documentKey
        );
        return;
      }
      if (change.operationType === "update") {
        io.emit(socketCode.getALlRooms, change.fullDocument);
        return;
      }
      if (change.operationType === "insert") {
        io.emit(
          `${JSON.parse(JSON.stringify(change.documentKey._id))}_${
            socketCode.updateRoom
          }`,
          change.fullDocument
        );
        return;
      }
      return;
    });
  });

  io.on("connection", (socket) => {
    // database watch
    console.log("one client connected");
    // 获取房间
    socket.on(socketCode.getALlRooms, async () => {
      const rooms = await getAllRooms();
      if (rooms.code === 200) {
        socket.emit(socketCode.getALlRooms, JSON.parse(JSON.stringify(rooms)));
        return;
      } else {
        socket.emit(socketCode.getALlRooms, {
          code: 400,
          message: "get all rooms failed",
        });
        return;
      }
    });

    socket.on("disconnect", (data) => {
      console.log("user disconnected:", data);
      return;
    });

    // 加入房间
    socket.on(socketCode.joinRoom, async (data) => {
      const { walletAddress, roomId, balance } = data;

      const roomRes = await getRoom({ roomId: roomId });
      if (roomRes.code !== 200) {
        socket.emit(socketCode.joinRoom, {
          code: 400,
          message: "room not found on create player action",
        });
        console.log("room not found on create player action");
        return;
      }

      // check if player already in the room
      if (
        roomRes.data.players.some(
          (player: { walletAddress: string }) =>
            player.walletAddress === walletAddress
        )
      ) {
        socket.emit(socketCode.joinRoom, {
          code: 400,
          message: "player already in the room",
        });
        console.log("player already in the room");
        return;
      }

      // create new player
      const newPlayerRes = await createPlayer({
        walletAddress: walletAddress,
        name: walletAddress,
        coinBalance: balance,
        isPlaying: false,
        currentHands: [],
        currentRoom: roomId,
        currentAction: "waiting",
        currentRole: "observer",
      });

      if (newPlayerRes.code !== 200) {
        socket.emit(socketCode.joinRoom, {
          code: 400,
          message: "create player failed",
        });
        console.log("create player failed");
        return;
      }

      //push player's walletAddress into room players
      const updateData = {
        players: [...roomRes.data.players, newPlayerRes.data._id],
      };
      const updateRoomRes = await updateRoom({
        roomId: roomId,
        updateData: updateData,
      });
      if (updateRoomRes.code !== 200) {
        socket.emit(socketCode.joinRoom, {
          code: 400,
          message: "add player failed",
        });
        console.log("add player failed");
        return;
      }
      socket.emit(socketCode.joinRoom, {
        code: 200,
        message: "join room success",
        data: updateRoomRes.data,
      });
      console.log("join room success");
      return;
    });

    // 创建房间
    socket.on(
      socketCode.createRoom,
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
          socket.emit(socketCode.createRoom, {
            code: 400,
            message: `${data.host} already have a room`,
          });
          return;
        } else {
          const createRoomRes = await createRoom(data);
          if (createRoomRes.code !== 200) {
            console.log("create room failed");
            socket.emit(socketCode.createRoom, {
              code: 400,
              message: "create room failed",
            });
            return;
          }
          socket.emit(socketCode.createRoom, {
            code: 200,
            message: "create room success",
            room: JSON.parse(JSON.stringify(createRoomRes.room)),
          });
          return;
        }
      }
    );
  });
  // each worker will listen on a distinct port
  const port = process.env.PORT;

  server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
    return;
  });
}
