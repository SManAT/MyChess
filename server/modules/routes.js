var express = require("express")
var router = express.Router()
const jwt = require("jsonwebtoken")
const logger = require("./logger").logger

//const { clientLogin, authenticateToken } = require("../middleware/JWT.js")

router.post("/login", async (req, res) => {
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

  return res.status(200).json({
    authenticated: true,
    message: "Login successful 😊👌",
    token,
  })
})

// middleware routes
/*
router.post("/register", checkMySQLDataReady, authenticateToken, clientService.registerClient)
router.post("/getinfos", checkMySQLDataReady, authenticateToken, clientService.getInfos)
router.post("/ping", checkMySQLDataReady, authenticateToken, clientService.Ping)

router.post("/getpage", checkMySQLDataReady, authenticateToken, clientService.getPage)
router.post("/lockClient", checkMySQLDataReady, authenticateToken, clientService.lockClient)
router.post("/sendFile2Me", checkMySQLDataReady, authenticateToken, clientService.sendFile)
*/
module.exports = router
