import { Server } from "socket.io";

let io;

function initSocketServer(server) {
  io = new Server(server);

  io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });

    socket.on("message", (data) => {
      console.log("Received message:", data);
      io.emit("message", data);
    });
  });
}

export { initSocketServer };
