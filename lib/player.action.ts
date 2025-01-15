import Player from "../database/player.model.js";
import { connectToDatabase } from "./connectToDatabase.js";

export const getPlayerByWalletAddress = async ({
  walletAddress,
}: {
  walletAddress: string;
}) => {
  try {
    await connectToDatabase();
    const player = await Player.findOne({
      walletAddress,
    });
    if (!player) {
      return { code: 404, message: "Player not found", data: null };
    }
    return { code: 200, message: "Player found", data: player };
  } catch (error) {
    console.error(error);
    return { code: 500, message: "Failed to get player", data: null };
  }
};

export const createPlayer = async ({
  walletAddress,
  name,
  coinBalance,
  isPlaying,
  currentHands,
  currentRoom,
  currentAction,
  currentRole,
}: {
  walletAddress: string;
  name: string;
  coinBalance: number;
  isPlaying: boolean;
  currentHands: string[];
  currentRoom: string;
  currentAction: string;
  currentRole: string;
}) => {
  try {
    await connectToDatabase();
    const newPlayer = await Player.create({
      walletAddress,
      name,
      coinBalance,
      isPlaying,
      currentHands,
      currentRoom,
      currentAction,
      currentRole,
    });

    if (!newPlayer) {
      return { code: 500, message: "Failed to create player", data: null };
    }
    return {
      code: 200,
      message: "Player created successfully",
      data: newPlayer,
    };
  } catch (error) {
    console.error(error);
    return { code: 500, message: "Failed to create player", data: null };
  }
};
