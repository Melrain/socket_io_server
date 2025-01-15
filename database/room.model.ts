import { ObjectId, Document } from "mongoose";
import pkg from "mongoose";
const { Schema, model, models } = pkg;

export interface IRoom extends Document {
  isPlaying: boolean;
  name: string;
  host: string;
  blindSize: number;
  maxSeats: number;
  minBuyIn: number;
  maxBuyIn: number;
  deck: string[];
  players: ObjectId[];
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
    players: [
      { type: Schema.Types.ObjectId, ref: "Player" },
      { required: true },
    ],
  },
  {
    timestamps: true,
  }
);

const Room = models.Room || model<IRoom>("Room", RoomSchema);

export default Room;
