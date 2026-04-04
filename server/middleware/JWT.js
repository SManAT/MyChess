const jwt = require("jsonwebtoken")

const logger = require("../modules/logger").logger

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const userid = req.headers["userid"]
  const token = authHeader && authHeader.split(" ")[1] // Get token

  if (!token) return res.sendStatus(401)

  jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
    if (err) return res.sendStatus(403) // Invalid token
    req.user = userPayload
    req.userid = userid
    next()
  })
}

module.exports = {
  authenticateToken,
}
