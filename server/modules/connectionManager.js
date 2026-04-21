class ConnectionManager {
  constructor() {
    this.connections = new Map() // socketId -> connection data
    this.userSockets = new Map() // username -> Set of socketIds
  }

  getUsername(socketId) {
    try {
      const connection = this.connections.get(socketId)
      return connection.username
    } catch (error) {
      return null
    }
  }

  addConnection(socket, username, metadata = {}) {
    const connectionData = {
      socket: socket,
      username: username,
      connectedAt: new Date(),
      lastActivity: new Date(),
      ...metadata,
    }

    this.connections.set(socket.id, connectionData)

    if (username) {
      if (!this.userSockets.has(username)) {
        this.userSockets.set(username, new Set())
      }
      this.userSockets.get(username).add(socket.id)
    }

    return connectionData
  }

  removeConnection(socketId) {
    const connection = this.connections.get(socketId)
    if (connection && connection.username) {
      const userSockets = this.userSockets.get(connection.username)
      if (userSockets) {
        userSockets.delete(socketId)
        if (userSockets.size === 0) {
          this.userSockets.delete(connection.username)
        }
      }
    }
    return this.connections.delete(socketId)
  }

  updateLastActivity(socketId) {
    const connection = this.connections.get(socketId)
    if (connection) {
      connection.lastActivity = new Date()
      return true
    }
    return false
  }

  /**
   * get all connected sockets
   * @param {*} username
   * @returns
   */
  getSocketsByUser(username) {
    const socketIds = this.userSockets.get(username)
    if (!socketIds) return []

    return Array.from(socketIds)
      .map((id) => this.connections.get(id)?.socket)
      .filter((socket) => socket && socket.connected)
  }

  getConnectionData(socketId) {
    return this.connections.get(socketId)
  }

  isUserOnline(username) {
    const sockets = this.userSockets.get(username)
    return sockets && sockets.size > 0
  }

  getOnlineUsers() {
    return Array.from(this.userSockets.keys())
  }

  getUserCount() {
    return this.userSockets.size
  }

  getConnectionCount() {
    return this.connections.size
  }

  getUserConnections(username) {
    const socketIds = this.userSockets.get(username)
    if (!socketIds) return []

    return Array.from(socketIds)
      .map((id) => this.connections.get(id))
      .filter(Boolean)
  }

  // Cleanup stale connections
  cleanupStaleConnections(timeoutMs = 5 * 60 * 1000) {
    const now = new Date()
    const staleConnections = []

    for (const [socketId, connection] of this.connections) {
      if (now - connection.lastActivity > timeoutMs) {
        staleConnections.push(socketId)
      }
    }

    staleConnections.forEach((socketId) => {
      const connection = this.connections.get(socketId)
      if (connection?.socket) {
        connection.socket.disconnect(true)
      }
      this.removeConnection(socketId)
    })

    return staleConnections.length
  }

  // Get connection statistics
  getStats() {
    const stats = {
      totalConnections: this.getConnectionCount(),
      uniqueUsers: this.getUserCount(),
      onlineUsers: this.getOnlineUsers(),
      connectionsPerUser: {},
      timestamp: new Date(),
    }

    // Count connections per user
    for (const [username, socketIds] of this.userSockets) {
      stats.connectionsPerUser[username] = socketIds.size
    }

    return stats
  }
}

module.exports = new ConnectionManager()
