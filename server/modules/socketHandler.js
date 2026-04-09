const Game = require("../game/ChessGame")
const SQLiteDatabase = require("./database")

const games = new Map()
const players = new Map()

const logger = require("./logger").logger

function socketHandler(io) {
  //Client connects
  io.on("connection", async (socket) => {
    const db = new SQLiteDatabase("./DB/chessapp.db", { verbose: false })

    const username = socket.handshake.auth.username
    const timestamp = socket.handshake.auth.timestamp

    logger.info("Player connected:", socket.id)
    //store name and id
    db.saveSocket(username, socket.id)

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

    socket.on("get-possible-moves", ({ row, col }) => {
      const playerInfo = players.get(socket.id)
      if (!playerInfo) return

      const game = games.get(playerInfo.gameId)
      if (!game) return

      const possibleMoves = game.chessLogic.getPossibleMoves(game.board, row, col)
      socket.emit("possible-moves", { from: [row, col], moves: possibleMoves })
    })

    socket.on("disconnect", () => {
      logger.info("Player disconnected:", socket.id)

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
}

module.exports = socketHandler
