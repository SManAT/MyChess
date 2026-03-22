const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const cors = require("cors")
const gameHandler = require("./socket/gameHandler")

// load .env from root dir
require("dotenv").config({ path: path.join(__dirname, ".env") })

const app = express()
const server = http.createServer(app)

const logger = require("./modules/logger").logger

//CORS is to allow from everywhere
const io = socketIo(server, {
  cors: {},
  /*cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },*/
})
app.use(cors())

app.use(express.json())

// Basic route
app.get("/health", (req, res) => {
  res.json({ status: "Server running" })
})

// Socket handling
gameHandler(io)

const serverIP = process.env.APP_IP
const port = process.env.APP_PORT
server.listen(port, serverIP, () => {
  logger.info("MyChess Server by S.Hagmann")
  logger.info("==========================")
  logger.info(`Server running on port ${PORT}`)
})

//Graceful Shutdown
process.on("SIGINT", () => {
  logger.info("\nServer wird gestoppt...")
  loop.stop()
  server.close(() => {
    logger.info("Server beendet")
    process.exit(0)
  })
})
