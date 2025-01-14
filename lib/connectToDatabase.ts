import mongoose from "mongoose";
import "dotenv/config";

let isConnected: boolean = false;

export const connectToDatabase = async () => {
  mongoose.set("strictQuery", true);

  if (!process.env.MONGODB_URL) {
    return console.log("MISSING MONGODB_URL");
  }

  if (isConnected) {
    return;
  }

  const connectWithRetry = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URL!, {
        dbName: "poker_db",
      });
      isConnected = true;
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error(
        "Error connecting to MongoDB, retrying in 5 seconds...",
        error
      );
      setTimeout(connectWithRetry, 5000); // 5秒后重试连接
    }
  };

  await connectWithRetry();
};

// 捕获未处理的错误
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1); // 退出进程并让 nodemon 重启
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1); // 退出进程并让 nodemon 重启
});
