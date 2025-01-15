import { ObjectId, Document } from "mongoose";
import pkg from "mongoose";
const { Schema, model, models } = pkg;

export interface IPlayer extends Document {
  walletAddress: string;
  name: string;
  coinBalance: number;
  isPlaying: boolean;
  currentHands: string[];
  currentRoom: ObjectId;
  currentAction: string;
  currentRole: string;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    walletAddress: { type: String, required: true },
    name: { type: String, required: true },
    coinBalance: { type: Number, required: true },
    isPlaying: { type: Boolean, required: true },
    currentHands: { type: [String], required: true },
    currentRoom: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    currentAction: { type: String, required: true },
    currentRole: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Player = models.Player || model<IPlayer>("Player", PlayerSchema);

export default Player;
