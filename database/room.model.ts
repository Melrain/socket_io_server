import { ObjectId, Document } from "mongoose";
import pkg from "mongoose";
const { Schema, model, models } = pkg;

interface IRoom extends Document {
  isPlaying: boolean;
  name: string;
  host: string;
  blindSize: number;
  maxSeats: number;
  minBuyIn: number;
  maxBuyIn: number;
  deck: string[];
  players: string[];
}

const RoomSchema = new Schema<IRoom>(
  {
    isPlaying: { type: Boolean, required: true },
    name: { type: String, required: true },
    host: { type: String, required: true },
    blindSize: { type: Number, required: true },
    maxSeats: { type: Number, required: true },
    minBuyIn: { type: Number, required: true },
    maxBuyIn: { type: Number, required: true },
    deck: { type: [String], required: true },
    players: { type: [String], required: true },
  },
  {
    timestamps: true,
  }
);

const Room = models.Room || model<IRoom>("Room", RoomSchema);

export default Room;
