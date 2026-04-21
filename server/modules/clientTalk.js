const jwt = require("jsonwebtoken")
const SQLiteDatabase = require("./database")
const logger = require("./logger").logger
const SocketUtils = require("./socketUtils")
const connectionManager = require("./connectionManager")

const clientTalk = {
  async login(req, res) {
    const { username, password } = req.body

    const payload = {
      username: username,
      password: password,
    }
    // The Important Part to auth
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "8h",
    })
    // send cookie to client
    logger.info("Authenticated, token sent to " + username + " ...")

    //get User id from db
    const db = new SQLiteDatabase("./DB/chessapp.db", { verbose: false })
    let id = db.getUserId(username)

    return res.status(200).json({
      authenticated: true,
      userid: id,
      message: "Login successful 😊👌",
      token,
    })
  },

  async getplayers(req, res) {
    let { onlyOnline } = req.body
    if (onlyOnline === undefined) {
      onlyOnline = false
    }
    const db = new SQLiteDatabase("./DB/chessapp.db", { verbose: false })

    let allplayers = db.getPlayers(req.userid, onlyOnline)

    return res.status(200).json({
      players: allplayers,
    })
  },

  async creategame(req, res) {
    const { name, owner, player } = req.body
    const db = new SQLiteDatabase("./DB/chessapp.db", { verbose: false })
    let id = db.createNewGame(name, owner, player)

    return res.status(200).json({
      gameid: id,
    })
  },

  async getgames(req, res) {
    const db = new SQLiteDatabase("./DB/chessapp.db", { verbose: false })

    let allgames = db.getGames(req.userid)
    let game, otherplayerid, other

    for (let i = 0; i < allgames.length; i++) {
      game = allgames[i]
      if (game.player1_id === req.userid) {
        otherplayerid = game.player2_id
      } else {
        otherplayerid = game.player1_id
      }
      //add to allgames, name of other Player
      other = db.getUserStats(otherplayerid)
      game.otherplayer = other.username
      game.otheronline = other.online
    }

    return res.status(200).json({
      games: allgames,
    })
  },

  async getgamestats(req, res) {
    const db = new SQLiteDatabase("./DB/chessapp.db", { verbose: false })
    const { gameid } = req.body

    let stats = db.getGamesStats(gameid)

    return res.status(200).json({
      gamestats: stats,
    })
  },

  /**
   * Get Connection Stats
   * @param {*} req
   * @param {*} res
   */
  async stats(req, res) {
    try {
      const stats = SocketUtils.getConnectionStats()
      res.json({
        success: true,
        data: stats,
      })
    } catch (error) {
      console.error("Error getting connection stats:", error)
      res.status(500).json({
        success: false,
        message: "Failed to retrieve connection statistics",
        error: error.message,
      })
    }
  },

  /**
   * Check if user online?
   * @param {*} req
   * @param {*} res
   */
  async isonline(req, res) {
    try {
      const { username } = req.params

      if (!username) {
        return res.status(400).json({
          success: false,
          message: "Username is required",
        })
      }

      const online = SocketUtils.isUserOnline(username)
      const connections = SocketUtils.getUserConnectionCount(username)

      res.json({
        success: true,
        data: {
          username,
          online,
          connections,
          timestamp: new Date(),
        },
      })
    } catch (error) {
      console.error("Error checking user online status:", error)
      res.status(500).json({
        success: false,
        message: "Failed to check user online status",
        error: error.message,
      })
    }
  },

  async logout(req, res) {
    const { username } = req.body
    try {
      const all_sockets = connectionManager.getSocketsByUser(username)
      all_sockets.forEach((socket) => {
        connectionManager.removeConnection(socket.id)
      })

      res.json({
        success: true,
      })
      logger.info(`User ${username} logged out ...`)
    } catch (error) {}
  },
}

// Debug: Log what we're exporting
console.log("Exporting clientTalk with methods:", Object.keys(clientTalk))

module.exports = clientTalk
