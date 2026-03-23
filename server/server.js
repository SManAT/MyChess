const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const cors = require("cors")
const gameHandler = require("./modules/socket/gameHandler")
const DBINit = require("./modules/dbInit")
const path = require("path")

// load .env from root dir
require("dotenv").config({ path: path.join(__dirname, ".env") })

const app = express()
const server = http.createServer(app)

//CORS is to allow from everywhere
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})
app.use(cors())

app.use(express.json())

// Basic route
app.get("/health", (req, res) => {
  res.json({ status: "Server running" })
})

//Database init
DBINit()

// Socket handling
gameHandler(io)

const serverIP = process.env.APP_IP
const port = process.env.APP_PORT
server.listen(port, serverIP, () => {
  console.log("\nMyChess Server by S.Hagmann")
  console.log("==========================")
  console.log(`Server running on port ${serverIP}:${port}`)
})

//Graceful Shutdown
process.on("SIGINT", () => {
  console.log("\nServer wird gestoppt...")
  console.log("Server beendet")
  process.exit(0)
})
