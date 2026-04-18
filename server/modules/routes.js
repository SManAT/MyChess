var express = require("express")
var router = express.Router()

const client = require("./clientTalk")
const { authenticateToken } = require("../middleware/JWT.js")

router.post("/login", client.login)
router.post("/logout", authenticateToken, client.logout)

router.post("/getplayers", authenticateToken, client.getplayers)
router.post("/creategame", authenticateToken, client.creategame)
router.post("/getgames", authenticateToken, client.getgames)
router.post("/getgamestats", authenticateToken, client.getgamestats)

router.post("/stats", authenticateToken, client.stats)
router.post("/user/:username/online", authenticateToken, client.isonline)

// middleware routes
/*
router.post("/getinfos", checkMySQLDataReady, authenticateToken, clientService.getInfos)
router.post("/ping", checkMySQLDataReady, authenticateToken, clientService.Ping)

router.post("/getpage", checkMySQLDataReady, authenticateToken, clientService.getPage)
router.post("/lockClient", checkMySQLDataReady, authenticateToken, clientService.lockClient)
router.post("/sendFile2Me", checkMySQLDataReady, authenticateToken, clientService.sendFile)
*/
module.exports = router
