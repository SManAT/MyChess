const jwt = require("jsonwebtoken")
const SQLiteDatabase = require("./database")
const logger = require("./logger").logger

async function login(req, res) {
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
}

async function getplayers(req, res) {
  let { onlyOnline } = req.body
  if (onlyOnline === undefined) {
    onlyOnline = false
  }
  const db = new SQLiteDatabase("./DB/chessapp.db", { verbose: false })

  let allplayers = db.getPlayers(req.userid, onlyOnline)

  return res.status(200).json({
    players: allplayers,
  })
}

async function creategame(req, res) {
  const { name, owner, player } = req.body
  const db = new SQLiteDatabase("./DB/chessapp.db", { verbose: false })
  let id = db.createNewGame(name, owner, player)

  return res.status(200).json({
    gameid: id,
  })
}

module.exports = {
  login,
  creategame,
  getplayers,
}
