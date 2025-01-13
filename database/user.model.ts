import { Document, Schema, model, models } from "mongoose";

interface IUser extends Document {
  name: string;
  email: string;
  walletAddress: string;
  privateKey: string;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  walletAddress: {
    type: String,
    required: true,
  },
  privateKey: {
    type: String,
    required: true,
    select: false,
  },
});

const User = models.User || model<IUser>("User", UserSchema);

export default User;
