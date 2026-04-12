// socketUtils.js - Helper functions for your socket handler
const connectionManager = require("./connectionManager")

class socketUtils {
  // Send message to specific user (all their connections)
  emitToUser(username, event, data) {
    const sockets = connectionManager.getSocketsByUser(username)
    sockets.forEach((socket) => {
      socket.emit(event, data)
    })
    return sockets.length
  }

  // Send message to all users except sender
  broadcastExcept(senderSocketId, event, data) {
    connectionManager.connections.forEach(({ socket }) => {
      if (socket.id !== senderSocketId) {
        socket.emit(event, data)
      }
    })
  }

  // Get online users list
  getOnlineUsersList() {
    return connectionManager.getOnlineUsers()
  }

  // Check if user is online
  isUserOnline(username) {
    return connectionManager.isUserOnline(username)
  }

  // Get user's connection count
  getUserConnectionCount(username) {
    const connections = connectionManager.getUserConnections(username)
    return connections.length
  }

  // Get all connection stats
  getConnectionStats() {
    let msg = `Connections stored: ${connectionManager.getConnectionCount()}`
    return msg
  }
}

module.exports = new socketUtils()
