const connectionManager = require("./connectionManager.js")
const socketUtils = require("./socketUtils")
const logger = require("./logger").logger

const Game = require("../game/ChessGame")

const games = new Map()
const players = new Map()

function socketHandler(io) {
  //Client connects
  io.on("connection", async (socket) => {
    const username = socket.handshake.auth.username
    const timestamp = socket.handshake.auth.timestamp

    logger.info(`Player connected: ${username}`)

    //store it
    saveSocket(socket, username, timestamp)
    logger.info(socketUtils.getConnectionStats())

    // ---------------------------------------------------------
    // Handle private messages
    socket.on("private_message", (data) => {
      const { targetUsername, message } = data

      connectionManager.updateLastActivity(socket.id)

      // Send to all connections of target user
      const targetSockets = connectionManager.getSocketsByUser(targetUsername)
      targetSockets.forEach((targetSocket) => {
        targetSocket.emit("private_message", {
          from: username,
          message,
          timestamp: new Date(),
        })
      })

      // Confirm delivery to sender
      socket.emit("message_delivered", {
        target: targetUsername,
        delivered: targetSockets.length > 0,
      })
    })

    // ---------------------------------------------------------
    socket.on("join-game", ({ playerName, gameId }) => {
      let game

      if (gameId && games.has(gameId)) {
        game = games.get(gameId)
      } else {
        // Find an available game or create new one
        game = Array.from(games.values()).find((g) => g.gameStatus === "waiting" && Object.keys(g.players).length < 2)

        if (!game) {
          game = new Game()
          games.set(game.id, game)
        }
      }

      const joined = game.addPlayer(socket.id, playerName)
      if (!joined) {
        socket.emit("join-error", "Game is full")
        return
      }

      players.set(socket.id, { gameId: game.id, playerName })
      socket.join(game.id)

      // Send game state to all players in the game
      io.to(game.id).emit("game-state", game.getGameState())

      // Send player-specific info
      socket.emit("player-joined", {
        gameId: game.id,
        playerId: socket.id,
        color: game.players[socket.id].color,
      })

      logger.info(`Player ${playerName} joined game ${game.id}`)
    })

    // ---------------------------------------------------------
    socket.on("make-move", ({ from, to }) => {
      const playerInfo = players.get(socket.id)
      if (!playerInfo) return

      const game = games.get(playerInfo.gameId)
      if (!game) return

      const moveResult = game.makeMove(socket.id, from, to)

      if (moveResult.success) {
        // Broadcast move to all players in the game
        io.to(game.id).emit("move-made", {
          from,
          to,
          gameState: game.getGameState(),
        })
      } else {
        socket.emit("move-error", moveResult.error)
      }
    })

    // ---------------------------------------------------------
    socket.on("get-possible-moves", ({ row, col }) => {
      const playerInfo = players.get(socket.id)
      if (!playerInfo) return

      const game = games.get(playerInfo.gameId)
      if (!game) return

      const possibleMoves = game.chessLogic.getPossibleMoves(game.board, row, col)
      socket.emit("possible-moves", { from: [row, col], moves: possibleMoves })
    })

    // ---------------------------------------------------------
    socket.on("disconnect", () => {
      const username = connectionManager.getUsername(socket.id)
      // manuell schon ausgelogged?
      if (username !== null){
        // Remove from connection manager
        connectionManager.removeConnection(socket.id)
        logger.info(`User ${username} logged out ...`)
      }

      const playerInfo = players.get(socket.id)
      if (playerInfo) {
        const game = games.get(playerInfo.gameId)
        if (game) {
          game.removePlayer(socket.id)
          io.to(game.id).emit("player-disconnected", {
            playerId: socket.id,
            gameState: game.getGameState(),
          })

          // Clean up empty games
          if (Object.keys(game.players).length === 0) {
            games.delete(game.id)
          }
        }
        players.delete(socket.id)
      }
    })
  })

  function saveSocket(socket, username, timestamp) {
    try {
      // Add connection to manager
      connectionManager.addConnection(socket, username, {
        timestamp,
        userAgent: socket.handshake.headers["user-agent"],
        ipAddress: socket.handshake.address,
        connectedAt: new Date(),
      })

      // Set username on socket for easy access
      socket.username = username

      // Socket Room = gruppierung von Sockets
      socket.join(`user_${username}`)

      // Optional: Notify other connections of this user about new session
      socket.to(`user_${username}`).emit("new_session", {
        socketId: socket.id,
        timestamp: new Date(),
      })

      // Send connection confirmation
      socket.emit("connected", {
        socketId: socket.id,
        connectedUsers: connectionManager.getUserCount(),
        totalConnections: connectionManager.getConnectionCount(),
      })

      // Broadcast user joined to all other users (optional)
      socket.broadcast.emit("user_joined", {
        username,
        timestamp: new Date(),
      })
    } catch (error) {
      logger.error(`Error registering player ${username}:`, error)
      socket.emit("connection_error", { message: "Failed to register connection" })
      return
    }
  }

  // Add periodic cleanup for stale connections
  setInterval(() => {
    connectionManager.cleanupStaleConnections(20 * 60 * 1000) // 20 minutes timeout
    logger.debug(`Connection cleanup completed. Active connections: ${connectionManager.getConnectionCount()}`)
  }, 60000) // Run every minute
}

module.exports = socketHandler
