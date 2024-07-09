import mongoose from "mongoose";

const DB_NAME = "ChatWebApp";
const DB_URL = `mongodb://127.0.0.1:27017/${DB_NAME}`;

const connectDB = async () => {
  try {
    await mongoose.connect(DB_URL);
    console.log("⭐ MONGODB Connection successful to ChatWebApp Database");
  } catch (error) {
    console.error("MONGODB connection failed !!! ", error);
    process.exit(1);
  }
};

export default connectDB;
