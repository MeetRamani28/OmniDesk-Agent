import { createServer } from "http";
import { Server } from "socket.io";
import app from "./src/app";

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(
    `[Server] OmniDesk-Agent backend running on http://localhost:${PORT}`,
  );
  console.log(`[Environment] ${process.env.NODE_ENV}`);
});
