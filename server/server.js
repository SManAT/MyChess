const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const gameHandler = require("./socket/gameHandler");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Basic route
app.get("/health", (req, res) => {
  res.json({ status: "Server running" });
});

// Socket handling
gameHandler(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
