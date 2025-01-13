import Room from "../database/room.model.js";
import { connectToDatabase } from "./connectToDatabase.js";

export const getRoom = async ({ roomId }: { roomId: string }) => {
  try {
    await connectToDatabase();
    const room = await Room.findById(roomId);
    if (room) {
      return { room: room, code: 200 };
    } else {
      return { code: 400 };
    }
  } catch (error) {
    console.log(error);
    return { error: error, code: 400 };
  }
};

export const getRoomByHost = async ({ host }: { host: string }) => {
  try {
    await connectToDatabase();
    const room = await Room.findOne({ host: host });
    if (room) {
      return { room: room, code: 200 };
    } else {
      return { code: 400 };
    }
  } catch (error) {
    console.error(error);
    return { error: error, code: 400 };
  }
};

export const createRoom = async ({
  isPlaying,
  name,
  host,
  blindSize,
  maxSeats,
  minBuyIn,
  maxBuyIn,
  deck,
  players,
}: {
  isPlaying: boolean;
  name: string;
  host: string;
  maxSeats: number;
  blindSize: number;
  minBuyIn: number;
  maxBuyIn: number;
  deck: string[];
  players: string[];
}) => {
  try {
    await connectToDatabase();
    const room = await Room.create({
      isPlaying,
      name,
      host,
      blindSize,
      maxSeats,
      minBuyIn,
      maxBuyIn,
      deck,
      players,
    });
    if (room) {
      return { room: room, code: 200 };
    }
    return { code: 400 };
  } catch (error) {
    console.error(error);
    return { error: error, code: 400 };
  }
};
