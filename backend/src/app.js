import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { initSocketServer } from "./sockets/socketServer.js";

const app = express();
const server = createServer(app);

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
import userRouter from "./routes/users.Routes.js";
import personalMessageRouter from "./routes/personalMessages.Routes.js";
import groupRouter from "./routes/group.Routes.js";
import groupMessageRouter from "./routes/groupMessage.Routes.js";
import storiesRoutes from "./routes/story.Routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/messages", personalMessageRouter);
app.use("/api/v1/group", groupRouter);
app.use("/api/v1/groupMessage", groupMessageRouter);
app.use("/api/v1/stories", storiesRoutes);

// Socket.io initialization
initSocketServer(server);

export { app, server };
