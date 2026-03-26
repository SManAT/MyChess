const db = require("./database")

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

  return res.status(200).json({
    authenticated: true,
    message: "Login successful 😊👌",
    token,
  })
}

async function creategame(req, res) {}

module.exports = {
  login,
  creategame,
}
