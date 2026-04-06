const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const cors = require("cors")
const gameHandler = require("./modules/socket/gameHandler")
const DBINit = require("./modules/dbInit")
const path = require("path")
const listEndpoints = require("express-list-endpoints")

const router = require("./modules/routes.js")

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

//routes, mount as app middleware
app.use("/api", router)

if (process.env.DEBUG) {
  // After setting up all routes
  console.log("All registered endpoints:")
  console.table(listEndpoints(app))
}

//Database init
//DBINit({ init: false, backupData: true })
DBINit({ init: true, backupData: true })

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
