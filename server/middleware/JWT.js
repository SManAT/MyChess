const jwt = require("jsonwebtoken")

const logger = require("../modules/logger").logger

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1] // Get token

  if (!token) return res.sendStatus(401)

  jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
    if (err) return res.sendStatus(403) // Invalid token
    req.user = userPayload
    next()
  })
}

module.exports = {
  authenticateToken,
}
